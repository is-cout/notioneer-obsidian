import { Notice } from "obsidian";
import { InputManager } from "./inputManager";
import { showMenu } from "./menus/menu";
import { showSelectMenu } from "./menus/SelectMenu";
import { showModal } from "./modals/modal";
import { getSticker } from "./sticker";
import { UI } from "./ui";

export const createUI = (): UI => {
	const inputManager = new InputManager();
	const ui: UI = {
		inputManager,
		getSticker,
		openMenu: (rect, menuProps, win, anchor = "right", onHide, force) =>
			showSelectMenu(ui, rect, menuProps, win, anchor, onHide, force),
		openCustomMenu: (rect, fc, props, win, anchor = "right", onHide, className) =>
			showMenu({ rect, anchor, win, ui, fc, props, onHide, className }),
		openPalette: (fc, win, className) => showModal({ ui, fc, isPalette: true, className, win }),
		openModal: (title, fc, win, className) => showModal({ ui, fc, title, className, win }),
		notify: (message) => {
			new Notice(message);
		},
	};
	return ui;
};
