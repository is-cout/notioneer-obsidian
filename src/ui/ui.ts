import type React from "react";
import type { InputManager } from "./inputManager";
import type { Anchors, MenuObject, OpenSubmenu, Rect, SelectMenuProps } from "./types";

/** What make.md's `UIManager` gave its components, cut down to what the header uses. */
export interface UI {
	inputManager: InputManager;
	getSticker: (icon: string | undefined) => string;
	openMenu: (
		rect: Rect,
		menuProps: SelectMenuProps,
		win: Window,
		anchor?: Anchors,
		onHide?: () => void,
		force?: boolean,
	) => MenuObject;
	openCustomMenu: (
		rect: Rect,
		fc: React.ReactElement,
		props: Record<string, unknown>,
		win: Window,
		anchor?: Anchors,
		onHide?: () => void,
		className?: string,
		onSubmenu?: (openSubmenu: OpenSubmenu) => MenuObject,
	) => MenuObject;
	openPalette: (fc: React.ReactElement, win: Window, className?: string) => MenuObject;
	openModal: (title: string, fc: React.ReactElement, win: Window, className?: string) => MenuObject;
	notify: (message: string) => void;
}
