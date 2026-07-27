import { EditorPosition } from "obsidian";

/** The position a caret ends up at after `text` is inserted at `start`. */
export function positionAfter(start: EditorPosition, text: string): EditorPosition {
	const lines = text.split("\n");
	const lastLine = lines[lines.length - 1];
	return lines.length === 1
		? { line: start.line, ch: start.ch + lastLine.length }
		: { line: start.line + lines.length - 1, ch: lastLine.length };
}
