// Adapted (via make.md) from React Tags https://github.com/react-tags/react-tags

import Fuse from "fuse.js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import i18n from "../i18n";
import { MenuObject, PointerModifiers, SelectOption, SelectSection } from "../types";
import { UI } from "../ui";
import { focusNextElement, matchExact } from "./matchers";
import SelectMenuSearch, { InputEventHandlers } from "./SelectMenuInput";
import SelectMenuSuggestions from "./SelectMenuSuggestions";

const KEYS = {
	ENTER: "Enter",
	TAB: "Tab",
	BACKSPACE: "Backspace",
	UP_ARROW: "ArrowUp",
	UP_ARROW_COMPAT: i18n.menu.up,
	DOWN_ARROW: "ArrowDown",
	DOWN_ARROW_COMPAT: i18n.menu.down,
};

const CLASS_NAMES: Record<string, string> = {
	root: "mk-menu-container",
	rootFocused: "mk-focused",
	selected: "mk-menu-input-wrapper",
	selectedTagWrapper: "mk-menu-selected-tag-wrapper",
	selectedTag: "mk-menu-selected-tag",
	selectedTagName: "mk-menu-selected-tag-name",
	search: "mk-menu-search",
	searchWrapper: "mk-menu-search-container",
	searchInput: "mk-menu-search-input",
	suggestions: "mk-menu-suggestions",
	suggestionActive: "mk-active",
	suggestionDisabled: "mk-disabled",
};

export type SelectMenuComponentProps = {
	ui: UI;
	tags: SelectOption[];
	hide: () => void;
	onHide?: () => void;
	wrapperClass?: string;
	suggestionsOnly: boolean;
	placeholderText: string;
	defaultSuggestions?: SelectOption[];
	suggestions: SelectOption[];
	previewComponent?: React.ReactNode;
	onSelectSection?: (section: string) => void;
	onDelete: (index: number) => void;
	onDeleteOption?: (value: string) => void;
	onAddition: (tag: SelectOption, modifiers: PointerModifiers) => void;
	onValidate?: (tag: SelectOption) => boolean;
	showSections?: boolean;
	sections?: SelectSection[];
	minQueryLength: number;
	maxSuggestionsLength: number;
	addKeyword?: string;
	allowNew?: boolean;
	isDisclosure?: boolean;
};

const MENU_ID = i18n.menu.selectmenu;
const DELIMITERS = [KEYS.ENTER];

const findMatchIndex = (options: SelectOption[], query: string) =>
	options.findIndex((option) => matchExact(query).test(option.name));

const getOptions = (props: SelectMenuComponentProps, query: string, section: string) => {
	const suggestions =
		section.length > 0 ? props.suggestions.filter((f) => f.section == section) : props.suggestions;
	const fuse = new Fuse(suggestions, { threshold: 0, ignoreLocation: true, keys: ["name", "value"] });
	const options = query.length == 0 ? suggestions : fuse.search(query).map((result) => result.item);
	return options.slice(0, props.maxSuggestionsLength);
};

/** The searchable option list inside every make.md menu. `ref` is set to a function the
    owner can call to focus the search input. */
