import { IconFileTypeAdapter } from "adapters/icons/iconsAdapter";
import { ImageFileTypeAdapter } from "adapters/image/imageAdapter";
import { LocalStorageCache } from "adapters/mdb/localCache/localCache";
import { MobileCachePersister } from "adapters/mdb/localCache/localCacheMobile";
import { MDBFileTypeAdapter } from "adapters/mdb/mdbAdapter";
import { ObsidianAssetManager } from "adapters/obsidian/assets/ObsidianAssetManager";
import { ObsidianCommands } from "adapters/obsidian/commands/obsidianCommands";
import { ObsidianFileSystem } from "adapters/obsidian/filesystem/filesystem";
import { ObsidianCanvasFiletypeAdapter } from "adapters/obsidian/filetypes/canvasAdapter";
import { JSONFiletypeAdapter } from "adapters/obsidian/filetypes/jsonAdapter";
import { ObsidianMarkdownFiletypeAdapter } from "adapters/obsidian/filetypes/markdownAdapter";
import { ObsidianUI } from "adapters/obsidian/ui/ui";
import { getAbstractFileAtPath } from "adapters/obsidian/utils/file";
import { replaceInlineContext } from "adapters/obsidian/utils/markdownPost";
import { CLIManager } from "core/middleware/commands";
import { DEFAULT_SETTINGS } from "core/schemas/settings";
import { WebSpaceAdapter } from "core/spaceManager/webAdapter/webAdapter";
import { Superstate } from "core/superstate/superstate";
// Imported from their own modules, not from the `makemd-core` barrel: the barrel re-exports
// the whole plugin, which would keep every removed subsystem reachable and in the bundle.
import { FilesystemMiddleware } from "core/middleware/filesystem";
import { UIManager } from "core/middleware/ui";
import { FilesystemSpaceAdapter } from "core/spaceManager/filesystemAdapter/filesystemAdapter";
import { SpaceManager } from "core/spaceManager/spaceManager";
import {
	MarkdownView,
	Platform,
	Plugin,
	TAbstractFile,
	TFile,
	WorkspaceLeaf,
	normalizePath,
} from "obsidian";
import { IMakeMDPlugin } from "shared/types/makemd";
import { LocalCachePersister } from "shared/types/persister";
import { modifyFlowDom } from "./adapters/obsidian/inlineContextLoader";
import { NotioneerSettingsTab } from "./adapters/obsidian/notioneerSettings";

import "css/DefaultVibe.css";
import "css/Editor/Properties/DatePicker.css";
import "css/Menus/ColorPicker.css";
import "css/Menus/Menu.css";
import "css/Menus/StickerMenu.css";
import "css/Modal/Modal.css";
import "css/Obsidian/Mods.css";
import "css/Panels/FileContext.css";
import "css/System/Settings.css";
import "css/UI/Buttons.css";

/** Notioneer's entry point.

    A rewrite of make.md's `main.ts` rather than their file with lines commented out. The
    bootstrap sequence — filesystem middleware, adapters, `Superstate`, cache persister,
    assets — is theirs and has to keep this order. Everything that registered a view, a
    command, the navigator, the space views or the `.mdb`/`.mkit`/`.html` editors is gone,
    along with the code behind it.

    What remains is what the note header needs: the Superstate index, the Obsidian adapters
    feeding it, and the inline-context loader that mounts the header into the editor.

    See docs/ARCHITECTURE.md for what was removed and why the rest has to stay. */
export default class NotioneerPlugin extends Plugin implements IMakeMDPlugin {
	files: FilesystemMiddleware;
	obsidianAdapter: ObsidianFileSystem;
	mdbFileAdapter: MDBFileTypeAdapter;
	markdownAdapter: ObsidianMarkdownFiletypeAdapter;

	activeEditorView?: MarkdownView;

	superstate: Superstate;
	ui: ObsidianUI;

