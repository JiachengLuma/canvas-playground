/**
 * Mouse Event Handlers
 * Handlers for canvas mouse events: mouse down, move, up
 */

import { CanvasObject } from "../types";
import { screenToCanvas } from "../utils/canvasUtils";
import { createFrame } from "../utils/objectFactory";

export interface MouseHandlersParams {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  objects: CanvasObject[];
  setObjects: React.Dispatch<React.SetStateAction<CanvasObject[]>>;
  // Pan state & methods
  isPanning: boolean;
  startPan: (x: number, y: number) => void;
  updatePan: (
    x: number,
    y: number,
    setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  ) => void;
  endPan: () => void;
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  // Drag state & methods
  isDraggingObject: boolean;
  isResizing: boolean;
  isDraggingHandle: boolean;
  updateResize: (
    clientX: number,
    clientY: number,
    zoomLevel: number,
    panOffset: { x: number; y: number },
    shiftKey: boolean
  ) => void;
  endResize: () => void;
  endObjectDrag: () => void;
  startHandleDrag: (clientX: number, clientY: number) => void;
  // Selection state & methods
  isSelecting: boolean;
  startBoxSelection: (x: number, y: number) => void;
  updateBoxSelection: (x: number, y: number, objects: CanvasObject[]) => void;
  endBoxSelection: (objects: CanvasObject[]) => string[];
  // Frame drawing state
  isDrawingFrame: boolean;
  frameDrawStart: { x: number; y: number };
  frameDrawCurrent: { x: number; y: number };
  setFrameDrawStart: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setFrameDrawCurrent: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setIsDrawingFrame: React.Dispatch<React.SetStateAction<boolean>>;
  // Selection & toolbar
  deselectAll: () => void;
  selectObject: (id: string, multi: boolean) => void;
  setActiveToolbarId: (id: string | null) => void;
  selectedIds: string[];
}

export const createMouseHandlers = (params: MouseHandlersParams) => {
  const {
    canvasRef,
    zoomLevel,
    panOffset,
    objects,
    setObjects,
    isPanning,
    startPan,
    updatePan,
    endPan,
    setPanOffset,
    isDraggingObject,
    isResizing,
    isDraggingHandle,
    updateResize,
    endResize,
    endObjectDrag,
    startHandleDrag,
    isSelecting,
    startBoxSelection,
    updateBoxSelection,
    endBoxSelection,
    isDrawingFrame,
    frameDrawStart,
    frameDrawCurrent,
    setFrameDrawStart,
    setFrameDrawCurrent,
    setIsDrawingFrame,
    deselectAll,
    selectObject,
    setActiveToolbarId,
    selectedIds,
  } = params;

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Panning
      e.preventDefault();
      startPan(e.clientX, e.clientY);
    } else if (e.button === 0 && !isDraggingObject && !isResizing) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const { x: canvasX, y: canvasY } = screenToCanvas(
        e.clientX - rect.left,
        e.clientY - rect.top,
        zoomLevel,
        panOffset
      );

      if (isDrawingFrame) {
        // Frame drawing mode
        setFrameDrawStart({ x: canvasX, y: canvasY });
        setFrameDrawCurrent({ x: canvasX, y: canvasY });
      } else {
        // Box selection
        startBoxSelection(canvasX, canvasY);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      updatePan(e.clientX, e.clientY, setPanOffset);
    } else if (isResizing) {
      updateResize(
        e.clientX,
        e.clientY,
        zoomLevel,
        panOffset,
        e.shiftKey // Pass shift key state for scale mode
      );
    } else if (
      isDrawingFrame &&
      frameDrawStart.x !== 0 &&
      frameDrawStart.y !== 0
    ) {
      // Update frame drawing
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const { x: canvasX, y: canvasY } = screenToCanvas(
        e.clientX - rect.left,
        e.clientY - rect.top,
        zoomLevel,
        panOffset
      );

      setFrameDrawCurrent({ x: canvasX, y: canvasY });
    } else if (isSelecting) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const { x: canvasX, y: canvasY } = screenToCanvas(
        e.clientX - rect.left,
        e.clientY - rect.top,
        zoomLevel,
        panOffset
      );

      updateBoxSelection(canvasX, canvasY, objects);
    }
  };

  const handleCanvasMouseUp = () => {
    if (isPanning) {
      endPan();
    } else if (isResizing) {
      endResize();
    } else if (
      isDrawingFrame &&
      frameDrawStart.x !== 0 &&
      frameDrawStart.y !== 0
    ) {
      // Create frame from drawn bounds
      const minX = Math.min(frameDrawStart.x, frameDrawCurrent.x);
      const minY = Math.min(frameDrawStart.y, frameDrawCurrent.y);
      const maxX = Math.max(frameDrawStart.x, frameDrawCurrent.x);
      const maxY = Math.max(frameDrawStart.y, frameDrawCurrent.y);
      const width = maxX - minX;
      const height = maxY - minY;

      // Only create frame if it has meaningful dimensions
      if (width > 10 && height > 10) {
        // Find objects that are within the frame bounds
        const objectsInFrame = objects.filter((obj) => {
          // Skip frames themselves to avoid nested frames for now
          if (obj.type === "frame") return false;

          // Check if object's center is within frame bounds
          const objCenterX = obj.x + obj.width / 2;
          const objCenterY = obj.y + obj.height / 2;

          return (
            objCenterX >= minX &&
            objCenterX <= maxX &&
            objCenterY >= minY &&
            objCenterY <= maxY
          );
        });

        const childrenIds = objectsInFrame.map((obj) => obj.id);
        const newFrame = createFrame(minX, minY, width, height, childrenIds);

        // Update objects to have parentId
        const updatedObjects = objects.map((obj) => {
          if (childrenIds.includes(obj.id)) {
            return { ...obj, parentId: newFrame.id };
          }
          return obj;
        });

        setObjects([...updatedObjects, newFrame]);

        // Select the new frame
        deselectAll();
        selectObject(newFrame.id, false);
        setActiveToolbarId(newFrame.id);
      }

      // Reset frame drawing
      setFrameDrawStart({ x: 0, y: 0 });
      setFrameDrawCurrent({ x: 0, y: 0 });
      setIsDrawingFrame(false); // Exit frame drawing mode after creating
    } else if (isSelecting) {
      const newSelectedIds = endBoxSelection(objects);

      if (newSelectedIds.length > 0) {
        setActiveToolbarId(null);
      }
    }

    endObjectDrag();
  };

  const handleDragHandleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    startHandleDrag(e.clientX, e.clientY);
  };

  return {
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleDragHandleStart,
  };
};

