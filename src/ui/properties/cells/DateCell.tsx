import classNames from "classnames";
import { startOfDay } from "date-fns";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDate, isoDateFormat, isValidDate, parseDate } from "../../../properties/dates";
import { windowFromDocument } from "../../screen";
import { MenuObject } from "../../types";
import { DatePickerTimeMode, showDatePickerMenu } from "../datePicker";
import { CellEditMode, TableCellProp } from "../types";

/** Date value with make.md's picker (make.md's `DateCell`). */
export const DateCell = (props: TableCellProp) => {
	const { settings, ui } = props.api;
	const [value, setValue] = useState(props.initialValue);
	useEffect(() => {
		setValue(props.initialValue);
	}, [props.initialValue]);
	const date = useMemo(() => {
		const dateTime = parseDate(value);
		return isValidDate(dateTime) ? dateTime : null;
	}, [value]);
	const saveValue = (newDate: Date, hasTime: boolean) => {
		const newValue = formatDate(settings, newDate, hasTime ? isoDateFormat : "yyyy-MM-dd");
		props.saveValue(newValue);
		setValue(newValue);
		props.setEditMode(null);
	};
	const menuRef = useRef<MenuObject | null>(null);
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (props.editMode == CellEditMode.EditModeActive && ref.current) {
			showPicker();
			ref.current.focus();
		}
	}, [props.editMode]);
	// As in make.md, the picker opens on today rather than on the current value.
	const defaultDate = (date ?? settings.datePickerTime) ? new Date() : startOfDay(new Date());
	const showPicker = useCallback(
		(e?: React.MouseEvent) => {
			if (props.editMode <= CellEditMode.EditModeNone) return;
			const target = e ? (e.target as HTMLElement) : ref.current;
			if (!target) return;
			menuRef.current = showDatePickerMenu(
				ui,
				settings,
				target.getBoundingClientRect(),
				e ? windowFromDocument(e.view.document) : window,
				defaultDate,
				saveValue,
				DatePickerTimeMode.Toggle,
				"bottom",
			);
		},
		[date],
	);

	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		e.stopPropagation();
		if (e.key == "Enter" || e.key == "Escape") {
			e.currentTarget.blur();
			if (date) saveValue(date, false);
			menuRef.current?.hide();
		}
	};
	const isEmpty = !(value?.length > 0);
	const display = <div className="mk-cell-text">{date ? formatDate(settings, date, null) : value}</div>;
	return props.editMode > CellEditMode.EditModeNone ? (
		<div className="mk-cell-date" onClick={(e) => showPicker(e)}>
			<div className={classNames("mk-cell-date-item", isEmpty && "mk-cell-date-new")}>
				<div className="mk-icon-xsmall" dangerouslySetInnerHTML={{ __html: ui.getSticker("ui//calendar") }}></div>
				{isEmpty && "Select"}
				{props.editMode != CellEditMode.EditModeActive ? (
					display
				) : (
					<input
						onClick={(e) => e.stopPropagation()}
						className="mk-cell-text"
						ref={ref}
						type="text"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						onKeyDown={onKeyDown}
					/>
				)}
			</div>
		</div>
	) : (
		display
	);
};
