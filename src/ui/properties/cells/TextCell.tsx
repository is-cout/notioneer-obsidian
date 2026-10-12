import React, { useEffect, useRef } from "react";
import i18n from "../../i18n";
import { CellEditMode, TableCellProp } from "../types";

/** Plain text value, edited in place (make.md's `TextCell`). */
export const TextCell = (props: TableCellProp) => {
	const { initialValue, saveValue } = props;
	const ref = useRef<HTMLDivElement>(null);

	const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
		const value = e.currentTarget.innerText;
		if (initialValue != value) saveValue(value);
	};

	const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		e.stopPropagation();
		if (e.key == "Enter" && !e.shiftKey) {
			e.currentTarget.blur();
			props.setEditMode(null);
		}
		if (e.key == "Escape") {
			if (ref.current) ref.current.innerText = initialValue;
			e.currentTarget.blur();
			props.setEditMode(null);
		}
	};

	useEffect(() => {
		if (props.editMode == CellEditMode.EditModeActive && ref.current) {
			const sel = window.getSelection();
			sel?.selectAllChildren(ref.current);
			sel?.collapseToEnd();
		}
	}, [props.editMode]);

	return props.editMode > CellEditMode.EditModeView ? (
		<div
			onClick={(e) => e.stopPropagation()}
			className="mk-cell-text"
			ref={ref}
			data-ph={props.compactMode ? props.property.name : i18n.labels.empty}
			onKeyDown={onKeyDown}
			onBlur={onBlur}
			contentEditable={true}
			dangerouslySetInnerHTML={{ __html: initialValue }}
		/>
	) : (
		<div className="mk-cell-text">{initialValue}</div>
	);
};
