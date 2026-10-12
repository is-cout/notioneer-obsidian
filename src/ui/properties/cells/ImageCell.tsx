import React, { useMemo } from "react";
import { parseMultiString, serializeMultiString } from "../../../properties/parsers";
import ImageModal from "../../modals/ImageModal";
import { windowFromDocument } from "../../screen";
import { CellEditMode, TableCellMultiProp } from "../types";

/** Image value(s) with make.md's image picker (make.md's `ImageCell`). */
export const ImageCell = (props: TableCellMultiProp) => {
	const { initialValue, multi, api } = props;
	const [value, setValue] = React.useState<string[]>(parseMultiString(initialValue));
	const sourcePaths = useMemo(() => value.map((f) => api.getUIPath(f)), [value]);

	React.useEffect(() => {
		setValue(parseMultiString(initialValue));
	}, [initialValue]);

	const deleteValue = (index: number) => {
		if (multi) {
			const newValue = [...value];
			newValue.splice(index, 1);
			setValue(newValue);
			props.saveValue(serializeMultiString(newValue));
		} else {
			props.saveValue("");
		}
	};
	const saveValue = (index: number, image: string) => {
		if (!multi) props.saveValue(image);
		else if (index == -1) props.saveValue(serializeMultiString([...value, image]));
		else props.saveValue(serializeMultiString(value.map((f, i) => (i == index ? image : f))));
	};
	const showModal = (index: number, e: React.MouseEvent) => {
		api.ui.openPalette(
			<ImageModal api={api} selectedPath={(image) => saveValue(index, image)}></ImageModal>,
			windowFromDocument(e.view.document),
		);
		props.setEditMode(null);
	};
	const editable = props.editMode > CellEditMode.EditModeNone;
	return (
		<div className="mk-cell-image">
			{sourcePaths.map((f, i) => (
				<div key={i} className="mk-cell-image-item">
					<img onClick={(e) => api.openPath(initialValue, e.metaKey)} src={f} />
					{editable ? (
						<div className="mk-image-selector">
							<div
								onClick={(e) => showModal(i, e)}
								className="mk-hover-button mk-icon-xsmall"
								dangerouslySetInnerHTML={{ __html: api.ui.getSticker("ui//edit") }}
							></div>
							<div
								onClick={() => deleteValue(i)}
								className={"mk-hover-button mk-icon-xsmall"}
								dangerouslySetInnerHTML={{ __html: api.ui.getSticker("ui//close") }}
							></div>
						</div>
					) : (
						<></>
					)}
				</div>
			))}
			{editable ? (
				multi ? (
					<div
						onClick={(e) => showModal(-1, e)}
						className="mk-cell-option-new mk-icon-small"
						dangerouslySetInnerHTML={{ __html: api.ui.getSticker("ui//plus") }}
					/>
				) : value.length == 0 ? (
					<div onClick={(e) => showModal(-1, e)} className="mk-cell-clickable">
						Select
					</div>
				) : null
			) : (
				<></>
			)}
		</div>
	);
};