const SelectMenuComponent = React.forwardRef<() => boolean, SelectMenuComponentProps>((props, ref) => {
	const [options, setOptions] = useState<SelectOption[]>([]);
	const refs = useRef<(HTMLDivElement | null)[]>([]);
	const sections: SelectSection[] = useMemo(() => {
		if (!props.showSections) return [];
		const own: SelectSection[] =
			props.sections ??
			[...new Set(props.suggestions.map((f) => f.section).filter((f): f is string => !!f))].map((f) => ({
				name: f,
				value: f,
			}));
		return [{ name: i18n.labels.all, value: "" }, ...own];
	}, [props.showSections, props.sections, props.suggestions]);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [section, setSection] = useState("");
	const [query, setQuery] = useState("");
	const [focused, setFocused] = useState(false);
	const [index, setIndex] = useState(0);
	const onComposition = useRef(false);

	useEffect(() => {
		if (ref && typeof ref !== "function") {
			ref.current = () => {
				if (!focused) {
					inputRef.current?.focus();
					setFocused(true);
					return false;
				}
				return true;
			};
		}
	}, [focused]);

	useEffect(() => {
		if (query.length == 0 && props.defaultSuggestions) {
			setOptions(props.defaultSuggestions);
			return;
		}
		setOptions(getOptions(props, query, section));
	}, [query, props.defaultSuggestions, section, props.suggestions]);

	const container = useRef<HTMLDivElement>(null);

	const clearInput = () => {
		setQuery("");
		setIndex(-1);
	};

	const addTag = (tag: SelectOption, modifiers: PointerModifiers) => {
		if (tag.disabled) return;
		if (props.onValidate && !props.onValidate(tag)) return;
		props.onAddition(tag, modifiers);
		clearInput();
	};

	const pressDelimiter = (modifiers: PointerModifiers) => {
		if (query.length < props.minQueryLength) return;
		// The user may have typed an existing suggestion.
		const match = findMatchIndex(options, query);
		const tag = (index === -1 ? options[match] : options[index]) ?? null;
		addTag(tag ?? { name: query, value: query }, modifiers);
	};

	const onInput = (e: React.ChangeEvent<HTMLInputElement> | React.CompositionEvent<HTMLInputElement>) => {
		// React doesn't handle IME (e.g. Chinese) input on its own.
		if (e.type === "compositionstart") {
			onComposition.current = true;
			return;
		}
		if (e.type === "compositionend") {
			onComposition.current = false;
			return;
		}
		const _query = e.currentTarget.value;
		// Last resort for soft keyboards and browsers without `KeyboardEvent.key`.
		if (_query.length === query.length + 1 && DELIMITERS.indexOf(query.slice(-1)) > -1) {
			pressDelimiter({});
		} else if (_query !== query) {
			setQuery(_query);
		}
	};

	const pressUpKey = (e: KeyboardEvent) => {
		e.preventDefault();
		const size = options.length - 1;
		const newIndex = index <= 0 ? size : index - 1;
		setIndex(options[newIndex]?.disabled ? (newIndex <= 0 ? size : newIndex - 1) : newIndex);
	};
	const pressDownKey = (e: KeyboardEvent) => {
		e.preventDefault();
		const size = options.length - 1;
		const newIndex = index >= size ? 0 : index + 1;
		setIndex(options[newIndex]?.disabled ? (newIndex >= size ? 0 : newIndex + 1) : newIndex);
	};
	const pressTabKey = (e: KeyboardEvent) => {
		if (!props.showSections) return;
		e.preventDefault();
		e.stopPropagation();
		setSection((p) => {
			const sectionIndex = sections.findIndex((g) => g.value == p);
			const next = e.shiftKey ? sectionIndex - 1 : sectionIndex + 1;
			if (next < 0 || next >= sections.length) return p;
			props.onSelectSection?.(sections[next].value);
			return sections[next].value;
		});
	};

	const onKeyDown = (e: KeyboardEvent) => {
		if (onComposition.current) return;
		if (DELIMITERS.indexOf(e.key) > -1) {
			if (query || index > -1) e.preventDefault();
			pressDelimiter({ ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey, shiftKey: e.shiftKey });
		}
		if (e.key == "Escape") return;
		if (e.key === KEYS.TAB) pressTabKey(e);
		// Backspace on an empty query removes the last selected value.
		if (e.key === KEYS.BACKSPACE && !query.length) props.onDelete(props.tags.length - 1);
		if (e.key === KEYS.UP_ARROW || e.key === KEYS.UP_ARROW_COMPAT) pressUpKey(e);
		if (e.key === KEYS.DOWN_ARROW || e.key === KEYS.DOWN_ARROW_COMPAT) pressDownKey(e);
		e.stopPropagation();
	};

	useEffect(() => {
		props.ui.inputManager.on("keydown", onKeyDown);
		return () => props.ui.inputManager.off("keydown", onKeyDown);
	}, [options, index]);

	const onDeleteTag = (tagIndex: number, event: React.MouseEvent) => {
		// The element with focus is about to be destroyed; move focus next to it first.
		if (container.current) focusNextElement(container.current, event.currentTarget);
		props.onDelete(tagIndex);
	};

	const inputEventHandlers: InputEventHandlers = {
		onChange: onInput,
		onCompositionEnd: onInput,
		onCompositionStart: onInput,
	};

	const expanded = focused && query.length >= props.minQueryLength;
	const classNames = { ...CLASS_NAMES };
	if (props.wrapperClass) classNames.root = `${classNames.root} ${props.wrapperClass}`;
	const rootClassNames = [classNames.root];
	if (focused) rootClassNames.push(classNames.rootFocused);
	const submenuRef = useRef<MenuObject | null>(null);
	const openSubmenu = (menu: MenuObject) => {
		submenuRef.current?.hide(true);
		submenuRef.current = menu;
	};

	return (
		<div
			ref={container}
			className={rootClassNames.join(" ")}
			style={!props.suggestionsOnly ? ({ "--mk-menu-max-height": "200px" } as React.CSSProperties) : {}}
		>
			{!props.suggestionsOnly ? (
				<div className={classNames.selected} aria-relevant="additions removals" aria-live="polite">
					{props.tags.length > 0 && (
						<div className={classNames.selectedTagWrapper}>
							{props.tags.map((tag, i) => (
								<button
									key={i}
									type="button"
									className={classNames.selectedTag}
									onClick={(e) => onDeleteTag(i, e)}
								>
									<span className={classNames.selectedTagName}>{tag.name}</span>
								</button>
							))}
						</div>
					)}
					<SelectMenuSearch
						ui={props.ui}
						ref={inputRef}
						query={query}
						index={index}
						id={MENU_ID}
						currentSection={sections.find((f) => f.value == section)}
						classNames={classNames}
						inputEventHandlers={inputEventHandlers}
						expanded={expanded}
						placeholderText={props.placeholderText}
					/>
				</div>
			) : null}
			{props.showSections ? (
				<div className="mk-menu-sections">
					{sections.map((f, i) => (
						<div
							key={i}
							onClick={(e) => {
								e.stopPropagation();
								setSection(f.value);
								props.onSelectSection?.(f.value);
							}}
							className={`${section == f.value ? "is-active" : ""} mk-menu-section`}
						>
							{f.name == "" ? i18n.labels.all : f.name}
						</div>
					))}
				</div>
			) : (
				<></>
			)}
			{options.length || props.allowNew ? (
				<SelectMenuSuggestions
					ui={props.ui}
					hide={() => props.hide()}
					addKeyword={props.addKeyword}
					refs={refs}
					options={options}
					query={query}
					setIndex={setIndex}
					index={index}
					onHide={props.onHide}
					id={MENU_ID}
					classNames={classNames}
					expanded={expanded}
					selectOption={addTag}
					allowNew={props.allowNew}
					deleteOption={props.onDeleteOption}
					isDisclosureMenu={props.isDisclosure}
					openSubmenu={openSubmenu}
				/>
			) : null}
			{props.previewComponent}
		</div>
	);
});

SelectMenuComponent.displayName = "SelectMenuComponent";
export default SelectMenuComponent;
