import React, { useEffect, useState } from "react";
import { parseMultiString, serializeMultiDisplayString, serializeMultiString } from "../../../properties/parsers";
import i18n from "../../i18n";
import { SelectMenuProps } from "../../types";
import { linkOptions, PathCrumb } from "../PathCrumb";
import { TableCellMultiProp } from "../types";
import { OptionCellBase } from "./OptionCell";

/** Resolves `./x` and `../x` against the note, as make.md's `resolvePath`. */
const resolvePath = (path: string, source: string): string => {
	if (!source || !path) return path;
	if (path.indexOf("http") == 0) return path;
	if (path.indexOf("|") != -1) path = path.split("|")[0];
	if (path.indexOf("./") == 0) return source.slice(0, source.lastIndexOf("/")) + path.slice(1);
	if (path.indexOf("../") == 0) {
		const sourceParts = source.split("/");
		const pathParts = path.split("/");
		sourceParts.pop();
		while (pathParts[0] === "..") {
			sourceParts.pop();
			pathParts.shift();
		}
		return [...sourceParts, ...pathParts].join("/");
	}
	return path;
};

/** A note link (or list of links), shown as note chips (make.md's `LinkCell`). */
export const LinkCell = (props: TableCellMultiProp) => {
	const parseValue = (v: string) =>
		props.multi
			? parseMultiString(v)
			: [v].filter((f) => f).map((f) => resolvePath(f, props.path));
	const [value, setValue] = useState(parseValue(props.initialValue));
	useEffect(() => {
		setValue(parseValue(props.initialValue));
	}, [props.initialValue]);

	const saveValue = (values: string[]) =>
		props.saveValue(props.multi ? serializeMultiString(values) : serializeMultiDisplayString(values));
	const removeValue = (v: string) => {
		const newValues = value.filter((f) => f != v);
		setValue(newValues);
		saveValue(newValues);
	};
	const saveOptions = (_: string[], _value: string[]) => {
		if (!props.multi) {
			setValue(_value);
			saveValue(_value);
			return;
		}
		if (_value[0]) {
			const newValues = [...new Set([...value, _value[0]])];
			setValue(newValues);
			saveValue(newValues);
		}
	};
	const menuProps = (): SelectMenuProps => {
		const options = linkOptions(props.api, props.path);
		return {
			multi: false,
			editable: true,
			value,
			options: !props.multi ? [{ name: i18n.menu.none, value: "" }, ...options] : options,
			saveOptions,
			placeholder: i18n.labels.linkItemSelectPlaceholder,
			detail: true,
			searchable: true,
		};
	};

	return (
		<OptionCellBase
			ui={props.api.ui}
			baseClass="mk-cell-link"
			removeValue={removeValue}
			selectLabel={props.compactMode ? props.property.name : i18n.labels.select}
			menuProps={menuProps}
			labelElement={(_props) => (
				<PathCrumb api={props.api} path={_props.value}>
					{_props.children}
				</PathCrumb>
			)}
			value={value}
			multi={props.multi}
			editMode={props.editMode}
		></OptionCellBase>
	);
};
