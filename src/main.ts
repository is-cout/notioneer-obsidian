import { normalizePath, Plugin } from "obsidian";
import { SlashSuggest } from "./notioneer-slash/suggest";
import { SelectionToolbar } from "./notioneer-toolbar/selectionToolbar";
import { DEFAULT_SETTINGS, NotioneerSettings } from "./settings";
import { NotioneerSettingsTab } from "./settingsTab";
import { createUI } from "./ui/createUI";
import { createHeaderApi } from "./ui/header/api";
import { HeaderManager } from "./ui/header/mount";
import { UI } from "./ui/ui";

import "css/DefaultVibe.css";
import "css/Editor/Actions/Actions.css";
import "css/Editor/Context/FilterBar.css";
import "css/Editor/Flow/FlowEditor.css";
import "css/Editor/Flow/Properties.css";
import "css/Editor/Properties/DatePicker.css";
import "css/Menus/InlineMenu.css";
import "css/Menus/MainMenu.css";
import "css/Menus/Menu.css";
import "css/Menus/StickerMenu.css";
import "css/Modal/Modal.css";
import "css/Obsidian/Mods.css";
import "css/Panels/FileContext.css";
import "css/Panels/Navigator/FileTree.css";
import "css/Panels/Navigator/Focuses.css";
import "css/Panels/Navigator/Navigator.css";
import "css/Panels/SpaceEditor.css";
import "css/SpaceViewer/Layout.css";
import "css/SpaceViewer/SpaceView.css";
import "css/SpaceViewer/TableView.css";
import "css/UI/Buttons.css";
import "css/notioneer.css";

/** Index caches written by 1.0.x, which kept make.md's index; nothing reads them anymore. */
const STALE_FILES = ["superstate-cache.json", "file-cache.json"];

export default class NotioneerPlugin extends Plugin {
	settings: NotioneerSettings;
	/** Everything in data.json, including make.md keys this version no longer reads, so
	    saving does not drop them. */
	private data: Record<string, unknown> = {};
	private ui: UI;
	private headers: HeaderManager;

	onload() {
		void this.setup();
	}

	private async setup() {
		await this.loadSettings();
		this.ui = createUI();
		this.register(() => this.ui.inputManager.destroy());

		const api = createHeaderApi(this.app, this.ui, this.settings, () => void this.saveSettings(false));
		this.headers = this.addChild(new HeaderManager(this, api));

		this.registerEditorSuggest(new SlashSuggest(this.app, () => this.settings.notioneerSlashCommands));
		new SelectionToolbar(this, () => this.settings.notioneerSelectionToolbar);
		this.addSettingTab(new NotioneerSettingsTab(this.app, this));

		this.app.workspace.onLayoutReady(() => void this.removeStaleFiles());
	}

	async loadSettings() {
		const loaded: unknown = await this.loadData();
		this.data = loaded && typeof loaded === "object" ? (loaded as Record<string, unknown>) : {};
		const settings: Record<string, unknown> = { ...DEFAULT_SETTINGS };
		for (const key of Object.keys(DEFAULT_SETTINGS)) {
			if (typeof this.data[key] === typeof settings[key]) settings[key] = this.data[key];
		}
		this.settings = settings as NotioneerSettings;
	}

	/** Saves settings; by default also re-renders the headers so layout settings apply. */
	async saveSettings(rerender = true) {
		this.data = { ...this.data, ...this.settings };
		await this.saveData(this.data);
		if (rerender) this.headers.rerender();
	}

	private async removeStaleFiles() {
		const { adapter } = this.app.vault;
		for (const name of STALE_FILES) {
			const path = normalizePath(`${this.manifest.dir}/${name}`);
			if (await adapter.exists(path)) await adapter.remove(path);
		}
	}
}
