import { MarkdownView, Menu, Plugin, TFile, normalizePath, setIcon } from "obsidian";
import { CoverPicker } from "./coverPicker";
import { NewPropertyModal } from "./newPropertyModal";

const HEADER_CLASS = "notioneer-inline-context";

/** Body class that hides Obsidian's own inline title and properties panel while the
    Notioneer header is rendering them instead. */
const ENABLED_BODY_CLASS = "notioneer-inline-context-enabled";

/** Frontmatter key holding the cover image — the same key make.md's banner uses, so a
    vault that already has covers keeps them. Plain YAML: the note still makes sense
    without this plugin. */
const COVER_KEY = "cover";

/** Notion-style note header, structured after make.md's `MarkdownHeaderView`: banner
    image, the note title overlapping its bottom edge, then the note's properties.

    Layout notes, all inherited from make.md:
    - The element is prepended to the editor's `.cm-sizer`, which spans the full editor
      width — that is what lets the banner bleed past the reading width while the title
      and properties stay inside it (`--file-line-width` / `--file-margins`).
    - With a banner, the title block is pulled up by 34px so it overlaps the image.
    - Colours come from Obsidian's own theme variables (`--text-muted`, `--file-line-width`,
      …), which is why the header follows whatever theme is active. make.md aliases those
      into `--mk-ui-*` first; we use the Obsidian variables directly.

    Only source/Live Preview is handled — reading view has no `.cm-sizer` and keeps
    Obsidian's native properties panel. */
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
		plugin.register(() => {
			document.body.removeClass(ENABLED_BODY_CLASS);
			document.querySelectorAll(`.${HEADER_CLASS}`).forEach((el) => el.remove());
		});
		workspace.onLayoutReady(() => this.refreshAll());
	}

	refreshAll(): void {
		document.body.toggleClass(ENABLED_BODY_CLASS, this.isEnabled());
		for (const leaf of this.plugin.app.workspace.getLeavesOfType("markdown")) {
			this.render(leaf.view as MarkdownView);
		}
	}

	private render(view: MarkdownView): void {
		const sizer = view.contentEl.querySelector(".cm-sizer");
		const file = view.file;
		const existing = sizer?.querySelector<HTMLElement>(`:scope > .${HEADER_CLASS}`);

		if (!sizer || !file || !this.isEnabled()) {
			existing?.remove();
			return;
		}

		// A repaint would blow away the caret; the DOM is already what the user typed.
		if (existing?.contains(document.activeElement)) return;

		const header = existing ?? createDiv({ cls: HEADER_CLASS });
		header.empty();

		const cover = this.coverSource(file);
		this.paintBanner(header, file, cover);
		this.paintTitle(header, file, cover !== null);
		this.paintProperties(header, file);

		// Prepend rather than append: Obsidian re-inserts its own children on view changes.
		if (header.parentElement !== sizer || sizer.firstElementChild !== header) {
			sizer.prepend(header);
		}
	}

	// --- banner -------------------------------------------------------------

	private paintBanner(header: HTMLElement, file: TFile, cover: string | null): void {
		if (cover !== null) {
			const banner = header.createDiv({ cls: "notioneer-banner" });
			// An <img> rather than a CSS background: resource paths contain characters
			// (spaces, #, %) that would need escaping inside url().
			banner.createEl("img", { attr: { src: cover, alt: "" } });
		}

		const buttons = header.createDiv({
			cls: `notioneer-banner-buttons${cover !== null ? " notioneer-over-banner" : ""}`,
		});
		this.addButton(buttons, "image", cover !== null ? "Change cover" : "Add cover", () =>
			new CoverPicker(this.plugin.app, (image) =>
				this.saveFrontmatter(file, (fm) => {
					fm[COVER_KEY] = image.path;
				}),
			).open(),
		);
		if (cover !== null) {
			this.addButton(buttons, "trash-2", "Remove cover", () =>
				this.saveFrontmatter(file, (fm) => delete fm[COVER_KEY]),
			);
		}
	}

	private addButton(
		parent: HTMLElement,
		icon: string,
		label: string,
		onClick: () => void,
	): void {
		const button = parent.createEl("button", { cls: "notioneer-hover-button" });
		const iconEl = button.createSpan();
		setIcon(iconEl, icon);
		button.createSpan({ text: label });
		button.addEventListener("click", onClick);
	}

	/** Resolves the `cover` value to something an `<img>` can load: an external URL as-is,
	    a vault path (bare or wrapped in `[[ ]]`) through the resource path. */
	private coverSource(file: TFile): string | null {
		const raw = this.plugin.app.metadataCache.getFileCache(file)?.frontmatter?.[COVER_KEY];
		if (typeof raw !== "string" || raw.trim() === "") return null;

		const value = raw.trim().replace(/^!?\[\[/, "").replace(/\]\]$/, "");
		if (/^(https?|data|app):/.test(value)) return value;

		const image =
			this.plugin.app.metadataCache.getFirstLinkpathDest(value, file.path) ??
			this.plugin.app.vault.getAbstractFileByPath(normalizePath(value));
		return image instanceof TFile ? this.plugin.app.vault.getResourcePath(image) : null;
	}

	// --- title --------------------------------------------------------------

	private paintTitle(header: HTMLElement, file: TFile, hasBanner: boolean): void {
		const wrapper = header.createDiv({
			cls: `notioneer-header-title${hasBanner ? " notioneer-has-banner" : ""}`,
		});
		// `inline-title` is Obsidian's own class, so the title picks up the active theme's
		// note-title styling instead of an approximation of it.
		const title = wrapper.createDiv({ cls: "notioneer-title inline-title" });
		title.contentEditable = "true";
		title.setAttribute("data-ph", "Untitled");
		title.textContent = file.basename;

		title.addEventListener("keydown", (event) => {
			if (event.key === "Enter") {
				event.preventDefault();
				title.blur();
			}
			if (event.key === "Escape") {
				title.textContent = file.basename;
				title.blur();
			}
		});
		title.addEventListener("drop", (event) => event.preventDefault());
		title.addEventListener("blur", () => void this.rename(file, title));
	}

	private async rename(file: TFile, title: HTMLElement): Promise<void> {
		const name = (title.textContent ?? "").trim();
		if (!name || name === file.basename) {
			title.textContent = file.basename;
			return;
		}

		const folder = file.parent?.path ?? "";
		const target = normalizePath(`${folder}/${name}.${file.extension}`);
		try {
			await this.plugin.app.fileManager.renameFile(file, target);
		} catch (error) {
			// Usually a name collision or an illegal character; Obsidian shows its own
			// notice, so just put the old name back.
			console.error("Notioneer: rename failed", error);
			title.textContent = file.basename;
		}
	}

	// --- properties ---------------------------------------------------------

	private paintProperties(header: HTMLElement, file: TFile): void {
		const container = header.createDiv({ cls: "notioneer-properties" });
		const frontmatter =
			this.plugin.app.metadataCache.getFileCache(file)?.frontmatter ?? {};

		for (const key of Object.keys(frontmatter)) {
			if (key === COVER_KEY) continue;
			this.paintProperty(container, file, key, frontmatter[key]);
		}

		const actions = container.createDiv({ cls: "notioneer-properties-actions" });
		this.addButton(actions, "plus", "New property", () =>
			new NewPropertyModal(this.plugin.app, (name) =>
				this.saveFrontmatter(file, (fm) => {
					if (!(name in fm)) fm[name] = "";
				}),
			).open(),
		);
	}

	private paintProperty(
		container: HTMLElement,
		file: TFile,
		key: string,
		value: unknown,
	): void {
		const row = container.createDiv({ cls: "notioneer-property-row" });

		const keyEl = row.createDiv({ cls: "notioneer-property-key" });
		const iconEl = keyEl.createDiv({ cls: "notioneer-property-icon" });
		setIcon(iconEl, iconForValue(value));
		keyEl.createDiv({ cls: "notioneer-property-name", text: key });
		keyEl.addEventListener("contextmenu", (event) => {
			const menu = new Menu();
			menu.addItem((item) =>
				item
					.setTitle("Delete property")
					.setIcon("trash-2")
					.onClick(() => this.saveFrontmatter(file, (fm) => delete fm[key])),
			);
			menu.showAtMouseEvent(event);
		});

		const input = row.createEl("input", {
			cls: "notioneer-property-value",
			type: "text",
			value: displayValue(value),
		});
		input.placeholder = "Empty";
		input.addEventListener("keydown", (event) => {
			if (event.key === "Enter") input.blur();
			if (event.key === "Escape") {
				input.value = displayValue(value);
				input.blur();
			}
		});
		input.addEventListener("blur", () => {
			if (input.value === displayValue(value)) return;
			this.saveFrontmatter(file, (fm) => {
				// Keep the shape the note already had: a list stays a list.
				fm[key] = Array.isArray(value)
					? input.value.split(",").map((part) => part.trim()).filter(Boolean)
					: input.value;
			});
		});
	}

	private saveFrontmatter(file: TFile, edit: (frontmatter: Record<string, unknown>) => void) {
		void this.plugin.app.fileManager.processFrontMatter(file, edit);
	}
}

function displayValue(value: unknown): string {
	if (value === null || value === undefined) return "";
	return Array.isArray(value) ? value.join(", ") : String(value);
}

function iconForValue(value: unknown): string {
	if (Array.isArray(value)) return "list";
	if (typeof value === "number") return "hash";
	if (typeof value === "boolean") return "check-square";
	return "text";
}
