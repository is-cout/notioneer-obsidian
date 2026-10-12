import { App, Pos, TFile } from "obsidian";
import { parseMultiDisplayString, serializeMultiDisplayString } from "./parsers";

/** make.md's tag helpers, as the header's tags row uses them. */

const uniq = <T,>(values: T[]) => [...new Set(values)];

export const ensureTag = (tag: string) => {
	const string = tag.charAt(0) != "#" ? "#" + tag : tag;
	return string.toLowerCase();
};

export const stringFromTag = (string: string) => {
	if (string.charAt(0) == "#") return string.substring(string.charAt(1) == "#" ? 2 : 1);
	return string;
};

const frontmatterTags = (value: unknown): string[] =>
	(typeof value === "string"
		? parseMultiDisplayString(value.replace(/ /g, ""))
		: Array.isArray(value)
			? (value as unknown[])
			: []
	)
		.filter((f): f is string => typeof f === "string")
		.map(ensureTag);

/** Every tag on the note — inline ones first, then `tags`/`tag` frontmatter — lowercased
    with `#`, which is what make.md lists in the tags row. `raw` keeps inline tags' case:
    a tag gets a remove button when it appears there. */
export const tagsForFile = (app: App, file: TFile): { all: string[]; raw: string[] } => {
	const cache = app.metadataCache.getFileCache(file);
	const raw = [
		...(cache?.tags?.map((f) => f.tag) ?? []),
		...frontmatterTags(cache?.frontmatter?.tags),
		...frontmatterTags(cache?.frontmatter?.tag),
	].filter((f) => f);
	return { all: uniq(raw.map((f) => f.toLowerCase())), raw };
};

/** All tags in the vault, for the "add tag" menu. */
export const allTags = (app: App) => {
	const tags = (app.metadataCache as unknown as { getTags?: () => Record<string, number> }).getTags?.() ?? {};
	return uniq(Object.keys(tags).map((f) => f.toLowerCase()));
};

const splitTags = (value: string) => value.replace(/\s/g, "").split(",");

/** Adds `tag` to the note's `tags` frontmatter, keeping its list or string form. */
export const addTagToFile = async (app: App, file: TFile, tag: string) => {
	const newTag = stringFromTag(tag.trim());
	await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
		const value = fm.tags;
		if (Array.isArray(value)) {
			fm.tags = uniq([...(value as unknown[]), newTag]).filter((f) => typeof f === "string" && f.length > 0);
		} else if (typeof value === "string") {
			fm.tags = serializeMultiDisplayString(uniq([...splitTags(value), newTag]).filter((f) => f.length > 0));
		} else {
			fm.tags = newTag;
		}
	});
};

const positionsForTag = (app: App, tag: string, file: TFile): Pos[] =>
	(app.metadataCache.getFileCache(file)?.tags ?? [])
		.filter((f) => f.tag.toLowerCase() == tag.toLowerCase())
		.map((f) => f.position)
		.sort((a, b) => a.start.offset - b.start.offset);

/** Removes `tag` from the `tags` frontmatter and every inline occurrence in the body. */
export const removeTagFromFile = async (app: App, file: TFile, tag: string) => {
	const positions = positionsForTag(app, tag, file);
	const name = stringFromTag(tag).toLowerCase();
	await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
		const value = fm.tags;
		if (Array.isArray(value)) {
			const tags = (value as unknown[]).filter((f): f is string => typeof f === "string");
			if (tags.some((f) => f.toLowerCase() == name)) fm.tags = tags.filter((f) => f.toLowerCase() != name);
		} else if (typeof value === "string") {
			const tags = splitTags(value);
			if (tags.some((f) => f.toLowerCase() == name)) {
				fm.tags = serializeMultiDisplayString(tags.filter((f) => f.toLowerCase() != name));
			}
		}
	});
	if (positions.length == 0) return;
	const original = await app.vault.read(file);
	let text = original;
	let offset = 0;
	for (const { start, end } of positions) {
		const startOff = start.offset + offset;
		const endOff = end.offset + offset;
		if (text.slice(startOff, endOff).toLowerCase() !== tag.toLowerCase()) return;
		text = text.slice(0, startOff) + text.slice(startOff + tag.length);
		offset -= tag.length;
	}
	if (text !== original) await app.vault.modify(file, text);
};
