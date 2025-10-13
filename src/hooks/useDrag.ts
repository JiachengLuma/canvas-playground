/**
 * useDrag Hook
 * Manages object and handle dragging, including duplication
 */

import { useState, useRef } from "react";
import { CanvasObject } from "../types";
import { duplicateObject } from "../utils/objectFactory";

export interface DragState {
  // Object Drag
  isDraggingObject: boolean;
  startObjectDrag: (
    id: string,
    selectedIds: string[],
    objects: CanvasObject[],
    optionKey: boolean,
    setObjects: React.Dispatch<React.SetStateAction<CanvasObject[]>>,
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  ) => void;
  updateObjectDrag: (dx: number, dy: number) => void;
  endObjectDrag: () => void;

  // Handle Drag
  isDraggingHandle: boolean;
  dragHandlePos: { x: number; y: number } | null;
  startHandleDrag: (x: number, y: number) => void;
  updateHandleDrag: (x: number, y: number, zoomLevel: number) => void;
  endHandleDrag: () => void;

  // Resize
  isResizing: boolean;
  resizeCorner: string | null;
  startResize: (corner: string, mouseX: number, mouseY: number) => void;
  updateResize: (mouseX: number, mouseY: number, zoomLevel: number, panOffset: { x: number; y: number }, shiftKey?: boolean) => void;
  endResize: () => void;
}

