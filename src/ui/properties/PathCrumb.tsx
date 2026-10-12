import { TFile, TFolder } from "obsidian";
import React, { PropsWithChildren, useEffect, useState } from "react";
import { HeaderApi } from "../header/api";
import i18n from "../i18n";

type PathLabel = { path: string; name: string; sticker: string };

/** What make.md's path index held for a vault path: display name and icon. */
const labelFor = (api: HeaderApi, path: string): PathLabel | null => {
	const file = api.app.vault.getAbstractFileByPath(path);
	if (file instanceof TFile) {
		const custom = api.app.metadataCache.getFileCache(file)?.frontmatter?.[api.settings.fmKeySticker] as unknown;
		return { path, name: file.basename, sticker: typeof custom === "string" && custom ? custom : "ui//file" };
	}
	if (file instanceof TFolder && !file.isRoot()) return { path, name: file.name, sticker: "ui//folder" };
	return null;
};

/** A note/folder chip: icon + name, opens on click (make.md's `PathCrumb`). */
export const PathCrumb = (props: PropsWithChildren<{ api: HeaderApi; path: string }>) => {
	const { api } = props;
	const [cache, setCache] = useState<PathLabel | null>(labelFor(api, props.path));
	useEffect(() => {
		setCache(labelFor(api, props.path));
		const ref = api.app.metadataCache.on("changed", (file) => {
			if (file.path == props.path) setCache(labelFor(api, props.path));
		});
		return () => api.app.metadataCache.offref(ref);
	}, [props.path]);

	return (
		<div className="mk-path" onClick={() => api.openPath(cache?.path ?? props.path, false)}>
			{cache && (
				<div className="mk-path-icon">
					<button
						aria-label={i18n.buttons.changeIcon}
						style={{ "--icon-color": `var(--mk-ui-text-secondary)` } as React.CSSProperties}
						dangerouslySetInnerHTML={{ __html: api.ui.getSticker(cache.sticker) }}
					></button>
				</div>
			)}
			<span>{cache?.name ?? props.path}</span>
			{props.children}
		</div>
	);
};

/** Link-menu entries: every file and folder, current one first, then its children. */
export const linkOptions = (api: HeaderApi, currentPath: string) =>
	api.app.vault
		.getAllLoadedFiles()
		.filter((f) => !(f instanceof TFolder && f.isRoot()))
		.filter((f) => !f.path.endsWith(".mdb") && !f.path.split("/").some((p) => p == ".space"))
		.map((f) => ({ name: f instanceof TFile ? f.basename : f.name, value: f.path, description: f.path }))
		.sort((a, b) => {
			const aIsChild = currentPath && a.value.startsWith(currentPath + "/");
			const bIsChild = currentPath && b.value.startsWith(currentPath + "/");
			const aIsCurrent = a.value === currentPath;
			const bIsCurrent = b.value === currentPath;
			if (aIsCurrent && !bIsCurrent) return -1;
			if (!aIsCurrent && bIsCurrent) return 1;
			if (aIsChild && !bIsChild) return -1;
			if (!aIsChild && bIsChild) return 1;
			return a.name.localeCompare(b.name);
		});
