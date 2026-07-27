import { MarkdownView, Plugin, TFile, normalizePath, setIcon } from "obsidian";
import { CoverPicker } from "./coverPicker";

const HEADER_CLASS = "notioneer-note-header";

/** Frontmatter key the cover image path is stored under. Plain YAML on purpose — a note
    keeps working (and the cover stays findable) without this plugin installed. */
const COVER_KEY = "cover";

/** Renders the Notion-style header — cover image plus editable title — at the top of every
    Markdown editor.

    The element is prepended to the editor's `.cm-sizer`, so it scrolls with the note and
    inherits the reading width. Obsidian's own properties panel lives in that same container
    just below, which is why this plugin doesn't reimplement a properties editor. Reading
    view has no `.cm-sizer` and is intentionally left alone. */
export class NoteHeader {
	constructor(
		private plugin: Plugin,
		private isEnabled: () => boolean,
	) {
		const { workspace, metadataCache } = plugin.app;
		plugin.registerEvent(workspace.on("layout-change", () => this.refreshAll()));
		plugin.registerEvent(workspace.on("file-open", () => this.refreshAll()));
		plugin.registerEvent(workspace.on("active-leaf-change", () => this.refreshAll()));
		plugin.registerEvent(metadataCache.on("changed", () => this.refreshAll()));
		plugin.register(() => this.removeAll());
		workspace.onLayoutReady(() => this.refreshAll());
	}

	refreshAll(): void {
		for (const leaf of this.plugin.app.workspace.getLeavesOfType("markdown")) {
			this.render(leaf.view as MarkdownView);
		}
	}

	private removeAll(): void {
		document.querySelectorAll(`.${HEADER_CLASS}`).forEach((el) => el.remove());
	}

	private render(view: MarkdownView): void {
		const sizer = view.contentEl.querySelector(".cm-sizer");
		const file = view.file;
		const existing = sizer?.querySelector<HTMLElement>(`:scope > .${HEADER_CLASS}`);

		if (!sizer || !file || !this.isEnabled()) {
			existing?.remove();
			return;
		}

		// Repainting would steal focus mid-rename; the title is already in sync anyway.
		if (existing?.contains(document.activeElement)) return;

		const header = existing ?? createDiv({ cls: HEADER_CLASS });
		header.empty();
		this.paintCover(header, file);
		this.paintTitle(header, file);
		if (!existing) sizer.prepend(header);
	}

	private paintCover(header: HTMLElement, file: TFile): void {
		const url = this.coverUrl(file);
		if (url) {
			const cover = header.createDiv({ cls: "notioneer-cover" });
			cover.style.backgroundImage = `url("${url.replace(/"/g, '\\"')}")`;
		}

		const actions = header.createDiv({ cls: "notioneer-header-actions" });
		this.addAction(actions, url ? "image" : "image-plus", url ? "Change cover" : "Add cover", () =>
			new CoverPicker(this.plugin.app, (image) => this.setCover(file, image.path)).open(),
		);
		if (url) {
			this.addAction(actions, "trash-2", "Remove cover", () => this.setCover(file, null));
		}
	}

	private addAction(
		parent: HTMLElement,
		icon: string,
		label: string,
		onClick: () => void,
	): void {
		const button = parent.createEl("button", { cls: "notioneer-header-action", text: label });
		const iconEl = createSpan();
		setIcon(iconEl, icon);
		button.prepend(iconEl);
		button.addEventListener("click", onClick);
	}

	private paintTitle(header: HTMLElement, file: TFile): void {
		const input = header.createEl("input", {
			cls: "notioneer-title",
			type: "text",
			value: file.basename,
		});
		input.placeholder = "Untitled";

		input.addEventListener("keydown", (event) => {
			if (event.key === "Enter") input.blur();
			if (event.key === "Escape") {
				input.value = file.basename;
				input.blur();
			}
		});
		input.addEventListener("blur", () => void this.rename(file, input));
	}

	private async rename(file: TFile, input: HTMLInputElement): Promise<void> {
		const name = input.value.trim();
		if (!name || name === file.basename) {
			input.value = file.basename;
			return;
		}

		const folder = file.parent?.path ?? "";
		const target = normalizePath(`${folder}/${name}.${file.extension}`);
		try {
			await this.plugin.app.fileManager.renameFile(file, target);
		} catch (error) {
			// Most often a name collision or an illegal character — Obsidian shows its own
			// notice, so just put the old name back.
			console.error("Notioneer: rename failed", error);
			input.value = file.basename;
		}
	}

	/** Resolves the `cover` frontmatter value to something an `<img>`/CSS url can load:
	    an external URL as-is, a vault path through the resource path. */
	private coverUrl(file: TFile): string | null {
		const raw = this.plugin.app.metadataCache.getFileCache(file)?.frontmatter?.[COVER_KEY];
		if (typeof raw !== "string" || raw.trim() === "") return null;

		const value = raw.trim().replace(/^!?\[\[/, "").replace(/\]\]$/, "");
		if (/^https?:\/\//.test(value)) return value;

		const image = this.plugin.app.metadataCache.getFirstLinkpathDest(value, file.path);
		return image ? this.plugin.app.vault.getResourcePath(image) : null;
	}

	private setCover(file: TFile, path: string | null): void {
		void this.plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (path === null) delete frontmatter[COVER_KEY];
			else frontmatter[COVER_KEY] = path;
		});
	}
}
