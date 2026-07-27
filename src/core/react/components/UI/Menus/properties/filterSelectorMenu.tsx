import { FilterEditor, FilterEditorProps } from "core/react/components/SpaceEditor/Actions/FilterEditor";
import { SelectSection } from "shared/types/menu";
import { ISuperstate as Superstate } from "shared/types/superstate";
import { UIAdapter } from "shared/types/uiManager";
import { UIManager } from "core/middleware/ui";
import React from "react";
import { SpaceProperty } from "shared/types/mdb";
import { Metadata } from "shared/types/metadata";
import { FilterGroupDef } from "shared/types/spaceDef";

export const showFilterSelectorMenu = (
  ui: UIManager,
  rect: DOMRect,
  win: Window,
  superstate: Superstate,
  filters: FilterGroupDef[],
  fields: Metadata[],
  saveFilters: (filters: FilterGroupDef[]) => void,
  options?: {
    joinType?: "any" | "all";
    setJoinType?: (type: "any" | "all") => void;
    sections?: SelectSection[];
    linkProps?: SpaceProperty[];
  }
) => {
  const props: FilterEditorProps = {
    superstate,
    filters,
    joinType: options?.joinType,
    setJoinType: options?.setJoinType,
    saveFilters,
    fields,
    sections: options?.sections,
    linkProps: options?.linkProps,
    hide: () => {
      // This will be called when the menu needs to close
    },
  };

  return ui.openCustomMenu(
    rect,
    <FilterEditor {...props} />,
    props,
    win,
    "bottom"
  );
};