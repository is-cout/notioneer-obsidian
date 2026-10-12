import React from "react";
import { fieldTypeForType, Property, propertyIsObjectType, stickerForField } from "../../properties/fieldTypes";
import { parseObject } from "../../properties/parsers";
import { HeaderApi } from "../header/api";
import i18n from "../i18n";
import { windowFromDocument } from "../screen";
import { BooleanCell } from "./cells/BooleanCell";
import { DateCell } from "./cells/DateCell";
import { ImageCell } from "./cells/ImageCell";
import { LinkCell } from "./cells/LinkCell";
import { NumberCell } from "./cells/NumberCell";
import { ObjectCell } from "./cells/ObjectCell";
import { OptionCell } from "./cells/OptionCell";
import { TagCell } from "./cells/TagCell";
import { TextCell } from "./cells/TextCell";
import { showNewPropertyMenu } from "./newPropertyMenu";
import { CellEditMode, TableCellProp } from "./types";

export type DataTypeViewProps = {
	api: HeaderApi;
	initialValue: string;
	column: Property;
	editMode: CellEditMode;
	updateValue: (value: string) => void;
	compactMode: boolean;
	/** The note the row belongs to. */
	path: string;
};

/** Picks the cell for a property's type (make.md's `DataTypeView`, frontmatter types only). */
export const DataTypeView = (props: DataTypeViewProps) => {
	const { column } = props;
	const viewProps: TableCellProp = {
		api: props.api,
		initialValue: props.initialValue,
		saveValue: (value) => props.updateValue(value),
		editMode: props.editMode,
		setEditMode: () => null,
		path: props.path,
		property: column,
		compactMode: props.compactMode,
	};
	const fieldType = fieldTypeForType(column.type, column.name);
	if (!fieldType) return <></>;
	const multi = fieldType.multiType == column.type;
	switch (fieldType.type) {
		case "boolean":
			return <BooleanCell {...viewProps}></BooleanCell>;
		case "option":
			return <OptionCell {...viewProps} multi={multi}></OptionCell>;
		case "date":
			return <DateCell {...viewProps}></DateCell>;
		case "number":
			return <NumberCell {...viewProps}></NumberCell>;
		case "link":
			return <LinkCell {...viewProps} multi={multi}></LinkCell>;
		case "tags-multi":
			return <TagCell {...viewProps}></TagCell>;
		case "image":
			return <ImageCell {...viewProps} multi={multi}></ImageCell>;
		case "object":
			return <ObjectCell {...viewProps} multi={multi}></ObjectCell>;
	}
	return <TextCell {...viewProps}></TextCell>;
};

/** A property's icon and name; clicking opens its menu (make.md's `PropertyField`). */
export const PropertyField = (props: { api: HeaderApi; property: Property; onClick?: (e: React.MouseEvent) => void }) => (
	<div className="mk-path-context-field" onClick={(e) => props.onClick?.(e)}>
		<div
			className="mk-path-context-field-icon"
			dangerouslySetInnerHTML={{ __html: props.api.ui.getSticker(stickerForField(props.property)) }}
		></div>
		<div className="mk-path-context-field-key">{props.property.name}</div>
	</div>
);

/** One property row: name on the left, value cell on the right (make.md's
    `DataPropertyView`). Objects get their add buttons in the row and their fields below. */
export const DataPropertyView = (props: DataTypeViewProps & { propertyMenu?: (e: React.MouseEvent) => void }) => {
	const isObjectType = propertyIsObjectType(props.column);
	const newProperty = (e: React.MouseEvent) => {
		const value = parseObject(props.initialValue ?? "", props.column.type == "object-multi");
		showNewPropertyMenu(
			props.api.ui,
			(e.target as HTMLElement).getBoundingClientRect(),
			windowFromDocument(e.view.document),
			(field) => {
				// make.md records the field's type in the property definition, which a note's
				// frontmatter does not keep; only the empty value is saved.
				if (props.column.type != "object-multi") {
					props.updateValue(JSON.stringify({ ...(value as Record<string, unknown>), [field.name]: "" }));
				}
				return true;
			},
		);
	};

	if (props.compactMode) {
		return (
			<div>
				<DataTypeView {...props}></DataTypeView>
			</div>
		);
	}
	return (
		<>
			<div className="mk-path-context-row">
				<PropertyField api={props.api} property={props.column} onClick={(e) => props.propertyMenu?.(e)}></PropertyField>
				<div className="mk-path-context-value">
					{isObjectType ? (
						<div className="mk-cell-object-options">
							{props.editMode > CellEditMode.EditModeValueOnly && (
								<button onClick={(e) => newProperty(e)} className="mk-inline-button">
									<div
										className="mk-icon-xsmall"
										dangerouslySetInnerHTML={{ __html: props.api.ui.getSticker("ui//plus") }}
									></div>
									{i18n.labels.propertyFileProp}
								</button>
							)}
							{props.column.type == "object-multi" && (
								// make.md inserts an item shaped like the property's object type; a
								// frontmatter property has none, so this does nothing (it threw there).
								<button className="mk-inline-button">
									<div
										className="mk-icon-xsmall"
										dangerouslySetInnerHTML={{ __html: props.api.ui.getSticker("ui//insert") }}
									></div>
									{"Object"}
								</button>
							)}
						</div>
					) : (
						<DataTypeView {...props}></DataTypeView>
					)}
				</div>
			</div>
			{isObjectType && (
				<div className="mk-path-context-row" style={{ marginLeft: "30px" }}>
					<DataTypeView {...props}></DataTypeView>
				</div>
			)}
		</>
	);
};
