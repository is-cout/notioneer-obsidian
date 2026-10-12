import { Property } from "../../properties/fieldTypes";
import { HeaderApi } from "../header/api";

/** make.md's edit modes; the header's rows are always `EditModeAlways` (or `EditModeView`
    when read-only). The order matters: cells compare them with `>`/`>=`. */
export enum CellEditMode {
	EditModeReadOnly,
	EditModeNone,
	EditModeView,
	EditModeValueOnly,
	EditModeActive,
	EditModeAlways,
}

export type TableCellProp = {
	api: HeaderApi;
	initialValue: string;
	property: Property;
	compactMode: boolean;
	saveValue: (value: string) => void;
	editMode: CellEditMode;
	setEditMode: (editMode: [string, string] | null) => void;
	/** The note the row belongs to. */
	path: string;
};

export type TableCellMultiProp = TableCellProp & { multi: boolean };

/** make.md's default colour palette, offered for option colours. */
export const optionColors = (labels: Record<string, string>): [string, string][] =>
	(
		[
			"red",
			"pink",
			"orange",
			"yellow",
			"green",
			"turquoise",
			"teal",
			"blue",
			"purple",
			"brown",
			"charcoal",
			"gray",
		] as const
	).map((c) => [labels[c], `var(--mk-color-${c})`]);
