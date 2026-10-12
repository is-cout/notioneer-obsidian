import React, { useEffect, useRef } from "react";
import { CellEditMode, TableCellProp } from "../types";

/** Number input (make.md's `NumberCell`; frontmatter properties have no number format). */
export const NumberCell = (props: TableCellProp) => {
	const { initialValue, saveValue } = props;
	const [value, setValue] = React.useState(initialValue);
	const ref = useRef<HTMLInputElement>(null);

	const onBlur = () => {
		if (initialValue != value) saveValue(value);
	};

	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		e.stopPropagation();
		if (e.key == "Enter") {
			e.currentTarget.blur();
			props.setEditMode(null);
		}
		if (e.key == "Escape") {
			setValue(initialValue);
			e.currentTarget.blur();
			props.setEditMode(null);
		}
	};

	useEffect(() => {
		setValue(initialValue);
	}, [initialValue]);

	useEffect(() => {
		if (props.editMode == CellEditMode.EditModeActive) ref.current?.focus();
	}, [props.editMode]);

	return props.editMode > CellEditMode.EditModeView ? (
		<input
			className="mk-cell-text"
			type="number"
			ref={ref}
			value={value ?? ""}
			onChange={(e) => setValue(e.target.value)}
			onKeyDown={onKeyDown}
			onBlur={onBlur}
		/>
	) : (
		<div className="mk-cell-number">{value ?? ""}</div>
	);
};
