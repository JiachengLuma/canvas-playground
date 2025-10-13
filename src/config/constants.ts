/**
 * Application Constants
 */

// Zoom
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.25;
export const DEFAULT_ZOOM = 1;

// Toolbar
export const TOOLBAR_HOVER_DELAY_MS = 300;
export const TOOLBAR_DEACTIVATION_DELAY_MS = 600;
export const TOOLBAR_MIN_ZOOM = 0.35; // Below this zoom, toolbars don't show on hover

// Drag
export const DRAG_THRESHOLD_PX = 3; // Minimum pixels to move before drag starts

// Color Tags
export const COLOR_TAGS = {
  none: "transparent",
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
  pink: "#ec4899",
} as const;

// Grid
export const GRID_SIZE = 20;
export const GRID_COLOR = "#e5e7eb";

// Object Defaults
export const DEFAULT_OBJECT_WIDTH = 200;
export const DEFAULT_OBJECT_HEIGHT = 200;

// Canvas
export const CANVAS_BACKGROUND = "#fafafa";

