import { TFile } from "obsidian";
import React, { useEffect, useState } from "react";
import { addTagToFile, allTags, removeTagFromFile, tagsForFile } from "../../../properties/tags";
import i18n from "../../i18n";
import { SelectMenuProps } from "../../types";
import { TableCellProp } from "../types";
import { OptionCellBase } from "./OptionCell";

/** The `tags` row: every tag on the note, inline ones included (make.md's `TagCell`). */
export const TagCell = (props: TableCellProp) => {
	const { app } = props.api;
	const read = () => {
		const file = app.vault.getAbstractFileByPath(props.path);
		return file instanceof TFile ? tagsForFile(app, file) : { all: [], raw: [] };
	};
	const [tags, setTags] = useState(read);

	useEffect(() => {
		setTags(read());
		const ref = app.metadataCache.on("changed", (file) => {
			if (file.path == props.path) setTags(read());
		});
		return () => app.metadataCache.offref(ref);
	}, [props.path]);

	const fileOrNull = () => {
		const file = app.vault.getAbstractFileByPath(props.path);
		return file instanceof TFile ? file : null;
	};
	const removeValue = (v: string) => {
		const file = fileOrNull();
		if (file) void removeTagFromFile(app, file, v);
	};
	const saveOptions = (_options: string[], _value: string[]) => {
		const file = fileOrNull();
		if (file && _value[0]) void addTagToFile(app, file, _value[0]);
	};

	const menuProps = (): SelectMenuProps => ({
		multi: false,
		editable: true,
		value: tags.all,
		options: allTags(app).map((f) => ({ name: f, value: f })),
		saveOptions,
		placeholder: i18n.labels.tagItemSelectPlaceholder,
		searchable: true,
		showAll: true,
		onHide: () => props.setEditMode(null),
	});

	return (
		<OptionCellBase
			ui={props.api.ui}
			baseClass="mk-cell-tags"
			removeValue={removeValue}
			menuProps={menuProps}
			selectLabel={props.compactMode ? props.property.name : i18n.labels.select}
			value={tags.all}
			multi={true}
			editMode={props.editMode}
			labelElement={(_props) => (
				<div className="mk-cell-tags-label">
					{_props.value}
					{tags.raw.some((f) => f.toLowerCase() == _props.value) && _props.children}
				</div>
			)}
		></OptionCellBase>
	);
};
