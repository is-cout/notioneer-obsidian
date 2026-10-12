import React, { useEffect } from "react";
import { CellEditMode, TableCellProp } from "../types";

const parse = (value: string) => (value == "true" ? true : value == "false" ? false : undefined);

/** Checkbox (make.md's `BooleanCell`; frontmatter properties have no custom stickers). */
export const BooleanCell = (props: TableCellProp) => {
	const { initialValue, saveValue } = props;
	const [value, setValue] = React.useState(parse(initialValue));

	const onChange = () => {
		if (props.editMode == CellEditMode.EditModeReadOnly) return;
		setValue(!value);
		saveValue(!value ? "true" : "false");
	};

	useEffect(() => {
		if (props.editMode == CellEditMode.EditModeActive) {
			setValue(!value);
			saveValue(!value ? "true" : "false");
			props.setEditMode(null);
		}
	}, [props.editMode]);

	useEffect(() => {
		setValue(parse(initialValue));
	}, [initialValue]);

	return (
		<div className="mk-cell-boolean">
			<input type="checkbox" checked={value} onChange={onChange} />
		</div>
	);
};
