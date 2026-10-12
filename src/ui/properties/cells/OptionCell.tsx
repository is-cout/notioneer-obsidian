import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import { parseMultiString, serializeMultiDisplayString, serializeMultiString } from "../../../properties/parsers";
import i18n from "../../i18n";
import { defaultMenu, menuSeparator } from "../../menus/SelectMenu";
import { windowFromDocument } from "../../screen";
import { MenuObject, SelectMenuProps, SelectOption, SelectOptionType } from "../../types";
import { UI } from "../../ui";
import { CellEditMode, optionColors, TableCellMultiProp } from "../types";

const NO_COLOR = "var(--mk-color-none)";

/** The chips + menu shared by list and tag cells (make.md's `OptionCellBase`). */
export const OptionCellBase = (props: {
	ui: UI;
	value: string[];
	baseClass: string;
	menuProps: () => SelectMenuProps;
	labelElement: React.FC<PropsWithChildren<{ value: string }>>;
	multi: boolean;
	editMode: CellEditMode;
	selectLabel: string;
	removeValue: (value: string) => void;
}) => {
	const { value, menuProps } = props;
	const menuRef = useRef<MenuObject | null>(null);
	const ref = useRef<HTMLDivElement>(null);
	const showMenu = () => {
		if (menuRef.current) {
			menuRef.current.hide();
			menuRef.current = null;
			return;
		}
		if (!ref.current) return;
		menuRef.current = props.ui.openMenu(
			ref.current.getBoundingClientRect(),
			menuProps(),
			windowFromDocument(ref.current.ownerDocument),
			"bottom",
			() => (menuRef.current = null),
		);
	};
	const editable = props.editMode > CellEditMode.EditModeNone;
	const Label = props.labelElement;
	return (
		<div className={props.baseClass} ref={ref}>
			{value.length > 0 ? (
				value.map((o, i) => (
					<React.Fragment key={i}>
						<Label value={o}>
							{editable ? (
								!props.multi && value.length > 0 ? (
									<div
										onClick={(e) => {
											e.stopPropagation();
											showMenu();
										}}
										className="mk-cell-option-select mk-icon-xxsmall mk-icon-rotated"
										dangerouslySetInnerHTML={{ __html: props.ui.getSticker("ui//collapse-solid") }}
									/>
								) : props.multi ? (
									<div
										className="mk-cell-option-remove mk-icon-xxsmall"
										onClick={(e) => {
											e.stopPropagation();
											props.removeValue(o);
										}}
										dangerouslySetInnerHTML={{ __html: props.ui.getSticker("ui//close") }}
									></div>
								) : null
							) : null}
						</Label>
					</React.Fragment>
				))
			) : editable && !props.multi ? (
				<div className="mk-cell-option-item" onClick={() => showMenu()}>
					<div className="mk-cell-empty">{props.selectLabel}</div>
					<div
						className="mk-cell-option-select mk-icon-xxsmall mk-icon-rotated"
						dangerouslySetInnerHTML={{ __html: props.ui.getSticker("ui//collapse-solid") }}
					/>
				</div>
			) : props.editMode == CellEditMode.EditModeReadOnly ? (
				<div className="mk-cell-option-item mk-cell-empty">
					<div>{i18n.menu.none}</div>
				</div>
			) : (
				<></>
			)}
			{editable && props.multi ? (
				<div
					onClick={(e) => {
						e.stopPropagation();
						showMenu();
					}}
					className="mk-cell-option-new mk-icon-small"
					dangerouslySetInnerHTML={{ __html: props.ui.getSticker("ui//plus") }}
				/>
			) : (
				<></>
			)}
		</div>
	);
};

const parseValues = (value: string, multi: boolean) =>
	(multi ? parseMultiString(value) : [value]).filter((f) => f && f.length > 0);

const uniqueByValue = (options: SelectOption[]) =>
	options.filter((o, i, all) => all.findIndex((v) => v.value == o.value) === i);

/** A list (`option-multi`) or single option value. Frontmatter properties carry no option
    definitions, so the options are just the current values. */
