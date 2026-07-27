import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFile,
} from "obsidian";
import { positionAfter } from "../editorUtils";
import { SlashCommand, filterCommands } from "./commands";

/** `/` only opens the menu at the start of a line or after whitespace, so URLs and
    dates ("1/2") don't trigger it. The query is letters only for the same reason. */
const TRIGGER = /(?:^|\s)\/([a-zA-Z]*)$/;

const CURSOR_MARKER = "${cursor}";

export class SlashSuggest extends EditorSuggest<SlashCommand> {
	/** Read at trigger time rather than unregistering the suggester, so toggling the
	    setting takes effect immediately without touching Obsidian internals. */
	private isEnabled: () => boolean;

	constructor(app: App, isEnabled: () => boolean) {
		super(app);
		this.isEnabled = isEnabled;
		this.setInstructions([{ command: "↵", purpose: "insert Markdown" }]);
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		_file: TFile | null,
	): EditorSuggestTriggerInfo | null {
		if (!this.isEnabled()) return null;

		const beforeCursor = editor.getLine(cursor.line).slice(0, cursor.ch);
		const match = TRIGGER.exec(beforeCursor);
		if (!match) return null;

		// match[0] may include the leading whitespace — the slash itself starts the range.
		const slashIndex = match.index + match[0].indexOf("/");
		return {
			start: { line: cursor.line, ch: slashIndex },
			end: cursor,
			query: match[1],
		};
	}

	getSuggestions(context: EditorSuggestContext): SlashCommand[] {
		return filterCommands(context.query);
	}

	renderSuggestion(command: SlashCommand, el: HTMLElement): void {
		el.addClass("notioneer-slash-item");
		el.createDiv({ cls: "notioneer-slash-name", text: command.name });
		el.createDiv({ cls: "notioneer-slash-desc", text: command.description });
	}

	selectSuggestion(command: SlashCommand): void {
		const context = this.context;
		if (!context) return;

		const markerIndex = command.snippet.indexOf(CURSOR_MARKER);
		const text = command.snippet.replace(CURSOR_MARKER, "");
		context.editor.replaceRange(text, context.start, context.end);
		const caretOffset = markerIndex < 0 ? text.length : markerIndex;
		context.editor.setCursor(positionAfter(context.start, text.slice(0, caretOffset)));
		this.close();
	}
}
