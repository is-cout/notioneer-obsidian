/* Notioneer: lifted out of core/react/components/SpaceView/Contexts/TableView/TableView.
   Twenty-five modules imported this enum from the table view, which dragged the whole
   table (and @tanstack/react-table) into the bundle for a list of six constants. */
export enum CellEditMode {
	EditModeReadOnly,
	EditModeNone, //No Edit for Most Types except bool
	EditModeView, //View mode, toggleable to edit mode
	EditModeValueOnly, //Can Only Edit Value
	EditModeActive, //Active Edit mode, toggelable to view mode
	EditModeAlways, //Always Edit
}

import { SpaceProperty } from "shared/types/mdb";
import { ISuperstate as Superstate } from "shared/types/superstate";

export type TableCellProp = {
	initialValue: string;
	property: SpaceProperty;
	compactMode: boolean;
	saveValue: (value: string) => void;
	editMode?: CellEditMode;
	setEditMode?: (editMode: [string, string]) => void;
	superstate: Superstate;
	propertyValue?: string;
	path?: string;
};

export type TableCellMultiProp = TableCellProp & {
	multi: boolean;
};