export const OptionCell = (props: TableCellMultiProp) => {
	const removeable = props.editMode >= CellEditMode.EditModeView;
	const parseOptions = (existing: SelectOption[], values: string[]): SelectOption[] =>
		uniqueByValue([
			...existing.filter((f) => f.value).map((t) => ({ ...t, color: t.color ? t.color : undefined, removeable })),
			...values
				.filter((v) => !existing.find((o) => o.value === v))
				.map((f): SelectOption => ({ name: f, value: f, removeable })),
		]).filter((f) => (f.value ?? "").length > 0);

	const [value, setValue] = useState<string[]>(parseValues(props.initialValue, props.multi));
	const [options, setOptions] = useState<SelectOption[]>(parseOptions([], value));

	useEffect(() => {
		setValue(parseValues(props.initialValue, props.multi));
	}, [props.initialValue, props.multi]);
	// make.md rebuilds the options from the values whenever they change, so a colour picked
	// in the menu only lasts until the next save.
	useEffect(() => {
		setOptions(parseOptions([], value));
	}, [value, props.editMode]);

	const saveValues = (values: string[]) =>
		props.saveValue(props.multi ? serializeMultiString(values) : serializeMultiDisplayString(values));

	const removeValue = (v: string) => {
		if (props.multi) {
			const newValues = value.filter((f) => f != v);
			setValue(newValues);
			props.saveValue(newValues.length == 0 ? "" : serializeMultiString(newValues));
		} else {
			setValue([]);
			props.saveValue("");
		}
	};
	const removeOption = (option: string) => {
		const newValues = value.filter((f) => f != option);
		setOptions(options.filter((f) => f.value != option));
		setValue(newValues);
		saveValues(newValues);
	};
	const saveOptions = (_options: string[], _value: string[]) => {
		const newOptions = [...new Set([..._options, ..._value])]
			.filter((f) => f.length > 0)
			.map((t) => options.find((f) => f.value == t) ?? { name: t, value: t, color: NO_COLOR });
		if (props.editMode >= CellEditMode.EditModeView) setOptions(newOptions);
		const newValues = props.multi ? [...new Set([...value, _value[0]])] : _value;
		setValue(newValues);
		saveValues(newValues);
	};
	const saveOption = (option: string, newValue: SelectOption) => {
		setOptions(options.map((t) => (t.value == option ? newValue : t)));
		saveValues(value);
	};

	const showOptionMenu = (e: React.MouseEvent, optionValue: string) => {
		const option = options.find((f) => f.value == optionValue);
		if (!option) return;
		const menuOptions: SelectOption[] = [
			{
				name: "",
				type: SelectOptionType.Input,
				value: option.value,
				onValueChange: (v) => saveOption(optionValue, { ...option, value: v }),
				description: "",
			},
			menuSeparator,
			{ name: i18n.labels.none, color: NO_COLOR, onClick: () => saveOption(optionValue, { ...option, color: "" }) },
			...optionColors(i18n.colors).map(([name, color]) => ({
				name,
				value: color,
				color,
				onClick: () => saveOption(optionValue, { ...option, color }),
			})),
		];
		props.api.ui.openMenu(
			(e.target as HTMLElement).getBoundingClientRect(),
			defaultMenu(menuOptions),
			windowFromDocument(e.view.document),
		);
	};

	const menuProps = (): SelectMenuProps => {
		const _options: SelectOption[] = [];
		if (!props.multi) _options.push({ name: i18n.menu.none, value: "" });
		if (props.editMode >= CellEditMode.EditModeView) {
			_options.push(
				...options.map((f) => ({
					...f,
					onRemove: () => removeOption(f.value ?? ""),
					onMoreOptions: (e: React.MouseEvent) => showOptionMenu(e, f.value ?? ""),
				})),
			);
		}
		return {
			multi: false,
			editable: props.editMode >= CellEditMode.EditModeView,
			value,
			options: _options,
			saveOptions,
			placeholder: i18n.labels.optionItemSelectPlaceholder,
			searchable: true,
			showAll: true,
			onHide: () => props.setEditMode(null),
		};
	};

	return (
		<OptionCellBase
			ui={props.api.ui}
			baseClass="mk-cell-option"
			value={value}
			menuProps={menuProps}
			multi={props.multi}
			removeValue={removeValue}
			selectLabel={props.compactMode ? props.property.name : i18n.labels.select}
			editMode={props.editMode}
			labelElement={(_props) => {
				const color = options.find((f) => f.value == _props.value)?.color ?? NO_COLOR;
				return (
					<div
						className="mk-cell-option-item"
						style={{ background: `${color}`, color: color == NO_COLOR ? "inherit" : "var(--mk-color-white)" }}
					>
						<span>{_props.value}</span>
						{_props.children}
					</div>
				);
			}}
		></OptionCellBase>
	);
};
