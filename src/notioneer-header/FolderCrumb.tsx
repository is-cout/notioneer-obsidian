import { ISuperstate as Superstate } from "shared/types/superstate";
import React from "react";

/** The folder a note lives in, shown as a chip under the title.

    make.md put the note's spaces here; spaces are removed, but the chip that showed which
    folder you are in was worth keeping. Clicking it reveals the folder in Obsidian's file
    explorer. */
export const FolderCrumb = (props: { superstate: Superstate; path: string }) => {
	const parent = props.path.includes("/")
		? props.path.slice(0, props.path.lastIndexOf("/"))
		: "";
	const name = parent === "" ? "Vault" : parent.split("/").pop();

	const reveal = () => {
		// `revealInFolder` is not in the public API, so a version without it just does nothing
		// rather than throwing inside the header.
		try {
			const app = (props.superstate.ui as unknown as { plugin?: { app?: any } }).plugin?.app;
			const explorer = app?.internalPlugins?.plugins?.["file-explorer"]?.instance;
			const folder = app?.vault?.getAbstractFileByPath(parent === "" ? "/" : parent);
			if (explorer && folder) explorer.revealInFolder(folder);
		} catch (error) {
			console.error("Notioneer: could not reveal folder", error);
		}
	};

	return (
		<div className="notioneer-folder-crumb" onClick={reveal} aria-label={parent || "/"}>
			<div
				className="mk-icon-xsmall"
				dangerouslySetInnerHTML={{
					__html: props.superstate.ui.getSticker("ui//folder"),
				}}
			></div>
			{name}
		</div>
	);
};
