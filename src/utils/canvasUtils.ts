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
 * Calculate toolbar gap based on zoom level and object size
 * Returns the gap (in canvas pixels) between object and toolbar
 * Gets much closer (2px) at small zoom levels for better visual proximity
 */
export function getToolbarGap(zoomLevel: number): number {
  // At high zoom (1.0+): 10px gap (was 8px, added 2px)
  // At low zoom (0.3): 4px gap (was 2px, added 2px)
  // Interpolate between them for smooth transition
  const minGap = 4;
  const maxGap = 10;
  const gapInScreenSpace = minGap + (maxGap - minGap) * Math.min(1, zoomLevel);
  return gapInScreenSpace / zoomLevel;
}

/**
 * Calculate adaptive toolbar gap based on object screen size
 * Returns the gap (in canvas pixels) between metadata header and toolbar
 * Larger objects: smaller gap (toolbar closer)
 * Smaller objects: larger gap (toolbar moves up to give heading room)
 */
export function getAdaptiveToolbarGap(
  objectHeight: number,
  objectWidth: number,
  zoomLevel: number
): number {
  // Calculate screen dimensions
  const screenHeight = objectHeight * zoomLevel;
  const screenWidth = objectWidth * zoomLevel;
  const smallerDimension = Math.min(screenHeight, screenWidth);

  // Define thresholds (in screen pixels)
  const veryLargeThreshold = 400; // Very large objects
  const largeThreshold = 250; // Large objects
  const mediumThreshold = 150; // Medium objects
  const smallThreshold = 80; // Small objects
  
  // Define gaps (in screen pixels) - more dramatic differences
  const veryLargeGap = -4; // Very close when huge
  const largeGap = -4; // Close when large
  const mediumGap = 0; // Medium distance
  const smallGap = 4; // Further away when small (added 2px for small/tiny states)
  const tinyGap = 4; // Very far when tiny (added 2px for small/tiny states)

  let gapInScreenPx: number;

  if (smallerDimension >= veryLargeThreshold) {
    gapInScreenPx = veryLargeGap;
  } else if (smallerDimension >= largeThreshold) {
    // Interpolate between veryLarge and large
    const t = (smallerDimension - largeThreshold) / (veryLargeThreshold - largeThreshold);
    gapInScreenPx = largeGap + (veryLargeGap - largeGap) * t;
  } else if (smallerDimension >= mediumThreshold) {
    // Interpolate between large and medium
    const t = (smallerDimension - mediumThreshold) / (largeThreshold - mediumThreshold);
    gapInScreenPx = mediumGap + (largeGap - mediumGap) * t;
  } else if (smallerDimension >= smallThreshold) {
    // Interpolate between medium and small
    const t = (smallerDimension - smallThreshold) / (mediumThreshold - smallThreshold);
    gapInScreenPx = smallGap + (mediumGap - smallGap) * t;
  } else {
    // Interpolate between small and tiny
    const t = smallerDimension / smallThreshold;
    gapInScreenPx = tinyGap + (smallGap - tinyGap) * t;
  }

  // Convert screen pixels to canvas pixels
  return gapInScreenPx / zoomLevel;
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

/**
 * UI Size Classification System
 * 
 * Four states based on screen dimensions:
 * - Micro (≤ 10px): 1 corner handle only, no toolbar, no heading
 * - Tiny (10-30px): 1 corner handle, compact toolbar, no heading
 * - Small (30-120px): 4 corner handles, full toolbar, no heading
 * - Normal (≥ 120px): 4 corner handles, full toolbar, with heading
 */
export type UISizeState = 'micro' | 'tiny' | 'small' | 'normal';

export function getUISizeState(
  objectWidth: number,
  objectHeight: number,
  zoomLevel: number
): UISizeState {
  const screenHeight = objectHeight * zoomLevel;
  const screenWidth = objectWidth * zoomLevel;
  const smallerDimension = Math.min(screenHeight, screenWidth);

  if (smallerDimension <= 10) return 'micro';
  if (smallerDimension < 30) return 'tiny';
  if (smallerDimension < 120) return 'small';
  return 'normal';
}

/**
 * Get selection gap based on object size
 * Returns gap in screen pixels:
 * - Normal (larger objects): 2px
 * - Small and Tiny: 1px
 * - Micro: 0.5px
 */
export function getSelectionGap(
  objectWidth: number,
  objectHeight: number,
  zoomLevel: number
): number {
  const sizeState = getUISizeState(objectWidth, objectHeight, zoomLevel);
  
  switch (sizeState) {
    case 'micro':
      return 0.5;
    case 'tiny':
    case 'small':
      return 1;
    case 'normal':
    default:
      return 2;
  }
}

/**
 * Check if object should show metadata header (heading)
 * Only shown in 'normal' state
 */
export function shouldShowObjectMetadata(
  objectWidth: number,
  objectHeight: number,
  zoomLevel: number
): boolean {
  return getUISizeState(objectWidth, objectHeight, zoomLevel) === 'normal';
}

/**
 * Check if toolbar should be shown at all
 * Hidden in 'micro' state (≤ 10px)
 */
export function shouldShowToolbarUI(
  objectWidth: number,
  objectHeight: number,
  zoomLevel: number
): boolean {
  return getUISizeState(objectWidth, objectHeight, zoomLevel) !== 'micro';
}

/**
 * Check if toolbar should be compact (ellipsis mode)
 * Only compact in 'tiny' state (10-30px)
 */
export function shouldUseCompactToolbar(
  objectWidth: number,
  objectHeight: number,
  zoomLevel: number
): boolean {
  return getUISizeState(objectWidth, objectHeight, zoomLevel) === 'tiny';
}

/**
 * Check if object should show all 4 corner handles
 * Only show 1 handle in 'micro' and 'tiny' states, all 4 in 'small' and 'normal'
 */
export function shouldShowAllCornerHandles(
  objectWidth: number,
  objectHeight: number,
  zoomLevel: number
): boolean {
  const state = getUISizeState(objectWidth, objectHeight, zoomLevel);
  return state !== 'micro' && state !== 'tiny';
}

/**
 * Check if object should show the drag handle (right side handle)
 * Hidden in 'micro' and 'tiny' states (≤ 30px)
 */
export function shouldShowDragHandleUI(
  objectWidth: number,
  objectHeight: number,
  zoomLevel: number
): boolean {
  const state = getUISizeState(objectWidth, objectHeight, zoomLevel);
  return state !== 'micro' && state !== 'tiny';
}

/**
 * Calculate the height of the metadata header above an object
 * Returns the height in canvas pixels
 * This is used to position the toolbar above the metadata header
 */
export function getMetadataHeaderHeight(zoomLevel: number): number {
  // The metadata header positioning is:
  // top: -((3 + 6 * Math.min(1, zoomLevel)) / zoomLevel + 12 / zoomLevel)
  // This breaks down to:
  // - Gap: (3 + 6 * Math.min(1, zoomLevel)) / zoomLevel (added 1px spacing)
  // - Font height: 12 / zoomLevel
  
  const gap = (3 + 6 * Math.min(1, zoomLevel)) / zoomLevel;
  const fontSize = 12 / zoomLevel;
  
  return gap + fontSize;
}

/**
 * Promote selected objects to the highest z-index
 * Returns a new array of objects with updated z-indices
 */
export function promoteToHighestZIndex(
  objects: CanvasObject[],
  selectedIds: string[]
): CanvasObject[] {
  if (selectedIds.length === 0) {
    return objects;
  }

  // Initialize zIndex for objects that don't have it
  const objectsWithZIndex = objects.map((obj, index) => ({
    ...obj,
    zIndex: obj.zIndex ?? index,
  }));

  // Find the current highest z-index
  const maxZIndex = Math.max(...objectsWithZIndex.map(obj => obj.zIndex ?? 0));

  // Promote selected objects to be higher than the current max
  return objectsWithZIndex.map(obj => {
    if (selectedIds.includes(obj.id)) {
      return {
        ...obj,
        zIndex: maxZIndex + 1 + selectedIds.indexOf(obj.id),
      };
    }
    return obj;
  });
}

