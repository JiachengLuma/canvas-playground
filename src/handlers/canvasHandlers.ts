/**
 * Canvas and Selection Handlers
 * Handlers for canvas interactions and selection management
 */

import { CanvasObject } from "../types";
import { screenToCanvas } from "../utils/canvasUtils";

export interface CanvasHandlersParams {
  objects: CanvasObject[];
  // Selection state & methods
  selectedIds: string[];
  isSelecting: boolean;
  isDraggingObject: boolean;
  isResizing: boolean;
  selectionJustCompleted: () => boolean;
  deselectAll: () => void;
  selectObject: (id: string, multi: boolean) => void;
  // Toolbar methods
  setActiveToolbarId: (id: string | null) => void;
  setToolbarSystemActivated: (activated: boolean) => void;
  // Zoom methods
  zoomLevel: number;
  panOffset: { x: number; y: number };
  setZoomLevel: (level: number) => void;
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  updateCursorPosition?: (pos: {
    screen: { x: number; y: number };
    canvas: { x: number; y: number };
  }) => void;
}

export const createCanvasHandlers = (params: CanvasHandlersParams) => {
  const {
    objects,
    selectedIds,
    isSelecting,
    isDraggingObject,
    isResizing,
    selectionJustCompleted,
    deselectAll,
    selectObject,
    setActiveToolbarId,
    setToolbarSystemActivated,
    zoomLevel,
    panOffset,
    setZoomLevel,
    setPanOffset,
    canvasRef,
    updateCursorPosition,
  } = params;

  const handleSelect = (id: string, multi: boolean) => {
    selectObject(id, multi);

    if (!multi) {
      // Single select: show toolbar
      setActiveToolbarId(id);
    } else {
      // Multi select: hide individual toolbar
      setActiveToolbarId(null);
    }

    setToolbarSystemActivated(true);
  };

  const handleCanvasClick = () => {
    // Don't deselect if we just completed a box selection
    if (
      !isSelecting &&
      !isDraggingObject &&
      !isResizing &&
      !selectionJustCompleted()
    ) {
      deselectAll();
      setActiveToolbarId(null);
    }
  };

  const handleCanvasContextMenu = (
    e: React.MouseEvent,
    openContextMenu: (
      x: number,
      y: number,
      canvasPosition: { x: number; y: number }
    ) => void
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Only show context menu if clicking on empty canvas (not on an object)
    const target = e.target as HTMLElement;
    if (target.closest("[data-canvas-object]")) {
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    const localX = rect ? e.clientX - rect.left : e.clientX;
    const localY = rect ? e.clientY - rect.top : e.clientY;

    const canvasPosition = screenToCanvas(localX, localY, zoomLevel, panOffset);

    openContextMenu(e.clientX, e.clientY, canvasPosition);

    updateCursorPosition?.({
      screen: { x: e.clientX, y: e.clientY },
      canvas: canvasPosition,
    });
  };

  // Zoom artifact so it's double the width of the toolbar
  // Toolbar is roughly 350px wide when fully expanded
  const handleZoomToFitToolbar = (objectId: string) => {
    const obj = objects.find((o) => o.id === objectId);
    if (!obj) return;

    const toolbarWidth = 350; // Approximate full toolbar width
    const targetObjectWidth = toolbarWidth * 2; // Make object 2x toolbar width
    const newZoomLevel = targetObjectWidth / obj.width;

    // Clamp zoom between 0.1 and 3
    const clampedZoom = Math.max(0.1, Math.min(4, newZoomLevel));

    setZoomLevel(clampedZoom);

    // Center the object in viewport
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const viewportCenterX = rect.width / 2;
    const viewportCenterY = rect.height / 2;

    const objectCenterX = (obj.x + obj.width / 2) * clampedZoom;
    const objectCenterY = (obj.y + obj.height / 2) * clampedZoom;

    const newPanX = viewportCenterX - objectCenterX;
    const newPanY = viewportCenterY - objectCenterY;

    setPanOffset({ x: newPanX, y: newPanY });
  };

  return {
    handleSelect,
    handleCanvasClick,
    handleCanvasContextMenu,
    handleZoomToFitToolbar,
  };
};

