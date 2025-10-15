/**
 * Objects Layer Component
 * Renders all canvas objects with proper sorting (frames first, then children)
 */

import { CanvasObject as CanvasObjectType } from "../../types";
import { CanvasObject } from "../CanvasObject";

interface ObjectsLayerProps {
  objects: CanvasObjectType[];
  selectedIds: string[];
  isMultiSelect: boolean;
  hoveredBySelectionIds: string[];
  isSelecting: boolean;
  isDraggingObject: boolean;
  isResizing: boolean;
  zoomLevel: number;
  activeToolbarId: string | null;
  toolbarSystemActivated: boolean;
  selectionColor: string;
  hoverColor: string;
  onSetActiveToolbar: (id: string | null) => void;
  onActivateToolbarSystem: () => void;
  onObjectHoverEnter: () => void;
  onObjectHoverLeave: () => void;
  onSelect: (id: string, multi: boolean) => void;
  onResizeStart: (corner: string, e: React.MouseEvent) => void;
  onDragStart: (id: string, optionKey: boolean) => void;
  onDrag: (dx: number, dy: number) => void;
  onDragEnd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRotate: (id: string) => void;
  onColorTagChange: (id: string) => void;
  onContentUpdate: (id: string, content: string) => void;
}

export function ObjectsLayer({
  objects,
  selectedIds,
  isMultiSelect,
  hoveredBySelectionIds,
  isSelecting,
  isDraggingObject,
  isResizing,
  zoomLevel,
  activeToolbarId,
  toolbarSystemActivated,
  selectionColor,
  hoverColor,
  onSetActiveToolbar,
  onActivateToolbarSystem,
  onObjectHoverEnter,
  onObjectHoverLeave,
  onSelect,
  onResizeStart,
  onDragStart,
  onDrag,
  onDragEnd,
  onDelete,
  onDuplicate,
  onRotate,
  onColorTagChange,
  onContentUpdate,
}: ObjectsLayerProps) {
  // Filter out children of frames with autolayout enabled - they'll be rendered inside their parent
  const topLevelObjects = objects.filter((obj) => {
    if (!obj.parentId) return true;
    const parent = objects.find((o) => o.id === obj.parentId);
    if (parent && parent.type === "frame") {
      const frameParent = parent as any;
      // Only filter out if parent has autolayout enabled
      const shouldFilter = !frameParent.autoLayout;
      return shouldFilter;
    }
    return true;
  });

  // Sort objects: frames first, then non-frames, then frame children
  const sortedObjects = [...topLevelObjects].sort((a, b) => {
    // Frames should render first (lower z-index)
    if (a.type === "frame" && b.type !== "frame") return -1;
    if (a.type !== "frame" && b.type === "frame") return 1;
    // Children of frames should render after their parent frame
    if (a.parentId && !b.parentId) return 1;
    if (!a.parentId && b.parentId) return -1;
    return 0;
  });

  return (
    <>
      {sortedObjects.map((obj) => (
        <CanvasObject
          key={obj.id}
          object={obj}
          objects={objects}
          isSelected={selectedIds.includes(obj.id)}
          isPartOfMultiSelect={isMultiSelect && selectedIds.includes(obj.id)}
          isHoveredBySelection={hoveredBySelectionIds.includes(obj.id)}
          isSelecting={isSelecting}
          isDraggingAny={isDraggingObject || isResizing}
          hasSelection={selectedIds.length > 0}
          zoomLevel={zoomLevel}
          isActiveToolbar={activeToolbarId === obj.id}
          toolbarSystemActivated={toolbarSystemActivated}
          isResizing={isResizing}
          selectedIds={selectedIds}
          hoveredBySelectionIds={hoveredBySelectionIds}
          activeToolbarId={activeToolbarId}
          isMultiSelect={isMultiSelect}
          selectionColor={selectionColor}
          hoverColor={hoverColor}
          onSetActiveToolbar={onSetActiveToolbar}
          onActivateToolbarSystem={onActivateToolbarSystem}
          onObjectHoverEnter={onObjectHoverEnter}
          onObjectHoverLeave={onObjectHoverLeave}
          onSelect={onSelect}
          onResizeStart={onResizeStart}
          onDragStart={onDragStart}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onRotate={onRotate}
          onColorTagChange={onColorTagChange}
          onContentUpdate={onContentUpdate}
        />
      ))}
    </>
  );
}
