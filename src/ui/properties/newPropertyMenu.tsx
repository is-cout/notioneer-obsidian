import React, { useEffect, useMemo, useRef, useState } from "react";
import { fieldTypeForType, fieldTypes, Property, stickerForField } from "../../properties/fieldTypes";
import i18n from "../i18n";
import { windowFromDocument } from "../screen";
import { OpenSubmenu, Rect, SelectOption, SelectOptionType } from "../types";
import { UI } from "../ui";

/** make.md's "Repeat" preset, the only entry of the type menu's "Special" submenu. Its
    label key is missing from make.md's English strings, so the entry has no text and saves
    a property literally named "undefined" — kept as is. */
const RepeatTemplate: Property = { name: "undefined", type: "object" };

const sanitizeColumnName = (name: string): string =>
	name.charAt(0) == "_" || name.charAt(0) == "$" ? sanitizeColumnName(name.substring(1)) : name.replace(/"/g, ``);

/** make.md's "New Property" menu, for a note's frontmatter: name, type, multiple. */
const NewPropertyMenuComponent = (props: {
	ui: UI;
	saveField: (field: Property) => boolean;
	hide?: () => void;
	onSubmenu?: (openSubmenu: OpenSubmenu) => void;
}) => {
	const [fieldName, setFieldName] = useState("");
	const [fieldType, setFieldType] = useState("text");
	const hide = () => props.hide?.();

	const toggleMulti = () => {
		const field = fieldTypes.find((f) => f.type == fieldType || f.multiType == fieldType);
		if (field) setFieldType(field.type == fieldType ? (field.multiType ?? field.type) : field.type);
	};

	const selectType = (e: React.MouseEvent) => {
		const win = windowFromDocument(e.view.document);
		const specialMenu = (rect: Rect) =>
			props.ui.openMenu(
				rect,
				{
					multi: false,
					editable: false,
					searchable: true,
					value: [],
					showAll: true,
					options: [
						{
							name: "",
							value: RepeatTemplate.name,
							icon: stickerForField(RepeatTemplate),
							onClick: () => props.saveField(RepeatTemplate),
						},
					],
				},
				win,
			);
		props.onSubmenu?.((rect: Rect) => {
			const options: SelectOption[] = fieldTypes
				.filter((f) => f.metadata)
				.map((f, i) => ({
					id: i + 1,
					name: f.label,
					value: f.type,
					icon: f.icon,
					description: f.description,
					onClick: () => setFieldType(f.type),
				}));
			options.push({
				name: i18n.menu.special,
				value: "special",
				icon: "ui//edit",
				type: SelectOptionType.Submenu,
				onSubmenu: specialMenu,
			});
			return props.ui.openMenu(
				rect,
				{ multi: false, editable: false, searchable: true, value: [], showAll: true, options },
				win,
			);
		});
	};

	const type = useMemo(() => fieldTypeForType(fieldType, fieldName) ?? fieldTypes[0], [fieldType, fieldName]);
	const saveField = () => {
		if (fieldName.length == 0) {
			props.ui.notify(i18n.notice.noPropertyName);
			return;
		}
		if (props.saveField({ name: fieldName, type: fieldType })) hide();
	};
	const input = useRef<HTMLInputElement>(null);
	useEffect(() => {
		window.setTimeout(() => input.current?.focus(), 50);
	}, []);

	return (
		<div className="mk-menu-container">
			<div className="mk-menu-suggestions">
				<div className="mk-menu-input">
					<input
						type="text"
						ref={input}
						placeholder={i18n.labels.namePlaceholder}
						onKeyDown={(e) => {
							if (e.key == "Enter") saveField();
						}}
						onChange={(e) => setFieldName(sanitizeColumnName(e.target.value))}
						onMouseDown={(e) => e.stopPropagation()}
						value={fieldName}
					/>
				</div>
				<div className="mk-menu-separator"></div>
				<div className="mk-menu-option" onClick={(e) => selectType(e)}>
					<div className="mk-menu-options-inner">{i18n.labels.propertyType}</div>
					<span>{type.label}</span>
				</div>
				{type.multi ? (
					<div className="mk-menu-option">
						<span>{i18n.labels.multiple}</span>
						<input type="checkbox" checked={fieldType == type.multiType} onChange={() => toggleMulti()}></input>
					</div>
				) : (
					<></>
				)}
				<div className="mk-menu-separator"></div>
				<div className="mk-menu-separator"></div>
				<div className="mk-menu-option" onClick={() => saveField()}>
					<span>{i18n.buttons.saveProperty}</span>
				</div>
				<div className="mk-menu-option" onClick={() => hide()}>
					<span>{i18n.buttons.cancel}</span>
				</div>
			</div>
		</div>
	);
};

export const showNewPropertyMenu = (
	ui: UI,
	rect: Rect,
	win: Window,
	saveField: (field: Property) => boolean,
	onHide?: () => void,
) =>
	ui.openCustomMenu(
		rect,
		<NewPropertyMenuComponent ui={ui} saveField={saveField}></NewPropertyMenuComponent>,
		{},
		win,
		// make.md passes a null anchor, which positions like "left" (below the target).
		"left",
		onHide,
	);
