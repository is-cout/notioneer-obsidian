import { useDndMonitor, useDraggable } from "@dnd-kit/core";
import { PathContext } from "core/react/context/PathContext";
import { WindowContext } from "core/react/context/WindowContext";
import { nameForField } from "core/utils/frames/frames";
import React, { useContext } from "react";
import { stickerForField } from "schemas/mdb";
import { SpaceProperty } from "shared/types/mdb";
import { ISuperstate as Superstate } from "shared/types/superstate";

/* Notioneer: lifted out of ContextListEditSelector. This chip is the property key shown in
   the note header; importing it from the context-list editor pulled the context builder, the
   frame editor, the table view and the charts into the bundle with it. */
export const PropertyField = (props: {
  superstate: Superstate;
  property: SpaceProperty;
  path: string;
  contexts?: string[];
  onClick?: (e: React.MouseEvent) => void;
  draggable?: boolean;
}) => {
  const { uid } = useContext(PathContext);
  const primaryContext = props.contexts?.[0];
  const id = `${uid}_props_${primaryContext ?? ""}${props.property.name}`;
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
  } = useDraggable({
    id: id,
    data: {
      id: id,
      name: props.property.name,
      property: props.property,
      context: primaryContext ?? "",
      path: props.path,
      type: "property",
    },
    // disabled: !props.draggable,
  });
  const { setDragNode } = useContext(WindowContext);
  useDndMonitor({
    onDragStart: (e) => {
      if (e.active.data.current.id == id)
        setDragNode(
          <div
            className="mk-path-context-field"
            onClick={(e) => (props.onClick ? props.onClick(e) : null)}
          >
            <div
              className="mk-path-context-field-icon"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker(
                  stickerForField(props.property)
                ),
              }}
            ></div>
            <div className="mk-path-context-field-key">
              {nameForField(props.property)}
            </div>
          </div>
        );
    },
  });
  return (
    <div
      ref={setDraggableNodeRef}
      className="mk-path-context-field"
      onClick={(e) => (props.onClick ? props.onClick(e) : null)}
      {...attributes}
      {...listeners}
    >
      <div
        className="mk-path-context-field-icon"
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker(
            stickerForField(props.property)
          ),
        }}
      ></div>
      <div className="mk-path-context-field-key">
        {nameForField(props.property)}
      </div>
    </div>
  );
};
