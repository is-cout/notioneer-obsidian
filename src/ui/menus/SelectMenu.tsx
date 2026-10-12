import React, { useCallback, useEffect, useState } from "react";
import { parseMultiString } from "../../properties/parsers";
import { Anchors, PointerModifiers, Rect, SelectMenuProps, SelectOption, SelectOptionType } from "../types";
import { windowFromDocument } from "../screen";
import { UI } from "../ui";
import { showMenu } from "./menu";
import SelectMenuComponent from "./SelectMenuComponent";

const withIds = (options: SelectOption[]) => options.map((o, i) => ({ ...o, id: i + 1 }));

/** make.md's `SelectMenu`: owns the selected values and the option list, and hands the
    rendering to `SelectMenuComponent`. */
const SelectMenu = React.forwardRef<() => boolean, SelectMenuProps & { ui: UI; hide?: () => void }>(
	(props, ref) => {
		const hide = () => props.hide?.();
		const [selectedSection, setSelectedSection] = useState<string | null>(null);
		const onSelectSection = useCallback(
			(section: string) => {
				setSelectedSection(section);
				props.onSelectSection?.(section);
			},
			[props],
		);
		const initialOptions = withIds(props.options);
		useEffect(() => {
			setSuggestions(withIds(props.options));
		}, [props.options]);
		const [suggestions, setSuggestions] = useState<SelectOption[]>(initialOptions);
		const [tags, setTags] = useState<SelectOption[]>(
			props.value.map((v) => initialOptions.find((f) => f.value == v) ?? { id: 0, name: v, value: v }),
		);
		const valuesOf = (options: SelectOption[]) => options.map((f) => f.value ?? "");

		const onDelete = useCallback(
			(tagIndex: number) => {
				const newTags = tags.filter((_, i) => i !== tagIndex);
				setTags(newTags);
				props.saveOptions?.(valuesOf(suggestions), valuesOf(newTags), false);
			},
			[suggestions, tags, props],
		);

		const onDeleteOption = useCallback(
			(removeTag: string) => {
				setSuggestions(suggestions.filter((f) => f.value != removeTag));
				setTags(tags.filter((f) => f.value != removeTag));
				props.removeOption?.(removeTag);
				hide();
			},
			[tags, suggestions, props],
		);

		const onAddition = useCallback(
			(newTag: SelectOption, _modifiers: PointerModifiers) => {
				let tag = newTag;
				let newSuggestions = suggestions;
				let newTags = tags;
				if (!suggestions.find((s) => s.value == newTag.value)) {
					tag = { id: suggestions.length + 1, name: newTag.name, value: newTag.value ?? newTag.name };
					newSuggestions = [...suggestions, tag];
					setSuggestions(newSuggestions);
				}
				if (props.multi) {
					if (!tags.find((t) => t.value == tag.value)) {
						newTags = [...tags, tag];
						setTags(newTags);
					}
				} else {
					newTags = [tag];
					setTags(newTags);
				}
				props.saveOptions?.(valuesOf(newSuggestions), valuesOf(newTags), true, selectedSection ?? undefined);
				if (!props.multi && newTag.type != SelectOptionType.Disclosure) hide();
			},
			[tags, suggestions, selectedSection],
		);

		const onValidation = useCallback(
			(newTag: SelectOption) => {
				if (!props.editable && !suggestions.find((s) => s.value == newTag.value)) return false;
				return newTag.name.length > 0;
			},
			[suggestions],
		);

		return (
			<SelectMenuComponent
				tags={props.multi ? tags : []}
				suggestions={suggestions}
				ui={props.ui}
				ref={ref}
				addKeyword={props.addKeyword}
				hide={hide}
				onDelete={onDelete}
				wrapperClass={props.wrapperClass}
				onDeleteOption={onDeleteOption}
				onAddition={onAddition}
				onValidate={onValidation}
				onSelectSection={onSelectSection}
				defaultSuggestions={props.defaultOptions}
				placeholderText={props.placeholder ?? ""}
				minQueryLength={0}
				showSections={props.showSections}
				sections={props.sections}
				maxSuggestionsLength={props.showAll ? Math.min(50, props.options.length) : 25}
				suggestionsOnly={!props.searchable && !props.editable}
				allowNew={props.editable}
				previewComponent={props.previewComponent}
				isDisclosure={props.isDisclosure}
			/>
		);
	},
);
SelectMenu.displayName = "SelectMenu";
export default SelectMenu;

export const showSelectMenu = (
	ui: UI,
	rect: Rect,
	optionProps: SelectMenuProps,
	win: Window,
	defaultAnchor: Anchors,
	onHide?: () => void,
	force?: boolean,
) =>
	showMenu({
		ui,
		rect,
		anchor: defaultAnchor,
		win,
		fc: <SelectMenu ui={ui} {...optionProps} />,
		onHide,
		className: optionProps.searchable ? "mk-combo-menu" : "mk-select-menu",
		force,
	});

export const defaultMenu = (options: SelectOption[]): SelectMenuProps => ({
	multi: false,
	value: [],
	editable: false,
	options,
	searchable: false,
	showAll: true,
});

export const menuSeparator: SelectOption = {
	name: "",
	type: SelectOptionType.Separator,
	disabled: true,
};

export const showDisclosureMenu = (
	ui: UI,
	e: React.MouseEvent,
	multi: boolean,
	editable: boolean,
	value: string,
	options: SelectOption[],
	saveOptions: (options: string[], value: string[]) => void,
) => {
	const offset = (e.target as HTMLElement).getBoundingClientRect();
	ui.openMenu(
		offset,
		{
			multi,
			editable,
			value: parseMultiString(value) ?? [],
			options,
			saveOptions,
			searchable: true,
			showAll: true,
			isDisclosure: true,
		},
		windowFromDocument(e.view.document),
	);
};
