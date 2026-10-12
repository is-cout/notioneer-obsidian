import React, { useEffect, useRef, useState } from "react";
import i18n from "../i18n";
import { MenuObject, PointerModifiers, SelectOption, SelectOptionType } from "../types";
import { UI } from "../ui";
import { matchAny } from "./matchers";

const markIt = (name: string, query: string) => name?.replace(matchAny(query), "<mark>$&</mark>");

type ScrollableElement = HTMLDivElement & { scrollIntoViewIfNeeded?: () => void };

const SelectMenuSuggestionsComponent = (props: {
	ui: UI;
	item: SelectOption;
	query: string;
	active: boolean;
	onDeleteOption?: (value: string) => void;
}) => {
	const ref = useRef<ScrollableElement>(null);
	useEffect(() => {
		if (props.active) ref.current?.scrollIntoViewIfNeeded?.();
	}, [props.active]);

	const { item } = props;
	return (
		<>
			{item.icon && (
				<div className="mk-sticker" dangerouslySetInnerHTML={{ __html: props.ui.getSticker(item.icon) }}></div>
			)}
			<div ref={ref} className="mk-menu-options-inner">
				{item.onToggle && <div>{i18n.menu.toggle}</div>}
				<span
					style={
						item.color
							? {
									background: item.color,
									padding: "2px 4px",
									borderRadius: "4px",
									color: item.color == "var(--mk-color-none)" ? "inherit" : "var(--mk-color-white)",
								}
							: {}
					}
					dangerouslySetInnerHTML={{
						__html: props.query.length > 0 ? markIt(item.name, props.query) : item.name,
					}}
				/>
				{item.description && (
					<span
						aria-label={item.description}
						className="mk-menu-options-description"
						dangerouslySetInnerHTML={{ __html: markIt(item.description, props.query) }}
					/>
				)}
			</div>
			{item.type == SelectOptionType.Disclosure && <span>{item.value}</span>}
			{item.type == SelectOptionType.Radio && item.value && (
				<div className="mk-icon-small" dangerouslySetInnerHTML={{ __html: props.ui.getSticker("ui//check") }}></div>
			)}
			{item.onMoreOptions ? (
				<div
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						item.onMoreOptions?.(e);
					}}
					className="mk-icon-small"
					dangerouslySetInnerHTML={{ __html: props.ui.getSticker("ui//options") }}
				></div>
			) : null}
			{item.onRemove && (
				<div
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						item.onRemove?.();
						if (item.value !== undefined) props.onDeleteOption?.(item.value);
					}}
					className="mk-icon-small"
					dangerouslySetInnerHTML={{ __html: props.ui.getSticker("ui//close") }}
				></div>
			)}
			{item.type == SelectOptionType.Submenu && (
				<div
					className="mk-icon-small"
					dangerouslySetInnerHTML={{ __html: props.ui.getSticker("ui//chevron-right") }}
				></div>
			)}
		</>
	);
};

const SelectMenuInput = (props: {
	value: string;
	setValue: (value: string) => void;
	placeholder: string | undefined;
}) => {
	const [value, setValue] = useState(props.value);
	return (
		<input
			type="text"
			value={value}
			onKeyDown={(e) => {
				if (e.key == "Enter") props.setValue(value);
			}}
			placeholder={props.placeholder}
			onMouseDown={(e) => e.stopPropagation()}
			onClick={(e) => e.stopPropagation()}
			onFocus={(e) => e.stopPropagation()}
			onChange={(e) => setValue(e.target.value)}
			onBlur={() => props.setValue(value)}
		></input>
	);
};

const modifiersOf = (e: React.MouseEvent): PointerModifiers => ({
	ctrlKey: e.ctrlKey,
	metaKey: e.metaKey,
	altKey: e.altKey,
	shiftKey: e.shiftKey,
});

