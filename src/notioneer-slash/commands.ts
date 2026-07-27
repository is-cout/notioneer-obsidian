/** A block a slash command can insert. `snippet` is plain Markdown — the whole point of
    this plugin is that nothing here is a plugin-specific format. `${cursor}` marks where the
    caret lands after insertion (removed from the inserted text). */
export interface SlashCommand {
	id: string;
	name: string;
	description: string;
	/** Extra words the fuzzy filter should match on, beyond `name`. */
	keywords: string[];
	snippet: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
	{
		id: "h1",
		name: "Heading 1",
		description: "# Big section heading",
		keywords: ["title", "h1"],
		snippet: "# ${cursor}",
	},
	{
		id: "h2",
		name: "Heading 2",
		description: "## Medium section heading",
		keywords: ["h2", "subtitle"],
		snippet: "## ${cursor}",
	},
	{
		id: "h3",
		name: "Heading 3",
		description: "### Small section heading",
		keywords: ["h3"],
		snippet: "### ${cursor}",
	},
	{
		id: "bullet",
		name: "Bulleted list",
		description: "- item",
		keywords: ["ul", "unordered", "list"],
		snippet: "- ${cursor}",
	},
	{
		id: "numbered",
		name: "Numbered list",
		description: "1. item",
		keywords: ["ol", "ordered", "list"],
		snippet: "1. ${cursor}",
	},
	{
		id: "todo",
		name: "To-do list",
		description: "- [ ] task",
		keywords: ["task", "checkbox", "checklist"],
		snippet: "- [ ] ${cursor}",
	},
	{
		id: "quote",
		name: "Quote",
		description: "> quoted text",
		keywords: ["blockquote", "citation"],
		snippet: "> ${cursor}",
	},
	{
		id: "callout",
		name: "Callout",
		description: "> [!note] admonition block",
		keywords: ["admonition", "note", "aside"],
		snippet: "> [!note] ${cursor}\n> ",
	},
	{
		id: "table",
		name: "Table",
		description: "A real Markdown table, not a custom block",
		keywords: ["grid", "markdown"],
		snippet: "| ${cursor} |  |\n| --- | --- |\n|  |  |",
	},
	{
		id: "code",
		name: "Code block",
		description: "Fenced code block",
		keywords: ["fence", "snippet", "pre"],
		snippet: "```${cursor}\n\n```",
	},
	{
		id: "divider",
		name: "Divider",
		description: "Horizontal rule",
		keywords: ["hr", "rule", "separator", "line"],
		snippet: "---\n${cursor}",
	},
	{
		id: "link",
		name: "Internal link",
		description: "[[note]]",
		keywords: ["wikilink", "wiki", "note"],
		snippet: "[[${cursor}]]",
	},
	{
		id: "embed",
		name: "Embed",
		description: "![[note or image]]",
		keywords: ["transclude", "image", "attachment"],
		snippet: "![[${cursor}]]",
	},
];

/** Sub-sequence match, the same "type the initials" feel as Obsidian's own suggesters. */
function matches(haystack: string, query: string): boolean {
	let i = 0;
	for (const char of haystack.toLowerCase()) {
		if (char === query[i]) i++;
		if (i === query.length) return true;
	}
	return query.length === 0;
}

export function filterCommands(query: string): SlashCommand[] {
	const q = query.toLowerCase();
	return SLASH_COMMANDS.filter(
		(command) => matches(command.name, q) || command.keywords.some((k) => matches(k, q)),
	);
}
