/**
 * useSelection Hook
 * Manages object selection (single, multi, box selection)
 */

import { useState, useRef } from "react";
import { CanvasObject } from "../types";
import { getSelectionBounds, getObjectsInBox, Bounds } from "../utils/canvasUtils";

export interface SelectionState {
  // Selection
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectObject: (id: string, multi: boolean) => void;
  deselectAll: () => void;
  isMultiSelect: boolean;
  selectionBounds: Bounds;

  // Box Selection
  isSelecting: boolean;
  selectionStart: { x: number; y: number };
  selectionCurrent: { x: number; y: number };
  hoveredBySelectionIds: string[];
  selectionJustCompleted: () => boolean;
  startBoxSelection: (x: number, y: number) => void;
  updateBoxSelection: (x: number, y: number, objects: CanvasObject[]) => void;
  endBoxSelection: (objects: CanvasObject[]) => string[];
  cancelBoxSelection: () => void;
}

export function useSelection(objects: CanvasObject[]): SelectionState {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionCurrent, setSelectionCurrent] = useState({ x: 0, y: 0 });
  const [hoveredBySelectionIds, setHoveredBySelectionIds] = useState<string[]>([]);
  
  const selectionCompleted = useRef(false);
  const hasMovedMouse = useRef(false);

  const isMultiSelect = selectedIds.length > 1;
  const selectionBounds = getSelectionBounds(objects, selectedIds);

  const selectObject = (id: string, multi: boolean) => {
    if (multi) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const startBoxSelection = (x: number, y: number) => {
    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionCurrent({ x, y });
    selectionCompleted.current = false;
    hasMovedMouse.current = false;
  };

  const updateBoxSelection = (x: number, y: number, objectList: CanvasObject[]) => {
    if (!isSelecting) return;

    setSelectionCurrent({ x, y });
    hasMovedMouse.current = true;

    // Find objects in the selection box
    const objectsInBox = getObjectsInBox(objectList, {
      startX: selectionStart.x,
      startY: selectionStart.y,
      endX: x,
      endY: y,
    });

    setHoveredBySelectionIds(objectsInBox.map((obj) => obj.id));
  };

  const endBoxSelection = (objectList: CanvasObject[]): string[] => {
    if (!isSelecting) return selectedIds;

    let newSelectedIds = selectedIds;

    if (hasMovedMouse.current) {
      const selectedObjects = getObjectsInBox(objectList, {
        startX: selectionStart.x,
        startY: selectionStart.y,
        endX: selectionCurrent.x,
        endY: selectionCurrent.y,
      });

      if (selectedObjects.length > 0) {
        newSelectedIds = selectedObjects.map((obj) => obj.id);
        setSelectedIds(newSelectedIds);
        selectionCompleted.current = true;
      }
    }

    setIsSelecting(false);
    setHoveredBySelectionIds([]);

    return newSelectedIds;
  };

  const cancelBoxSelection = () => {
    setIsSelecting(false);
    setHoveredBySelectionIds([]);
    selectionCompleted.current = false;
    hasMovedMouse.current = false;
  };

  const selectionJustCompleted = () => {
    const wasCompleted = selectionCompleted.current;
    if (wasCompleted) {
      selectionCompleted.current = false;
    }
    return wasCompleted;
  };

  return {
    selectedIds,
    setSelectedIds,
    selectObject,
    deselectAll,
    isMultiSelect,
    selectionBounds,
    isSelecting,
    selectionStart,
    selectionCurrent,
    hoveredBySelectionIds,
    selectionJustCompleted,
    startBoxSelection,
    updateBoxSelection,
    endBoxSelection,
    cancelBoxSelection,
  };
}

