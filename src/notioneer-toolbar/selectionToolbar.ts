import { Editor, MarkdownView, Plugin, setIcon } from "obsidian";
import { INLINE_FORMATS, insertLink, toggleInlineFormat } from "./format";

const GAP_ABOVE_SELECTION = 8;

/** Floating formatting toolbar shown while text is selected in the editor.

    It reads the browser selection rather than CodeMirror's, so it needs no CodeMirror
    dependency: the rendered editor text is real DOM, and `Range.getBoundingClientRect()`
    is what tells us where to put the toolbar. */
export class SelectionToolbar {
	private el: HTMLElement;

	constructor(
		private plugin: Plugin,
		private isEnabled: () => boolean,
	) {
		this.el = this.buildElement();
		plugin.register(() => this.el.remove());

		// `mouseup`/`keyup` rather than `selectionchange`: the latter fires mid-drag, which
		// would make the toolbar jump around while the user is still selecting.
		plugin.registerDomEvent(document, "mouseup", () => this.refresh());
		plugin.registerDomEvent(document, "keyup", () => this.refresh());
		plugin.registerDomEvent(document, "keydown", (event) => {
			if (event.key === "Escape") this.hide();
		});
		plugin.registerDomEvent(window, "resize", () => this.hide());
		plugin.registerDomEvent(document, "scroll", () => this.hide(), true);
	}

	private buildElement(): HTMLElement {
		const el = document.body.createDiv({ cls: "notioneer-selection-toolbar" });
		el.hide();

		for (const format of INLINE_FORMATS) {
			this.addButton(el, format.icon, format.label, (editor) =>
				toggleInlineFormat(editor, format.marker),
			);
		}
		this.addButton(el, "link", "Link", insertLink);
		return el;
	}

	private addButton(
		parent: HTMLElement,
		icon: string,
		label: string,
		action: (editor: Editor) => void,
	): void {
		const button = parent.createEl("button", { cls: "notioneer-toolbar-button" });
		button.setAttribute("aria-label", label);
		setIcon(button, icon);
		// mousedown, not click: the default would move focus out of the editor and drop
		// the selection before the action ever runs.
		button.addEventListener("mousedown", (event) => {
			event.preventDefault();
			const editor = this.activeEditor();
			if (!editor) return;
			action(editor);
			this.refresh();
		});
	}

	private activeEditor(): Editor | null {
		const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		return view && view.getMode() === "source" ? view.editor : null;
	}

	private refresh(): void {
		const editor = this.activeEditor();
		if (!this.isEnabled() || !editor || !editor.somethingSelected()) {
			this.hide();
			return;
		}

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
			this.hide();
			return;
		}

		const rect = selection.getRangeAt(0).getBoundingClientRect();
		if (rect.width === 0 && rect.height === 0) {
			this.hide();
			return;
		}
		this.show(rect);
	}

	private show(rect: DOMRect): void {
		this.el.show();
		const { offsetWidth, offsetHeight } = this.el;
		const left = rect.left + rect.width / 2 - offsetWidth / 2;
		const top = rect.top - offsetHeight - GAP_ABOVE_SELECTION;
		this.el.style.left = `${clamp(left, 0, window.innerWidth - offsetWidth)}px`;
		// Flip below the selection when there is no room above it.
		this.el.style.top = `${top < 0 ? rect.bottom + GAP_ABOVE_SELECTION : top}px`;
	}

	private hide(): void {
		this.el.hide();
	}
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}
