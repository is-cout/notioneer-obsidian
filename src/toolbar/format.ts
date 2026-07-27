import { Editor, EditorPosition } from "obsidian";
import { positionAfter } from "../editorUtils";

/** An inline Markdown wrapper the toolbar can toggle around the selection. */
export interface InlineFormat {
	id: string;
	/** Obsidian icon name (`setIcon`). */
	icon: string;
	label: string;
	marker: string;
}

export const INLINE_FORMATS: InlineFormat[] = [
	{ id: "bold", icon: "bold", label: "Bold", marker: "**" },
	{ id: "italic", icon: "italic", label: "Italic", marker: "*" },
	{ id: "strikethrough", icon: "strikethrough", label: "Strikethrough", marker: "~~" },
	{ id: "highlight", icon: "highlighter", label: "Highlight", marker: "==" },
	{ id: "code", icon: "code", label: "Inline code", marker: "`" },
];

/** Wrap the selection in `marker`, or unwrap it if it is already wrapped — whether the
    markers sit inside the selection (`**word**` selected) or just outside it (`word`
    selected inside `**word**`).

    A marker is only recognised when the character next to it differs, so toggling italic
    on `**bold**` nests to `***bold***` instead of eating one of the bold asterisks. */
export function toggleInlineFormat(editor: Editor, marker: string): void {
	const from = editor.getCursor("from");
	const to = editor.getCursor("to");
	const selection = editor.getSelection();
	const edge = marker[0];

	const before = editor.getLine(from.line).slice(0, from.ch);
	const after = editor.getLine(to.line).slice(to.ch);
	if (
		before.endsWith(marker) &&
		after.startsWith(marker) &&
		before[before.length - marker.length - 1] !== edge &&
		after[marker.length] !== edge
	) {
		// Trailing marker first: removing it cannot shift the leading one's position.
		editor.replaceRange("", to, { line: to.line, ch: to.ch + marker.length });
		const newFrom: EditorPosition = { line: from.line, ch: from.ch - marker.length };
		editor.replaceRange("", newFrom, from);
		editor.setSelection(newFrom, positionAfter(newFrom, selection));
		return;
	}

	const wrapped =
		selection.length > marker.length * 2 &&
		selection.startsWith(marker) &&
		selection.endsWith(marker) &&
		selection[marker.length] !== edge;
	if (wrapped) {
		const inner = selection.slice(marker.length, selection.length - marker.length);
		editor.replaceSelection(inner);
		editor.setSelection(from, positionAfter(from, inner));
		return;
	}

	editor.replaceSelection(marker + selection + marker);
	const innerStart = positionAfter(from, marker);
	editor.setSelection(innerStart, positionAfter(innerStart, selection));
}

/** `[selection]()` with the caret between the parens, ready for a pasted URL. */
export function insertLink(editor: Editor): void {
	const from = editor.getCursor("from");
	const selection = editor.getSelection();
	const text = `[${selection}]()`;
	editor.replaceSelection(text);
	editor.setCursor(positionAfter(from, text.slice(0, text.length - 1)));
}