export function useDrag(
  objects: CanvasObject[],
  selectedIds: string[],
  setObjects: React.Dispatch<React.SetStateAction<CanvasObject[]>>
): DragState {
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const [dragHandlePos, setDragHandlePos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);

  const isDuplicatingDrag = useRef(false);
  const duplicatedIds = useRef<string[]>([]);
  const currentDragIds = useRef<string[]>([]);

  const resizeStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const resizeStartDimensions = useRef<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });
  const resizeStartChildren = useRef<Map<string, { x: number; y: number; width: number; height: number }>>(new Map());

  const startObjectDrag = (
    id: string,
    currentSelectedIds: string[],
    currentObjects: CanvasObject[],
    optionKey: boolean,
    setObjectsCallback: React.Dispatch<React.SetStateAction<CanvasObject[]>>,
    setSelectedIdsCallback: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    // Determine which objects will be dragged
    const objectsToDrag = currentSelectedIds.includes(id)
      ? currentSelectedIds
      : [id];

    if (!currentSelectedIds.includes(id)) {
      setSelectedIdsCallback([id]);
    }

    // If Option key is held, duplicate the objects
    if (optionKey) {
      isDuplicatingDrag.current = true;
      const selectedObjects = currentObjects.filter((obj) =>
        objectsToDrag.includes(obj.id)
      );
      // Create duplicates at exact same position (no offset)
      const newObjects = selectedObjects.map((obj) => ({
        ...obj,
        id: `${Date.now()}-${Math.random()}`,
      }));

      // Store the new IDs for selection after drag
      duplicatedIds.current = newObjects.map((obj) => obj.id);
      currentDragIds.current = duplicatedIds.current;

      // Add duplicates to canvas
      setObjectsCallback((prev) => [...prev, ...newObjects]);

      // Select the duplicates
      setSelectedIdsCallback(duplicatedIds.current);
    } else {
      isDuplicatingDrag.current = false;
      duplicatedIds.current = [];
      currentDragIds.current = objectsToDrag;
    }

    setIsDraggingObject(true);
  };

  const updateObjectDrag = (dx: number, dy: number) => {
    // Use currentDragIds to handle immediate dragging after duplication
    const idsToMove =
      currentDragIds.current.length > 0 ? currentDragIds.current : selectedIds;

    setObjects((prev) => {
      // First, collect all IDs that should move (including children of frames)
      const allIdsToMove = new Set<string>(idsToMove);
      
      idsToMove.forEach(id => {
        const obj = prev.find(o => o.id === id);
        if (obj && obj.type === "frame") {
          const frameObj = obj as any;
          const childrenIds = frameObj.children || [];
          childrenIds.forEach((childId: string) => allIdsToMove.add(childId));
        }
      });

      // Now move all objects that should be moved
      return prev.map((obj) =>
        allIdsToMove.has(obj.id) ? { ...obj, x: obj.x + dx, y: obj.y + dy } : obj
      );
    });
  };

  const endObjectDrag = () => {
    // Check if any dragged objects should be added/removed from frames
    const idsToMove =
      currentDragIds.current.length > 0 ? currentDragIds.current : selectedIds;
    
    setObjects((prev) => {
      // First pass: update object parent relationships
      const updatedObjects = prev.map((obj) => {
        // Skip frames themselves
        if (!idsToMove.includes(obj.id) || obj.type === "frame") {
          return obj;
        }

        // Get object center position
        const objCenterX = obj.x + obj.width / 2;
        const objCenterY = obj.y + obj.height / 2;

        // Check if object is inside any frame
        const containingFrame = prev.find((f) => {
          if (f.type !== "frame" || f.id === obj.id) return false;
          
          return (
            objCenterX >= f.x &&
            objCenterX <= f.x + f.width &&
            objCenterY >= f.y &&
            objCenterY <= f.y + f.height
          );
        });

        // Update parentId based on containing frame
        if (containingFrame && obj.parentId !== containingFrame.id) {
          // Object moved into a new frame or into a frame for the first time
          return { ...obj, parentId: containingFrame.id };
        } else if (!containingFrame && obj.parentId) {
          // Object moved out of its frame
          return { ...obj, parentId: undefined };
        }

        return obj;
      });

      // Second pass: update frame children arrays
      return updatedObjects.map((obj) => {
        if (obj.type === "frame") {
          const frameObj = obj as any;
          
          // Find all objects that have this frame as parent
          const newChildren = updatedObjects
            .filter((o) => o.parentId === obj.id)
            .map((o) => o.id);

          if (JSON.stringify(newChildren) !== JSON.stringify(frameObj.children || [])) {
            return { ...obj, children: newChildren };
          }
        }
        return obj;
      });
    });

    setIsDraggingObject(false);
    isDuplicatingDrag.current = false;
    duplicatedIds.current = [];
    currentDragIds.current = [];
  };

  const startHandleDrag = (x: number, y: number) => {
    setIsDraggingHandle(true);
    setDragHandlePos({ x, y });
  };

  const updateHandleDrag = (x: number, y: number, zoomLevel: number) => {
    if (!isDraggingHandle || !dragHandlePos) return;

    const dx = (x - dragHandlePos.x) / zoomLevel;
    const dy = (y - dragHandlePos.y) / zoomLevel;

    // Rotate selected objects
    setObjects((prev) =>
      prev.map((obj) =>
        selectedIds.includes(obj.id)
          ? { ...obj, rotation: (obj.rotation || 0) + dx + dy }
          : obj
      )
    );

    setDragHandlePos({ x, y });
  };

  const endHandleDrag = () => {
    setIsDraggingHandle(false);
    setDragHandlePos(null);
  };

  // Resize Functions
  const startResize = (corner: string, mouseX: number, mouseY: number) => {
    if (selectedIds.length !== 1) return; // Only resize single selection

    const selectedObject = objects.find((obj) => obj.id === selectedIds[0]);
    if (!selectedObject) return;

    setIsResizing(true);
    setResizeCorner(corner);
    resizeStartPos.current = { x: mouseX, y: mouseY };
    resizeStartDimensions.current = {
      x: selectedObject.x,
      y: selectedObject.y,
      width: selectedObject.width,
      height: selectedObject.height,
    };
    
    // Store children's original positions if this is a frame
    resizeStartChildren.current.clear();
    if (selectedObject.type === "frame") {
      const childrenIds = (selectedObject as any).children || [];
      objects.forEach(obj => {
        if (childrenIds.includes(obj.id)) {
          resizeStartChildren.current.set(obj.id, {
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height,
          });
        }
      });
    }
  };

  const updateResize = (
    mouseX: number,
    mouseY: number,
    zoomLevel: number,
    panOffset: { x: number; y: number },
    shiftKey: boolean = false
  ) => {
    if (!isResizing || !resizeCorner || selectedIds.length !== 1) return;

    const dx = (mouseX - resizeStartPos.current.x) / zoomLevel;
    const dy = (mouseY - resizeStartPos.current.y) / zoomLevel;

    const { x: startX, y: startY, width: startWidth, height: startHeight } = resizeStartDimensions.current;

    let newX = startX;
    let newY = startY;
    let newWidth = startWidth;
    let newHeight = startHeight;

    // Calculate new dimensions based on which corner is being dragged
    switch (resizeCorner) {
      case "top-left":
        newX = startX + dx;
        newY = startY + dy;
        newWidth = startWidth - dx;
        newHeight = startHeight - dy;
        break;
      case "top-right":
        newY = startY + dy;
        newWidth = startWidth + dx;
        newHeight = startHeight - dy;
        break;
      case "bottom-left":
        newX = startX + dx;
        newWidth = startWidth - dx;
        newHeight = startHeight + dy;
        break;
      case "bottom-right":
        newWidth = startWidth + dx;
        newHeight = startHeight + dy;
        break;
    }

    // Get the object being resized to check for special constraints
    const resizingObj = objects.find(obj => obj.id === selectedIds[0]);
    const isFrame = resizingObj && resizingObj.type === "frame";
    const isAutolayoutFrame = isFrame && (resizingObj as any).autoLayout;
    const layout = isFrame ? ((resizingObj as any).layout || "hstack") : null;
    
    // Calculate minimum size based on object type
    let minSize = 50;
    let minWidth = minSize;
    let minHeight = minSize;
    
    // For autolayout grid frames, calculate minimum based on children
    if (isAutolayoutFrame && layout === "grid") {
      const frameObj = resizingObj as any;
      const padding = frameObj.padding || 10;
      const gap = frameObj.gap || 10;
      const childrenIds = frameObj.children || [];
      const children = objects.filter(obj => childrenIds.includes(obj.id));
      
      if (children.length > 0) {
        const maxChildWidth = Math.max(...children.map(c => c.width));
        const maxChildHeight = Math.max(...children.map(c => c.height));
        
        // Min width: at least 1 item + padding
        minWidth = maxChildWidth + padding * 2;
        
        // Min height: at least 1 item + padding
        minHeight = maxChildHeight + padding * 2;
      }
    }
    
    // Enforce minimum size
    if (newWidth < minWidth || newHeight < minHeight) return;

    // Calculate scale factors for children if resizing a frame
    const scaleX = newWidth / startWidth;
    const scaleY = newHeight / startHeight;
    const offsetX = newX - startX;
    const offsetY = newY - startY;

    // Update the object and its children
    setObjects((prev) => {
      const resizingObj = prev.find(obj => obj.id === selectedIds[0]);
      const isFrame = resizingObj && resizingObj.type === "frame";
      const isAutolayoutFrame = isFrame && (resizingObj as any).autoLayout;
      const childrenIds = isFrame ? ((resizingObj as any).children || []) : [];
      const layout = isFrame ? ((resizingObj as any).layout || "hstack") : null;

      // For autolayout grid frames, recalculate height based on content reflow
      let finalHeight = newHeight;
      if (isAutolayoutFrame && layout === "grid" && !shiftKey) {
        const frameObj = resizingObj as any;
        const padding = frameObj.padding || 10;
        const gap = frameObj.gap || 10;
        const children = prev.filter(obj => childrenIds.includes(obj.id));
        
        if (children.length > 0) {
          const maxChildWidth = Math.max(...children.map(c => c.width));
          const maxChildHeight = Math.max(...children.map(c => c.height));
          
          // Calculate how many items fit per row based on new width
          const borderWidth = 2;
          const availableWidth = newWidth - padding * 2 - borderWidth;
          const itemWidthWithGap = maxChildWidth + gap;
          const itemsPerRow = Math.max(1, Math.floor((availableWidth + gap) / itemWidthWithGap));
          
          // Calculate number of rows needed
          const numRows = Math.ceil(children.length / itemsPerRow);
          
          // Calculate actual height needed
          finalHeight = maxChildHeight * numRows + gap * (numRows - 1) + padding * 2 + borderWidth;
        }
      }

      return prev.map((obj) => {
        if (obj.id === selectedIds[0]) {
          // Update the frame itself
          return { ...obj, x: newX, y: newY, width: newWidth, height: finalHeight };
        } else if (isFrame && childrenIds.includes(obj.id) && shiftKey) {
          // Only scale children when Shift is pressed (works for both autolayout and non-autolayout frames)
          // Use stored original positions to avoid cumulative errors
          const originalChild = resizeStartChildren.current.get(obj.id);
          if (originalChild) {
            const relativeX = originalChild.x - startX;
            const relativeY = originalChild.y - startY;
            return {
              ...obj,
              x: newX + relativeX * scaleX,
              y: newY + relativeY * scaleY,
              width: originalChild.width * scaleX,
              height: originalChild.height * scaleY,
            };
          }
        }
        return obj;
      });
    });
  };

  const endResize = () => {
    setIsResizing(false);
    setResizeCorner(null);
  };

  return {
    isDraggingObject,
    startObjectDrag,
    updateObjectDrag,
    endObjectDrag,
    isDraggingHandle,
    dragHandlePos,
    startHandleDrag,
    updateHandleDrag,
    endHandleDrag,
    isResizing,
    resizeCorner,
    startResize,
    updateResize,
    endResize,
  };
}

