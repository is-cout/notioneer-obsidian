import type React from "react";

export type Pos = { x: number; y: number };
export type Size = { width: number; height: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type Anchors = "top" | "bottom" | "left" | "right" | "center";

export type PointerModifiers = {
	metaKey?: boolean;
	ctrlKey?: boolean;
	altKey?: boolean;
	shiftKey?: boolean;
	doubleClick?: boolean;
};

export type MenuObject = {
	hide: (suppress?: boolean) => void;
	update: (props: Record<string, unknown>) => void;
};

export type OpenSubmenu = (offset: Rect, onHide: () => void) => MenuObject;

export enum SelectOptionType {
	Section = -2,
	Separator = -1,
	Option = 0,
	Disclosure = 1,
	Input = 2,
	Radio = 3,
	Toggle = 4,
	Custom = 5,
	Submenu = 6,
}

export type SelectSection = {
	name: string;
	value: string;
};

/** One row of a select menu. Overloaded like make.md's: plain options, section labels,
    separators, inline inputs, custom fragments and submenus all go through this type. */
export type SelectOption = {
	id?: number;
	name: string;
	fragment?: React.FC<{ hide: () => void; onSubmenu?: (openSubmenu: OpenSubmenu) => void }>;
	value?: string;
	color?: string;
	section?: string;
	description?: string;
	icon?: string;
	removeable?: boolean;
	disabled?: boolean;
	type?: SelectOptionType;
	onToggle?: () => void;
	onClick?: (ev: React.MouseEvent) => void;
	onSubmenu?: OpenSubmenu;
	onValueChange?: (value: string) => void;
	onMoreOptions?: (e: React.MouseEvent) => void;
	onRemove?: () => void;
};

export type SelectMenuProps = {
	multi?: boolean;
	value: string[];
	editable: boolean;
	options: SelectOption[];
	addKeyword?: string;
	defaultOptions?: SelectOption[];
	saveOptions?: (options: string[], value: string[], isNew?: boolean, section?: string) => void;
	removeOption?: (option: string) => void;
	placeholder?: string;
	detail?: boolean;
	searchable?: boolean;
	sections?: SelectSection[];
	showAll?: boolean;
	showSections?: boolean;
	previewComponent?: React.ReactNode;
	onHover?: (option: unknown) => void;
	onHide?: () => void;
	isDisclosure?: boolean;
	wrapperClass?: string;
	onSelectSection?: (section: string) => void;
};
