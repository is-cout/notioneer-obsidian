import React, { CSSProperties, forwardRef, useEffect, useRef, useState } from "react";
import { SelectSection } from "../types";
import { UI } from "../ui";

const SIZER_STYLES: CSSProperties = {
	position: "absolute",
	width: 0,
	height: 0,
	visibility: "hidden",
	overflow: "scroll",
	whiteSpace: "pre",
};

const STYLE_PROPS = [
	"fontSize",
	"fontFamily",
	"fontWeight",
	"fontStyle",
	"letterSpacing",
	"textTransform",
] as const;

export type InputEventHandlers = {
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onCompositionEnd: (e: React.CompositionEvent<HTMLInputElement>) => void;
	onCompositionStart: (e: React.CompositionEvent<HTMLInputElement>) => void;
};

/** The search field at the top of a select menu (make.md's `SelectMenuSearch`). */
const SelectMenuSearch = forwardRef<
	HTMLInputElement,
	{
		ui: UI;
		expanded: boolean;
		id: string;
		query: string;
		placeholderText: string;
		classNames: Record<string, string>;
		inputEventHandlers: InputEventHandlers;
		index: number;
		currentSection: SelectSection | undefined;
	}
>((props, input) => {
	const { classNames, inputEventHandlers } = props;
	const sizer = useRef<HTMLDivElement>(null);
	const inputRef = input as React.MutableRefObject<HTMLInputElement | null>;
	const [inputWidth, setInputWidth] = useState<number | null>(null);
	const [placeholderText, setPlaceholderText] = useState("");

	const copyInputStyles = () => {
		if (!inputRef.current || !sizer.current) return;
		const inputStyle = window.getComputedStyle(inputRef.current);
		sizer.current.setCssStyles(
			Object.fromEntries(STYLE_PROPS.map((prop) => [prop, inputStyle[prop]])),
		);
	};

	const updateInputWidth = () => {
		if (!sizer.current) return;
		// scrollWidth is designed to be fast not accurate; +2 does the job.
		const width = Math.ceil(sizer.current.scrollWidth) + 2;
		if (width !== inputWidth) setInputWidth(width);
	};

	useEffect(() => {
		copyInputStyles();
		updateInputWidth();
		window.setTimeout(() => inputRef.current?.focus(), 50);
	}, []);

	useEffect(() => {
		if (placeholderText !== props.placeholderText) {
			setPlaceholderText(props.placeholderText);
			updateInputWidth();
		}
	}, [props.query, props.placeholderText]);

	return (
		<div className={classNames.search}>
			<div className={classNames.searchWrapper}>
				<div
					className="mk-icon-xsmall"
					dangerouslySetInnerHTML={{ __html: props.ui.getSticker("ui//search") }}
				></div>
				<input
					{...inputEventHandlers}
					ref={input}
					value={props.query}
					placeholder={placeholderText}
					className={classNames.searchInput}
					role="combobox"
					style={{ width: "100%" }}
					onClick={(e) => e.stopPropagation()}
				/>
				<div ref={sizer} style={SIZER_STYLES}>
					{props.query || placeholderText}
				</div>
				<span></span>
			</div>
		</div>
	);
});

SelectMenuSearch.displayName = "SelectMenuSearch";
export default SelectMenuSearch;
