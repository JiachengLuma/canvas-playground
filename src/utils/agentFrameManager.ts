/**
 * Agent Frame Manager
 * Handles sizing, dissolution, and management of agent-created frames
 */

import { CanvasObject, FrameObject, ArtifactType } from "../types";
import { LAYOUT_CONFIG } from "../config/layoutConfig";

// ============================================================================
// FRAME SIZING
// ============================================================================

/**
 * Default artifact sizes for estimation
 */
const DEFAULT_ARTIFACT_SIZES: Record<
  ArtifactType,
  { width: number; height: number }
> = {
  image: { width: 250, height: 200 },
  video: { width: 280, height: 160 },
  audio: { width: 250, height: 100 },
  document: { width: 280, height: 300 },
};

/**
 * Calculate required frame size for horizontal layout of items
 */
export function calculateFrameSize(
  itemCount: number,
  itemsPerRow: number = LAYOUT_CONFIG.FRAME_ITEMS_PER_ROW,
  artifactType: ArtifactType = "image",
  nestingDepth: number = 0
): { width: number; height: number } {
  const padding = LAYOUT_CONFIG.DEFAULT_FRAME_PADDING;
  const gap = LAYOUT_CONFIG.DEFAULT_FRAME_GAP;
  const itemSize = DEFAULT_ARTIFACT_SIZES[artifactType];
  const borderWidth = 2; // Account for frame border

  // Calculate rows needed
  const numRows = Math.ceil(itemCount / itemsPerRow);
  const itemsInLastRow = itemCount % itemsPerRow || itemsPerRow;

  // Calculate actual items per row (could be less than itemsPerRow for small counts)
  const actualItemsPerRow = Math.min(itemCount, itemsPerRow);

  // Width: fit items per row with gaps and padding
  const width =
    actualItemsPerRow * itemSize.width +
    (actualItemsPerRow - 1) * gap +
    padding * 2 +
    borderWidth;

  // Height: fit all rows with gaps and padding
  const height =
    numRows * itemSize.height +
    (numRows - 1) * gap +
    padding * 2 +
    borderWidth;

  // Add extra space for nested frames (vertical stacking needs more height)
  const nestingExtraHeight = nestingDepth > 0 ? nestingDepth * 50 : 0;

  return {
    width,
    height: height + nestingExtraHeight,
  };
}

/**
 * Calculate frame size for nested sub-frames (vertical stacking)
 */
export function calculateNestedFrameSize(
  subFrames: Array<{ itemCount: number; artifactType: ArtifactType }>,
  nestingDepth: number = 1
): { width: number; height: number } {
  const padding = LAYOUT_CONFIG.DEFAULT_FRAME_PADDING;
  const gap = LAYOUT_CONFIG.DEFAULT_FRAME_GAP;
  const borderWidth = 2;

  let maxWidth = 0;
  let totalHeight = 0;

  // Calculate size of each sub-frame and stack vertically
  subFrames.forEach((subFrame, index) => {
    const subFrameSize = calculateFrameSize(
      subFrame.itemCount,
      LAYOUT_CONFIG.FRAME_ITEMS_PER_ROW,
      subFrame.artifactType,
      nestingDepth
    );

    maxWidth = Math.max(maxWidth, subFrameSize.width);
    totalHeight += subFrameSize.height;

    // Add gap between sub-frames (but not after the last one)
    if (index < subFrames.length - 1) {
      totalHeight += gap;
    }
  });

  return {
    width: maxWidth + padding * 2 + borderWidth,
    height: totalHeight + padding * 2 + borderWidth,
  };
}

// ============================================================================
// FRAME DISSOLUTION
// ============================================================================

/**
 * Check if a frame should be dissolved (only 1 child remaining)
 */
export function shouldDissolveFrame(frame: FrameObject): boolean {
  // Only dissolve agent frames, not human-created frames
  if (frame.createdBy !== "agent") return false;

  // Dissolve if only 1 child
  return frame.children.length === 1;
}

/**
 * Dissolve a frame by removing it and updating its children
 * Returns updated objects array with frame removed and child updated
 */
export function dissolveFrame(
  frameId: string,
  objects: CanvasObject[]
): CanvasObject[] {
  const frame = objects.find((obj) => obj.id === frameId);
  if (!frame || frame.type !== "frame") {
    return objects;
  }

  const frameObj = frame as FrameObject;

  // Get the single child
  const childId = frameObj.children[0];
  if (!childId) return objects;

  // Remove frame and update child
  return objects
    .filter((obj) => obj.id !== frameId)
    .map((obj) => {
      if (obj.id === childId) {
        // Move child to frame's position and remove parentId
        const { parentId, ...rest } = obj;
        return {
          ...rest,
          x: frame.x + LAYOUT_CONFIG.DEFAULT_FRAME_PADDING,
          y: frame.y + LAYOUT_CONFIG.DEFAULT_FRAME_PADDING,
        };
      }
      return obj;
    });
}

