/**
 * Layout Engine Configuration
 * Configurable parameters for intelligent object placement
 */

export const LAYOUT_CONFIG = {
  // Attention Scoring (kept for debug visualization only)
  // NOTE: Attention head is now simplified to just viewport center
  // The scoring system below is maintained for debug overlay visualization
  ATTENTION_DECAY_MS: 12000, // 12 seconds - how quickly relevance fades
  MOVED_WEIGHT: 1.0, // Weight for recently moved objects
  VIEWED_WEIGHT: 0.2, // Smaller weight for objects merely in viewport
  GENERATED_WEIGHT: 0.9, // Weight for recently generated objects
  CURSOR_ATTENTION_WEIGHT: 0.2, // Light weight for cursor (mainly for right-click scenarios)
  VIEWPORT_ATTENTION_WEIGHT: 0.5, // Stronger weight for viewport center (where user is looking)
  
  // Space Finding
  BUFFER_ZONE_PX: 20, // Buffer space around objects for collision detection
  PLACEMENT_GAP_PX: 20, // Default gap between manually placed objects
  SEARCH_RADIUS_MAX: 2000, // Max distance to search for placement
  SEARCH_STEP_SIZE: 50, // Step size for spiral search
  
  // Visual Density
  DENSITY_GRID_SIZE: 200, // Grid cell size for density calculation
  DENSITY_WEIGHT: 0.3, // How much density affects placement
  
  // Work Flow Detection
  FLOW_DETECTION_MIN_OBJECTS: 3, // Min objects needed to detect flow
  FLOW_DIRECTION_THRESHOLD: 0.6, // Confidence threshold for direction
  
  // Agent Frames
  MAX_NESTING_DEPTH: 5, // Maximum nested sub-frames
  DEFAULT_FRAME_PADDING: 20,
  DEFAULT_FRAME_GAP: 20,
  FRAME_ITEMS_PER_ROW: 3, // Default items in horizontal layout
  
  // Canvas States
  CANVAS_MODE_EMPTY: 'empty',
  CANVAS_MODE_SHOWCASE: 'showcase',
  DEFAULT_CANVAS_MODE: 'showcase',
  
  // Debug
  DEBUG_SHOW_ATTENTION_SCORES: false, // Show red numbers on objects
  DEBUG_SHOW_ATTENTION_HEAD: false, // Show attention head indicator
  DEBUG_SHOW_FLOW_DIRECTION: false, // Show flow direction vector
  DEBUG_SHOW_OCCUPIED_SPACE: false, // Highlight occupied zones
} as const;

export type LayoutConfigKey = keyof typeof LAYOUT_CONFIG;

