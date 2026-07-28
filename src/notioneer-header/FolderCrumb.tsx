import { ISuperstate as Superstate } from "shared/types/superstate";
import React from "react";

/** The folders a note lives in, shown as chips under the title.

    This is where make.md showed the spaces a note belonged to. Spaces are removed, but the
    chip was worth keeping, so it renders folders instead — the top-level folder first, then
    the note's immediate parent (skipped when they are the same folder). Clicking one reveals
    it in Obsidian's file explorer.

    It reuses make.md's `mk-props-contexts-space-name` class, so it keeps their pill shape and
    the theme's tag colours rather than a lookalike of our own. */
export const FolderCrumb = (props: { superstate: Superstate; path: string }) => {
	const parent = props.path.includes("/")
		? props.path.slice(0, props.path.lastIndexOf("/"))
		: "";
	if (parent === "") return null;

	const segments = parent.split("/");
	const paths = [segments[0], parent].filter(
		(path, index, all) => all.indexOf(path) === index,
	);

	return (
		<>
			{paths.map((path, index) => (
				<FolderChip
					key={path}
					superstate={props.superstate}
					path={path}
					// The immediate parent is the subordinate one: same pill, lighter.
					faded={index > 0}
				></FolderChip>
			))}
		</>
	);
};

const FolderChip = (props: { superstate: Superstate; path: string; faded: boolean }) => {
	const reveal = () => {
		// `revealInFolder` is not part of the public API, so a version without it does nothing
		// rather than throwing inside the header.
		try {
			const app = (props.superstate.ui as unknown as { plugin?: { app?: any } }).plugin?.app;
			const explorer = app?.internalPlugins?.plugins?.["file-explorer"]?.instance;
			const folder = app?.vault?.getAbstractFileByPath(props.path);
			if (explorer && folder) explorer.revealInFolder(folder);
		} catch (error) {
			console.error("Notioneer: could not reveal folder", error);
		}
	};

	return (
		<div
			className={`mk-props-contexts-space-name notioneer-folder-crumb${
				props.faded ? " notioneer-folder-crumb-faded" : ""
			}`}
			onClick={reveal}
			aria-label={props.path}
		>
			<div
				className="mk-icon-xsmall"
				dangerouslySetInnerHTML={{
					__html: props.superstate.ui.getSticker("ui//folder"),
				}}
			></div>
			{props.path.split("/").pop()}
		</div>
	);
};
