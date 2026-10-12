import type React from "react";
import { fieldTypes, Property } from "../../properties/fieldTypes";
import { defaultValueForType } from "../../properties/parsers";
import { HeaderApi } from "../header/api";
import i18n from "../i18n";
import { defaultMenu, menuSeparator } from "../menus/SelectMenu";
import { windowFromDocument } from "../screen";
import { Rect, SelectOption, SelectOptionType } from "../types";

/** The menu on a property's name (make.md's `showPropertiesMenu` for a note). */
export const showPropertiesMenu = (api: HeaderApi, path: string, rect: Rect, win: Window, property: Property) => {
	const changeType = (e: React.MouseEvent) => {
		api.ui.openMenu(
			(e.target as HTMLElement).getBoundingClientRect(),
			{
				multi: false,
				editable: false,
				searchable: false,
				saveOptions: (_, v) => void api.saveProperties(path, { [property.name]: defaultValueForType(v[0]) }),
				value: [],
				showAll: true,
				options: fieldTypes
					.filter((f) => f.metadata)
					.map((f, i) => ({ id: i + 1, name: f.label, value: f.type, icon: f.icon })),
			},
			windowFromDocument(e.view.document),
		);
	};
	// make.md offers to copy the value into one of the note's spaces (there are none), in a
	// menu anchored to the property name rather than to this menu.
	const syncToContext = () => {
		api.ui.openMenu(
			rect,
			{
				multi: false,
				editable: false,
				value: [],
				options: [],
				placeholder: i18n.labels.spaceSelectPlaceholder,
				detail: true,
				searchable: true,
				showAll: true,
			},
			win,
			"bottom",
		);
	};

	const menuOptions: SelectOption[] = [
		{
			name: "",
			type: SelectOptionType.Input,
			value: property.name,
			onValueChange: (value) => void api.renameProperty(path, property.name, value),
			description: "",
		},
		menuSeparator,
		{ name: i18n.menu.changePropertyType, icon: "ui//list", onClick: changeType },
	];
	if (property.type != "object") {
		menuOptions.push({ name: i18n.menu.syncToContext, icon: "ui//sync", onClick: syncToContext });
	}
	menuOptions.push({
		name: i18n.menu.deleteProperty,
		icon: "ui//trash",
		onClick: () => void api.deleteProperty(path, property.name),
	});
	api.ui.openMenu(rect, defaultMenu(menuOptions), win);
};
