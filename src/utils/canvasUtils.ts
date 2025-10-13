/**
 * Canvas Utility Functions
 * Pure functions for canvas calculations and transformations
 */

import { CanvasObject } from "../types";

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Box {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/**
 * Get bounding box for a set of selected objects
 */
export function getSelectionBounds(
  objects: CanvasObject[],
  selectedIds: string[]
): Bounds {
  const selectedObjects = objects.filter((obj) => selectedIds.includes(obj.id));

  if (selectedObjects.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  selectedObjects.forEach((obj) => {
    minX = Math.min(minX, obj.x);
    minY = Math.min(minY, obj.y);
    maxX = Math.max(maxX, obj.x + obj.width);
    maxY = Math.max(maxY, obj.y + obj.height);
  });

  return { minX, minY, maxX, maxY };
}

/**
 * Check if a point is inside an object
 */
export function isPointInObject(
  x: number,
  y: number,
  object: CanvasObject
): boolean {
  return (
    x >= object.x &&
    x <= object.x + object.width &&
    y >= object.y &&
    y <= object.y + object.height
  );
}

/**
 * Get all objects that intersect with a selection box
 */
export function getObjectsInBox(
  objects: CanvasObject[],
  box: Box
): CanvasObject[] {
  const { startX, startY, endX, endY } = box;
  const boxMinX = Math.min(startX, endX);
  const boxMaxX = Math.max(startX, endX);
  const boxMinY = Math.min(startY, endY);
  const boxMaxY = Math.max(startY, endY);

  return objects.filter((obj) => {
    const objMinX = obj.x;
    const objMaxX = obj.x + obj.width;
    const objMinY = obj.y;
    const objMaxY = obj.y + obj.height;

    // Check if rectangles overlap
    return !(
      objMaxX < boxMinX ||
      objMinX > boxMaxX ||
      objMaxY < boxMinY ||
      objMinY > boxMaxY
    );
  });
}

/**
 * Calculate toolbar gap based on zoom level
 * Returns the gap (in pixels) between object and toolbar
 */
export function getToolbarGap(zoomLevel: number): number {
  // 8px at normal/high zoom, scales down to 4px minimum when zoomed out
  return 4 + 4 * Math.min(1, zoomLevel);
}

/**
 * Convert canvas coordinates to screen coordinates
 */
export function canvasToScreen(
  x: number,
  y: number,
  zoomLevel: number,
  panOffset: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: x * zoomLevel + panOffset.x,
    y: y * zoomLevel + panOffset.y,
  };
}

/**
 * Convert screen coordinates to canvas coordinates
 */
export function screenToCanvas(
  x: number,
  y: number,
  zoomLevel: number,
  panOffset: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: (x - panOffset.x) / zoomLevel,
    y: (y - panOffset.y) / zoomLevel,
  };
}

/**
 * Get the center point of an object
 */
export function getObjectCenter(object: CanvasObject): { x: number; y: number } {
  return {
    x: object.x + object.width / 2,
    y: object.y + object.height / 2,
  };
}

/**
 * Get the center point of multiple objects
 */
export function getMultiObjectCenter(
  objects: CanvasObject[],
  selectedIds: string[]
): { x: number; y: number } {
  const bounds = getSelectionBounds(objects, selectedIds);
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate distance between two points
 */
export function distance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

