import React, { useMemo } from "react";
import { ensureString, isRecord, parseObject } from "../../../properties/parsers";
import i18n from "../../i18n";
import { defaultMenu, menuSeparator } from "../../menus/SelectMenu";
import { InputModal } from "../../modals/InputModal";
import { windowFromDocument } from "../../screen";
import { SelectOption } from "../../types";
import { DataPropertyView } from "../PropertyRow";
import { CellEditMode, TableCellMultiProp } from "../types";

type ObjectValue = Record<string, unknown>;

const moveItem = <T,>(items: T[], from: number, to: number) => {
	const copy = [...items];
	const [item] = copy.splice(from, 1);
	copy.splice(to, 0, item);
	return copy;
};

/** One object's fields as nested property rows (make.md's `ObjectEditor`). A frontmatter
    object has no type definition, so every field is text. */
const ObjectEditor = (props: {
	cell: TableCellMultiProp;
	value: ObjectValue;
	saveValue: (newValue: ObjectValue) => void;
	draggable: boolean;
	showDragMenu?: (e: React.MouseEvent) => void;
}) => {
	const { value, saveValue, cell } = props;
	const showPropertyMenu = (e: React.MouseEvent, field: string) => {
		const menuOptions: SelectOption[] = [
			{
				name: i18n.menu.rename,
				icon: "ui//edit",
				value: "edit",
				onClick: () => {
					cell.api.ui.openModal(
						i18n.labels.rename,
						<InputModal
							value={field}
							saveLabel={i18n.labels.rename}
							saveValue={(newKey) => {
								if (field != newKey) saveValue({ ...value, [newKey]: value[field], [field]: undefined });
							}}
						></InputModal>,
						windowFromDocument(e.view.document),
					);
				},
			},
			{
				name: i18n.buttons.delete,
				icon: "ui//trash",
				value: "delete",
				onClick: () => saveValue(Object.fromEntries(Object.entries(value).filter(([k]) => k != field))),
			},
		];
		cell.api.ui.openMenu(
			(e.target as HTMLElement).getBoundingClientRect(),
			defaultMenu(menuOptions),
			windowFromDocument(e.view.document),
		);
	};
	return (
		<div className="mk-cell-object-group">
			{props.draggable && (
				<div className="mk-cell-object-group-header" onClick={(e) => props.showDragMenu?.(e)}>
					{i18n.fieldTypes.object}
				</div>
			)}
			<div className="mk-cell-object">
				{Object.keys(value).map((name, i) => (
					<DataPropertyView
						key={i}
						api={cell.api}
						path={cell.path}
						initialValue={ensureString(value[name])}
						updateValue={(v) => saveValue({ ...value, [name]: v })}
						propertyMenu={(e) => showPropertyMenu(e, name)}
						compactMode={cell.compactMode}
						column={{ name, type: "text" }}
						editMode={CellEditMode.EditModeAlways}
					></DataPropertyView>
				))}
			</div>
		</div>
	);
};

/** An object, or a list of objects, in frontmatter (make.md's `ObjectCell`). */
export const ObjectCell = (props: TableCellMultiProp) => {
	const value = useMemo(() => parseObject(props.initialValue, props.multi), [props.initialValue, props.multi]);
	const items = Array.isArray(value) ? value.map((f) => (isRecord(f) ? f : {})) : [];
	const save = (newValue: unknown) => props.saveValue(JSON.stringify(newValue));

	const showItemMenu = (e: React.MouseEvent, index: number) => {
		// "Insert above/below" add an item shaped like the property's object type; a frontmatter
		// property has none (make.md threw here), so they do nothing.
		const menuOptions: SelectOption[] = [
			{ name: i18n.menu.insertAbove, value: "insert-above" },
			{ name: i18n.menu.insertBelow, value: "insert-below" },
			menuSeparator,
		];
		if (index > 0) {
			menuOptions.push({
				name: i18n.menu.moveUp,
				value: "move-up",
				onClick: () => save(moveItem(items, index, index - 1)),
			});
		}
		if (index < items.length - 1) {
			menuOptions.push({
				name: i18n.menu.moveDown,
				value: "move-down",
				onClick: () => save(moveItem(items, index, index + 1)),
			});
		}
		menuOptions.push(menuSeparator, {
			name: i18n.buttons.delete,
			icon: "ui//trash",
			value: "delete",
			onClick: () => save(items.filter((_, i) => i != index)),
		});
		props.api.ui.openMenu(
			(e.target as HTMLElement).getBoundingClientRect(),
			defaultMenu(menuOptions),
			windowFromDocument(e.view.document),
		);
	};

	if (props.multi) {
		return (
			<div className="mk-cell-object-multi">
				{items.map((item, i) => (
					<ObjectEditor
						key={i}
						cell={props}
						value={item}
						saveValue={(newValue) => save(items.map((f, j) => (j == i ? newValue : f)))}
						draggable={true}
						showDragMenu={(e) => showItemMenu(e, i)}
					></ObjectEditor>
				))}
			</div>
		);
	}
	return <ObjectEditor cell={props} value={isRecord(value) ? value : {}} saveValue={save} draggable={false}></ObjectEditor>;
};
