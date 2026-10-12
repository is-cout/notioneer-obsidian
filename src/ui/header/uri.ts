/** make.md's `parseURI`, reduced to the fields the cover needs. A value with `scheme://` is a
    URL; anything else is a vault path with any `?query`, `#ref` and `|alias` removed. Note
    that `[[wikilinks]]` are not resolved, exactly as in make.md. */
export type URI = { scheme: string; basePath: string; fullPath: string };

const removeTrailingSlash = (path: string) =>
	path.length > 1 && path.charAt(path.length - 1) == "/" ? path.slice(0, -1) : path;

export const parseURI = (fullPath: string): URI => {
	let uri = fullPath;
	let space: string | null = null;
	let scheme = "vault";

	if (fullPath.indexOf("://") != -1) {
		scheme = uri.slice(0, uri.indexOf("://"));
		const spaceStr = uri.slice(uri.indexOf("://") + 3);
		if (spaceStr.charAt(0) == "#" || spaceStr.charAt(0) == "$") {
			const endIndex = spaceStr.split("/")[0].lastIndexOf("#");
			if (endIndex > 0) {
				space = removeTrailingSlash(spaceStr.slice(0, endIndex));
				uri = spaceStr.slice(endIndex);
			} else {
				space = spaceStr.split("/")[0];
				uri = spaceStr.replace(space, "");
				if (uri.length > 0) uri = uri.slice(1);
				if (uri == "") uri = "/";
			}
		} else {
			const spaceParts = spaceStr.split("/");
			space = spaceParts[0];
			uri = spaceParts.slice(1).join("/") || "";
		}
	}

	const lastSlashIndex = uri.lastIndexOf("/");
	const lastHashIndex = uri.lastIndexOf("#");
	const lastPipeIndex = uri.lastIndexOf("|");
	const queryIndex = uri.lastIndexOf("?");
	if (queryIndex !== -1) uri = uri.slice(0, queryIndex);

	if (lastHashIndex !== -1 && lastHashIndex > lastSlashIndex) {
		const trailSlash = lastHashIndex == lastSlashIndex + 1;
		const refChar = uri.slice(lastHashIndex + 1)[0];
		// After a slash only space refs (^ * ;) count; otherwise any # starts a ref.
		const isRef = trailSlash ? refChar === "^" || refChar === "*" || refChar === ";" : true;
		if (isRef || !trailSlash) uri = uri.slice(0, lastHashIndex);
	}
	if (lastPipeIndex !== -1 && lastPipeIndex > lastSlashIndex) uri = uri.slice(0, lastPipeIndex);

	const path = uri;
	return {
		scheme,
		basePath: removeTrailingSlash(space ? `${scheme}://${space}/${path != "/" ? path : ""}` : path),
		fullPath,
	};
};
