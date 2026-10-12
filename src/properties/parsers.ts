import { format } from "date-fns";

/** Parses JSON, or returns undefined. */
export const safelyParseJSON = (json: string): unknown => {
	try {
		return JSON.parse(json) as unknown;
	} catch {
		return undefined;
	}
};

export const ensureString = (value: unknown): string => {
	if (!value) return "";
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") return value.toString();
	return JSON.stringify(value);
};

export const ensureArray = (value: unknown): unknown[] => {
	if (Array.isArray(value)) return value as unknown[];
	if (typeof value === "string") return [value];
	return [];
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/** `a, b\, c` → ["a", "b, c"] */
export const parseMultiDisplayString = (str: string): string[] =>
	(ensureString(str).replace("\\,", ",").match(/(\\.|[^,])+/g) ?? []).map((f) => f.trim());

/** A multi-value cell is stored either as a JSON array or as a comma-separated string. */
export const parseMultiString = (str: string): string[] =>
	ensureString(str).startsWith("[")
		? ensureArray(safelyParseJSON(str)).map((f) => ensureString(f))
		: parseMultiDisplayString(str);

export const serializeMultiDisplayString = (value: string[]) => value.map((f) => f.replace(",", "\\,")).join(", ");
export const serializeMultiString = (value: string[]) => JSON.stringify(value);

const indexOfCharElseEOS = (char: string, str: string) => (str.indexOf(char) > 0 ? str.indexOf(char) : str.length);

/** `[[Note|alias]]` → `Note`; anything else unchanged. */
export const parseLinkString = (string: string) => {
	if (!string) return "";
	const match = /\[\[(.*?)\]\]/g.exec(string);
	const stringValue = match && match.length > 1 ? match[1].substring(0, indexOfCharElseEOS("|", match[1])) : string;
	return stringValue || string;
};

export const parseObject = (value: string, multi: boolean): unknown =>
	multi ? ensureArray(safelyParseJSON(value)) : (safelyParseJSON(value) ?? {});


/** A YAML `[[link]]` parses as a one-element array holding a one-element array. */
const isYamlLink = (value: unknown): value is [[string]] =>
	Array.isArray(value) &&
	value.length == 1 &&
	Array.isArray(value[0]) &&
	(value[0] as unknown[]).length == 1 &&
	typeof (value[0] as unknown[])[0] === "string";

const pathOf = (value: unknown): string | undefined =>
	isRecord(value) && typeof value.path === "string" ? value.path : undefined;

/** Detects a property's type from its frontmatter value (make.md's `detectPropertyType`). */
export const detectPropertyType = (value: unknown, key: string): string => {
	if (value instanceof Date) return "date";
	if (typeof value === "string") {
		if (/\/\/(\S+?(?:jpe?g|png|gif|svg))/gi.test(value) || value.includes("unsplash")) return "image";
		if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "date";
		if (key == "tag" || key == "tags") return "tags-multi";
		if (/\[\[.*?\]\]/.test(value)) return "link";
		return "text";
	}
	if (typeof value === "number") return "number";
	if (typeof value === "boolean") return "boolean";
	if (!value) return "unknown";
	if (Array.isArray(value)) {
		if (key == "tag" || key == "tags") return "tags-multi";
		if (isYamlLink(value)) return "link";
		const types = [...new Set((value as unknown[]).map((f) => detectPropertyType(f, key)))];
		if (types.length == 1 && types[0] == "link") return "link-multi";
		if (types.some((f) => f == "object")) return "object-multi";
		return "option-multi";
	}
	if (isRecord(value)) return value.type == "file" ? "link" : "object";
	return "unknown";
};

/** Frontmatter value → the string a cell edits (make.md's `parseProperty`). */
export const parseProperty = (field: string, value: unknown, type?: string): string => {
	const yamlType = type ?? detectPropertyType(value, field);
	if (!value) return "";
	switch (yamlType) {
		case "tags-multi":
			return Array.isArray(value) ? serializeMultiString(value.map(ensureString)) : ensureString(value);
		case "object":
		case "object-multi": {
			if (Array.isArray(value)) {
				if (pathOf(value[0])) return JSON.stringify(value.map(pathOf));
			} else if (pathOf(value)) {
				return pathOf(value) ?? "";
			}
			return JSON.stringify(value);
		}
		case "number":
			return ensureString(value);
		case "boolean":
			return value ? "true" : "false";
		case "date":
			if (value instanceof Date) return format(value, "yyyy-MM-dd");
			return typeof value === "string" ? value : "";
		case "option-multi":
		case "link-multi":
			if (typeof value === "string") return parseLinkString(value);
			return serializeMultiString(
				ensureArray(value).map((v) => {
					if (!v) return "";
					if (typeof v === "string") return parseLinkString(v);
					if (pathOf(v)) return pathOf(v) ?? "";
					if (Array.isArray(v) && v.length == 1 && Array.isArray(v[0]) && typeof v[0][0] === "string") {
						return v[0][0];
					}
					return JSON.stringify(v);
				}),
			);
		case "link":
			if (isYamlLink(value)) return value[0][0];
			if (typeof value === "string") return parseLinkString(value);
			return pathOf(value) ?? "";
		case "text":
		case "tag":
		case "option":
		case "image":
			return ensureString(value);
	}
	return "";
};

/** Cell string → the frontmatter value written back (make.md's `parseMDBStringValue`). */
export const parseMDBStringValue = (type: string, value: string, frontmatter?: boolean): unknown => {
	if (!type) return value;
	if (type == "object" || type == "object-multi") return safelyParseJSON(value);
	if (type == "number") return parseFloat(value);
	if (type == "boolean") return value == "true";
	if (type == "date" || type == "datetime" || type == "date-end") {
		if (!value) return null;
		const date = new Date(value);
		return !isNaN(date.getTime()) ? date : value;
	}
	if (type.includes("-multi")) {
		return parseMultiString(value).map((f) => parseMDBStringValue(type.replace("-multi", ""), f, frontmatter));
	}
	if (type.includes("link") || type.includes("context")) return frontmatter ? `[[${value}]]` : value;
	return value;
};

/** Initial frontmatter value for a property created with a given type. */
export const defaultValueForType = (type: string): unknown => {
	if (type == "date") return format(Date.now(), "yyyy-MM-dd");
	if (type == "number") return 0;
	if (type == "boolean") return true;
	if (type == "link") return "[[Select Note]]";
	if (type == "option") return "one, two";
	if (type == "text") return " ";
	if (type == "image") {
		return "https://images.unsplash.com/photo-1675789652575-0a5d2425b6c2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80";
	}
	return undefined;
};
