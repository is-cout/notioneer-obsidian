import { TAbstractFile, TFile } from "obsidian";
import React, { createContext, useContext, useEffect, useState } from "react";
import { HeaderApi } from "./api";

/** What the header knows about the note it sits on (make.md's `PathState`, trimmed). */
export type NoteState = {
	path: string;
	/** File name without extension, i.e. the title. */
	name: string;
	/** Containing folder's path; "" or "/" at the vault root. */
	parent: string;
	/** Frontmatter, without Obsidian's `position`. */
	property: Record<string, unknown>;
};

const readNote = (api: HeaderApi, path: string): NoteState | null => {
	const file = api.app.vault.getAbstractFileByPath(path);
	if (!(file instanceof TFile)) return null;
	const property: Record<string, unknown> = { ...api.app.metadataCache.getFileCache(file)?.frontmatter };
	delete property.position;
	return {
		path: file.path,
		name: file.basename,
		parent: file.parent?.path ?? "",
		property,
	};
};

type NoteContextValue = { note: NoteState | null; readMode: boolean; api: HeaderApi };

export const NoteContext = createContext<NoteContextValue | null>(null);

export const useNote = (): NoteContextValue => {
	const value = useContext(NoteContext);
	if (!value) throw new Error("useNote outside NoteProvider");
	return value;
};

/** Provides the note's state and keeps it current as its frontmatter changes or it is
    renamed — what make.md's `PathProvider` did through the Superstate index. */
export const NoteProvider = (
	props: React.PropsWithChildren<{ api: HeaderApi; path: string; readMode: boolean }>,
) => {
	const { api } = props;
	const [path, setPath] = useState(props.path);
	const [note, setNote] = useState<NoteState | null>(() => readNote(api, props.path));

	useEffect(() => {
		setPath(props.path);
		setNote(readNote(api, props.path));
	}, [props.path]);

	useEffect(() => {
		const changed = api.app.metadataCache.on("changed", (file) => {
			if (file.path == path) setNote(readNote(api, path));
		});
		// On startup a note's metadata may only be indexed after the header mounted.
		const resolved = api.app.metadataCache.on("resolve", (file) => {
			if (file.path == path) setNote(readNote(api, path));
		});
		const renamed = api.app.vault.on("rename", (file: TAbstractFile, oldPath: string) => {
			if (oldPath == path) {
				setPath(file.path);
				setNote(readNote(api, file.path));
			} else if (path.startsWith(oldPath + "/")) {
				// A containing folder was renamed.
				const newPath = file.path + path.slice(oldPath.length);
				setPath(newPath);
				setNote(readNote(api, newPath));
			}
		});
		return () => {
			api.app.metadataCache.offref(changed);
			api.app.metadataCache.offref(resolved);
			api.app.vault.offref(renamed);
		};
	}, [path]);

	return (
		<NoteContext.Provider value={{ note, readMode: props.readMode, api }}>{props.children}</NoteContext.Provider>
	);
};
