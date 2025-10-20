/**
 * useCanvasState Hook
 * Manages canvas objects, zoom, and pan state
 */

import { useState } from "react";
import { CanvasObject } from "../types";
import { DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from "../config/constants";
import { clamp } from "../utils/canvasUtils";

export interface CanvasState {
  // Objects
  objects: CanvasObject[];
  setObjects: React.Dispatch<React.SetStateAction<CanvasObject[]>>;
  addObject: (object: CanvasObject) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  deleteObject: (id: string) => void;
  deleteObjects: (ids: string[]) => void;

  // Zoom
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;

  // Pan
  panOffset: { x: number; y: number };
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

export function useCanvasState(initialObjects: CanvasObject[] = []): CanvasState {
  const [objects, setObjects] = useState<CanvasObject[]>(initialObjects);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const addObject = (object: CanvasObject) => {
    setObjects((prev) => {
      // Find the current max z-index
      const maxZIndex = Math.max(0, ...prev.map(obj => obj.zIndex ?? 0));
      // Assign a higher z-index to the new object
      const newObject = { ...object, zIndex: maxZIndex + 1 };
      return [...prev, newObject];
    });
  };

  const updateObject = (id: string, updates: Partial<CanvasObject>) => {
    setObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj))
    );
  };

  const deleteObject = (id: string) => {
    setObjects((prev) => {
      const obj = prev.find((o) => o.id === id);
      
      // If deleting a frame, collect its children IDs
      let idsToDelete = [id];
      if (obj && obj.type === "frame") {
        const frameObj = obj as any;
        const childrenIds = frameObj.children || [];
        idsToDelete = [...idsToDelete, ...childrenIds];
      }
      
      return prev.filter((o) => !idsToDelete.includes(o.id));
    });
  };

  const deleteObjects = (ids: string[]) => {
    setObjects((prev) => {
      // Collect all IDs to delete, including children of frames
      const allIdsToDelete = new Set(ids);
      
      ids.forEach((id) => {
        const obj = prev.find((o) => o.id === id);
        if (obj && obj.type === "frame") {
          const frameObj = obj as any;
          const childrenIds = frameObj.children || [];
          childrenIds.forEach((childId: string) => allIdsToDelete.add(childId));
        }
      });
      
      return prev.filter((obj) => !allIdsToDelete.has(obj.id));
    });
  };

  const zoomIn = () => {
    setZoomLevel((prev) => clamp(prev + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => clamp(prev - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
  };

  const resetZoom = () => {
    setZoomLevel(DEFAULT_ZOOM);
    setPanOffset({ x: 0, y: 0 });
  };

  return {
    objects,
    setObjects,
    addObject,
    updateObject,
    deleteObject,
    deleteObjects,
    zoomLevel,
    setZoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    panOffset,
    setPanOffset,
  };
}