	async onload() {
		const settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		this.mdbFileAdapter = new MDBFileTypeAdapter(this);
		this.files = FilesystemMiddleware.create();
		this.obsidianAdapter = new ObsidianFileSystem(
			this,
			this.files,
			normalizePath(this.manifest.dir + "/Spaces.mdb"),
		);
		this.files.initiateFileSystemAdapter(this.obsidianAdapter, true);
		this.markdownAdapter = new ObsidianMarkdownFiletypeAdapter(this);
		this.files.initiateFiletypeAdapter(this.mdbFileAdapter);
		this.files.initiateFiletypeAdapter(this.markdownAdapter);
		this.files.initiateFiletypeAdapter(new ObsidianCanvasFiletypeAdapter(this));
		this.files.initiateFiletypeAdapter(new JSONFiletypeAdapter(this));
		this.files.initiateFiletypeAdapter(new ImageFileTypeAdapter(this));
		this.files.initiateFiletypeAdapter(new IconFileTypeAdapter(this));

		const filesystemAdapter = new FilesystemSpaceAdapter(this.files, settings.spaceSubFolder);
		this.ui = new ObsidianUI(this);
		this.superstate = Superstate.create(
			"0.9",
			() => this.refreshHeader(),
			new SpaceManager(),
			UIManager.create(this.ui),
			CLIManager.create(new ObsidianCommands(this)),
		);
		await this.loadSettings();

		this.superstate.spaceManager.addSpaceAdapter(filesystemAdapter, true);
		this.superstate.spaceManager.addSpaceAdapter(new WebSpaceAdapter());
		this.superstate.saveSettings = () => this.saveSettings();

		const cacheKeys = ["path", "space", "frame", "context", "icon"];
		const cachePersister: LocalCachePersister = Platform.isMobile
			? new MobileCachePersister(".makemd/superstate.mdc", this.mdbFileAdapter, cacheKeys)
			: new LocalStorageCache(".makemd/superstate.mdc", this.mdbFileAdapter, cacheKeys);
		if (this.superstate.settings.cacheIndex) await cachePersister.initialize();
		this.superstate.persister = cachePersister;
		this.superstate.assets = new ObsidianAssetManager(
			this.superstate.spaceManager,
			this.superstate.ui,
			cachePersister,
			this,
		);

		this.loadSuperstate();
		this.loadInlineContext();
		this.addSettingTab(new NotioneerSettingsTab(this.app, this));
	}

	/** make.md indexes the whole vault when spaces are enabled; with spaces off it loads the
	    cached index instead, which is the only path this plugin takes. */
	private loadSuperstate(): void {
		this.app.workspace.onLayoutReady(async () => {
			await this.superstate.loadFromCache();
			this.superstate.initialize();

			this.registerEvent(this.app.vault.on("delete", this.onFileChange));
			this.registerEvent(this.app.vault.on("rename", this.onFileChange));
			this.registerEvent(
				this.app.metadataCache.on("changed", (file: TFile) =>
					this.markdownAdapter.metadataChange(file),
				),
			);
			this.refreshHeader();
		});
	}

	private loadInlineContext(): void {
		this.registerMarkdownPostProcessor((element, context) =>
			replaceInlineContext(this, element, context),
		);
		document.body.classList.toggle(
			"mk-inline-context-enabled",
			this.superstate.settings.inlineContext,
		);

		this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.refreshHeader()));
		this.registerEvent(this.app.workspace.on("layout-change", () => this.refreshHeader()));
	}

	/** Mounts (or re-mounts) the header on the active Markdown editor. Upstream drives this
	    from `activeFileChange`, which also handled space views and tab stickers. */
	refreshHeader(): void {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view?.file) return;
		modifyFlowDom(this);
		if (this.superstate.ui.activePath !== view.file.path) {
			this.superstate.ui.setActivePath(view.file.path);
		}
		this.superstate.ui.setActiveState(view.getState());
	}

	/** Required by `IMakeMDPlugin`: upstream components call it to follow a link. Without
	    space views this is only ever a note. */
	openPath = async (leaf: WorkspaceLeaf, path: string, _flow?: boolean): Promise<void> => {
		const file = getAbstractFileAtPath(this.app, path);
		if (file instanceof TFile) await leaf.openFile(file);
	};

	private onFileChange = (_file: TAbstractFile) => {
		this.refreshHeader();
	};

	async loadSettings() {
		this.superstate.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(refresh = true) {
		await this.saveData(this.superstate.settings);
		this.obsidianAdapter.pathLastUpdated.set(
			normalizePath(this.manifest.dir + "/data.json"),
			Date.now(),
		);
		if (refresh) this.superstate.dispatchEvent("settingsChanged", null);
	}

	onunload() {
		document.body.classList.remove("mk-inline-context-enabled");
	}
}
