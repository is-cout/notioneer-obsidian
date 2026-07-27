import { MarkdownView, Menu, Plugin, TFile, normalizePath, setIcon } from "obsidian";
import { CoverPicker } from "./coverPicker";
import { NewPropertyModal } from "./newPropertyModal";

/** Body class make.md uses to hide Obsidian's own inline title while its header renders one. */
const ENABLED_BODY_CLASS = "mk-inline-context-enabled";

const ROOT_CLASS = "mk-inline-context";

/** Frontmatter key holding the cover image — the key make.md's banner uses, so a vault that
    already has covers keeps them. Plain YAML: the note still makes sense without the plugin. */
const COVER_KEY = "cover";

/** make.md's banner height (`bannerHeight` in core/schemas/settings.ts) minus the offsets its
    BannerView applies for a header with no sticker. Reserves the flow space the absolutely
    positioned banner gives up. */
const SPACER_HEIGHT = 200 - 62 + 40;

/** Notion-style note header: banner, title, properties.

    The DOM mirrors make.md's `MarkdownHeaderView` — same element order and the same class
    names — because `src/styles/header.css` is their CSS copied verbatim. Change one and the
    other has to move with it.

        .mk-inline-context                 (prepended to .cm-sizer)
          .mk-path-context-component
            .mk-path-context-label
              .mk-space-banner > img       (absolute, escapes the reading width)
              .mk-space-banner-buttons     (add / change / remove cover)
              .mk-spacer                   (reserves the banner's height in the flow)
              .mk-inline-title.inline-title
            .mk-path-context-properties
              .mk-path-context-row*        (one per frontmatter key)
              .mk-path-context-row-new     (new property)

    `.cm-sizer` already carries the reading width, so everything except the banner lines up
    with the note body for free. Only source/Live Preview is handled — reading view has no
    `.cm-sizer` and keeps Obsidian's native properties panel. */
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
			document.querySelectorAll(`.${ROOT_CLASS}`).forEach((el) => el.remove());
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
		const existing = sizer?.querySelector<HTMLElement>(`:scope > .${ROOT_CLASS}`);

		if (!sizer || !file || !this.isEnabled()) {
			existing?.remove();
			return;
		}

		// A repaint would blow away the caret; the DOM already holds what the user typed.
		if (existing?.contains(document.activeElement)) return;

		const root = existing ?? createDiv({ cls: ROOT_CLASS });
		root.empty();

		const component = root.createDiv({ cls: "mk-path-context-component" });
		const label = component.createDiv({ cls: "mk-path-context-label" });
		this.paintBanner(label, file);
		this.paintTitle(label, file);
		this.paintProperties(component, file);

		if (sizer.firstElementChild !== root) sizer.prepend(root);
	}

	// --- banner -------------------------------------------------------------

	private paintBanner(label: HTMLElement, file: TFile): void {
		const cover = this.coverSource(file);
		if (cover !== null) {
			const banner = label.createDiv({ cls: "mk-space-banner" });
			// An <img> rather than a CSS background: Obsidian's resource paths contain
			// characters that would need escaping inside url().
			banner.createEl("img", { attr: { src: cover, alt: "" } });
		}

		const buttons = label.createDiv({ cls: "mk-space-banner-buttons" });
		this.addButton(buttons, "image", cover !== null ? "Change cover" : "Add cover", () =>
			new CoverPicker(this.plugin.app, (image) =>
				this.saveFrontmatter(file, (fm) => {
					fm[COVER_KEY] = image.path;
				}),
			).open(),
		);
		if (cover !== null) {
			this.addButton(buttons, "file-minus", "Remove cover", () =>
				this.saveFrontmatter(file, (fm) => delete fm[COVER_KEY]),
			);
			label.createDiv({
				cls: "mk-spacer",
				attr: { style: `--mk-header-height: ${SPACER_HEIGHT}px` },
			});
		}
	}

	private addButton(
		parent: HTMLElement,
		icon: string,
		label: string,
		onClick: () => void,
	): void {
		const button = parent.createEl("button", { cls: "mk-hover-button" });
		setIcon(button.createDiv(), icon);
		button.createSpan({ text: label });
		button.addEventListener("click", onClick);
	}

	/** Resolves the `cover` value to something an `<img>` can load: an external URL as-is, a
	    vault path (bare or wrapped in `[[ ]]`) through the resource path. */
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

	private paintTitle(label: HTMLElement, file: TFile): void {
		// `inline-title` is Obsidian's own class: the title picks up the active theme's
		// note-title styling rather than an approximation of it.
		const title = label.createDiv({ cls: "mk-inline-title inline-title" });
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

	private paintProperties(component: HTMLElement, file: TFile): void {
		const properties = component.createDiv({ cls: "mk-path-context-properties" });
		const frontmatter = this.plugin.app.metadataCache.getFileCache(file)?.frontmatter ?? {};

		for (const key of Object.keys(frontmatter)) {
			if (key === COVER_KEY) continue;
			this.paintProperty(properties, file, key, frontmatter[key]);
		}

		const newRow = properties.createDiv({ cls: "mk-path-context-row-new" });
		const newField = newRow.createDiv({ cls: "mk-path-context-new" });
		setIcon(newField.createDiv({ cls: "mk-path-context-field-icon" }), "plus");
		newField.createDiv({ cls: "mk-path-context-field-key", text: "New property" });
		newField.addEventListener("click", () =>
			new NewPropertyModal(this.plugin.app, (name) =>
				this.saveFrontmatter(file, (fm) => {
					if (!(name in fm)) fm[name] = "";
				}),
			).open(),
		);
	}

	private paintProperty(
		properties: HTMLElement,
		file: TFile,
		key: string,
		value: unknown,
	): void {
		const row = properties.createDiv({ cls: "mk-path-context-row" });

		const field = row.createDiv({ cls: "mk-path-context-field" });
		setIcon(field.createDiv({ cls: "mk-path-context-field-icon" }), iconForValue(value));
		field.createDiv({ cls: "mk-path-context-field-key", text: key });
		field.addEventListener("contextmenu", (event) => {
			const menu = new Menu();
			menu.addItem((item) =>
				item
					.setTitle("Delete property")
					.setIcon("trash-2")
					.onClick(() => this.saveFrontmatter(file, (fm) => delete fm[key])),
			);
			menu.showAtMouseEvent(event);
		});

		const cell = row.createDiv({ cls: "mk-path-context-value" });
		const input = cell.createEl("input", { type: "text", value: displayValue(value) });
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