const SelectMenuSuggestions = (props: {
	expanded: boolean;
	options: SelectOption[];
	query: string;
	addKeyword?: string;
	refs: React.MutableRefObject<(HTMLDivElement | null)[]>;
	hide: () => void;
	onHide?: () => void;
	selectOption: (item: SelectOption, modifiers: PointerModifiers) => void;
	deleteOption?: (option: string) => void;
	id: string;
	classNames: Record<string, string>;
	index: number;
	setIndex: (index: number) => void;
	allowNew?: boolean;
	ui: UI;
	isDisclosureMenu?: boolean;
	openSubmenu?: (menu: MenuObject) => void;
}) => {
	const rectAt = (index: number) => props.refs.current[index]?.getBoundingClientRect();
	const hideAll = () => {
		if (props.onHide) props.onHide();
		props.hide();
	};
	const options = props.options.map((item, index) => {
		const key = `${props.id}-${index}`;
		const className =
			item.type == SelectOptionType.Separator
				? "mk-menu-separator"
				: item.type == SelectOptionType.Input
					? "mk-menu-input"
					: item.type == SelectOptionType.Custom
						? "mk-menu-custom"
						: `mk-menu-option ${props.index === index && props.classNames.suggestionActive} ${
								item.disabled && props.classNames.suggestionDisabled
							}`;
		const Fragment = item.fragment;
		return (
			<div
				ref={(ref) => {
					props.refs.current[index] = ref;
				}}
				onMouseDown={(e) => {
					if (!props.isDisclosureMenu) e.stopPropagation();
					e.preventDefault();
				}}
				onClick={(e) => {
					const rect = rectAt(index);
					if (item.onSubmenu && props.openSubmenu && rect) {
						props.openSubmenu(item.onSubmenu(rect, hideAll));
					} else if (item.onClick) {
						item.onClick(e);
						if (item.type != SelectOptionType.Submenu && item.type != SelectOptionType.Disclosure) {
							props.hide();
						}
					} else if (
						item.type == null ||
						item.type == SelectOptionType.Option ||
						item.type == SelectOptionType.Disclosure
					) {
						props.selectOption(item, { ...modifiersOf(e), doubleClick: e.detail == 2 });
						if (!props.isDisclosureMenu) e.stopPropagation();
					}
				}}
				id={key}
				key={key}
				className={className}
			>
				{item.type == SelectOptionType.Separator ? (
					<></>
				) : item.type == SelectOptionType.Section ? (
					<div className="mk-menu-options-section">{item.name}</div>
				) : item.type == SelectOptionType.Input ? (
					<SelectMenuInput
						value={item.value ?? ""}
						setValue={(value) => item.onValueChange?.(value)}
						placeholder={item.description}
					></SelectMenuInput>
				) : item.type == SelectOptionType.Custom && Fragment ? (
					<Fragment
						hide={props.hide}
						onSubmenu={(openSubmenu) => {
							const rect = rectAt(index);
							if (props.openSubmenu && rect) props.openSubmenu(openSubmenu(rect, hideAll));
						}}
					/>
				) : (
					<SelectMenuSuggestionsComponent
						ui={props.ui}
						item={item}
						query={props.query}
						active={index == props.index}
						onDeleteOption={props.deleteOption}
					/>
				)}
			</div>
		);
	});

	return (
		<div className="mk-menu-suggestions">
			{options}
			{props.query && props.allowNew && (
				<div
					className="mk-menu-option"
					onMouseDown={(e) => e.preventDefault()}
					onClick={(e) => props.selectOption({ name: props.query, value: props.query }, modifiersOf(e))}
				>
					<div className="mk-sticker" dangerouslySetInnerHTML={{ __html: props.ui.getSticker("ui//plus") }}></div>
					<div className="mk-menu-options-inner">
						{props.addKeyword ?? "Add"} {props.query}
					</div>
				</div>
			)}
		</div>
	);
};

export default SelectMenuSuggestions;