/**
 * Check if any frames should be dissolved and dissolve them
 * Handles cascading dissolution (nested frames)
 */
export function checkAndDissolveFrames(
  objects: CanvasObject[]
): CanvasObject[] {
  let updated = [...objects];
  let hasChanges = true;

  // Keep checking until no more frames need dissolution (cascading)
  while (hasChanges) {
    hasChanges = false;

    const framesToDissolve = updated.filter((obj) => {
      if (obj.type !== "frame") return false;
      return shouldDissolveFrame(obj as FrameObject);
    });

    if (framesToDissolve.length > 0) {
      hasChanges = true;
      framesToDissolve.forEach((frame) => {
        updated = dissolveFrame(frame.id, updated);
      });
    }
  }

  return updated;
}

// ============================================================================
// PARALLEL GENERATION COORDINATION
// ============================================================================

/**
 * Calculate positions for multiple items within a frame (horizontal layout)
 */
export function calculateItemPositionsInFrame(
  frameX: number,
  frameY: number,
  itemCount: number,
  itemsPerRow: number = LAYOUT_CONFIG.FRAME_ITEMS_PER_ROW,
  artifactType: ArtifactType = "image"
): Array<{ x: number; y: number }> {
  const padding = LAYOUT_CONFIG.DEFAULT_FRAME_PADDING;
  const gap = LAYOUT_CONFIG.DEFAULT_FRAME_GAP;
  const itemSize = DEFAULT_ARTIFACT_SIZES[artifactType];

  const positions: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < itemCount; i++) {
    const row = Math.floor(i / itemsPerRow);
    const col = i % itemsPerRow;

    const x = frameX + padding + col * (itemSize.width + gap);
    const y = frameY + padding + row * (itemSize.height + gap);

    positions.push({ x, y });
  }

  return positions;
}

/**
 * Calculate positions for nested sub-frames (vertical stacking)
 */
export function calculateSubFramePositions(
  parentFrameX: number,
  parentFrameY: number,
  subFrameCounts: number[],
  artifactType: ArtifactType = "image",
  nestingDepth: number = 1
): Array<{ x: number; y: number; width: number; height: number }> {
  const padding = LAYOUT_CONFIG.DEFAULT_FRAME_PADDING;
  const gap = LAYOUT_CONFIG.DEFAULT_FRAME_GAP;

  const positions: Array<{ x: number; y: number; width: number; height: number }> = [];
  let currentY = parentFrameY + padding;

  subFrameCounts.forEach((itemCount) => {
    const subFrameSize = calculateFrameSize(
      itemCount,
      LAYOUT_CONFIG.FRAME_ITEMS_PER_ROW,
      artifactType,
      nestingDepth
    );

    positions.push({
      x: parentFrameX + padding,
      y: currentY,
      width: subFrameSize.width,
      height: subFrameSize.height,
    });

    currentY += subFrameSize.height + gap;
  });

  return positions;
}

// ============================================================================
// FRAME CREATION HELPERS
// ============================================================================

/**
 * Estimate what type of frame is needed based on context
 */
export interface FrameEstimate {
  type: "single" | "simple" | "nested";
  itemCount?: number;
  subFrames?: number[];
  size: { width: number; height: number };
}

/**
 * Create a frame estimate for simple agent generation
 */
export function estimateSimpleFrame(
  itemCount: number,
  artifactType: ArtifactType = "image"
): FrameEstimate {
  // Single item - will be dissolved after generation
  if (itemCount === 1) {
    const size = DEFAULT_ARTIFACT_SIZES[artifactType];
    return {
      type: "single",
      itemCount: 1,
      size: {
        width: size.width + LAYOUT_CONFIG.DEFAULT_FRAME_PADDING * 2 + 2,
        height: size.height + LAYOUT_CONFIG.DEFAULT_FRAME_PADDING * 2 + 2,
      },
    };
  }

  // Multiple items - horizontal layout
  return {
    type: "simple",
    itemCount,
    size: calculateFrameSize(itemCount, LAYOUT_CONFIG.FRAME_ITEMS_PER_ROW, artifactType),
  };
}

/**
 * Create a frame estimate for nested agent generation
 */
export function estimateNestedFrame(
  subFrameItemCounts: number[],
  artifactType: ArtifactType = "image"
): FrameEstimate {
  const subFrames = subFrameItemCounts.map((count) => ({
    itemCount: count,
    artifactType,
  }));

  return {
    type: "nested",
    subFrames: subFrameItemCounts,
    size: calculateNestedFrameSize(subFrames, 1),
  };
}

