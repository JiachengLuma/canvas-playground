/**
 * Layout Engine
 * Intelligent object placement based on attention tracking and spatial analysis
 */

import { CanvasObject } from "../types";
import type {
  AttentionScore,
  AttentionHead,
  WorkFlowDirection,
  LayoutContext,
  PlacementResult,
} from "../types";
import { LAYOUT_CONFIG } from "../config/layoutConfig";

// ============================================================================
// ATTENTION SCORING
// ============================================================================

/**
 * Calculate attention score for an object based on recent interactions
 */
export function calculateAttentionScore(
  objectId: string,
  lastMoved?: number,
  lastViewed?: number,
  lastGenerated?: number
): number {
  const now = Date.now();
  let score = 0;

  const computeDecay = (timestamp?: number, weight = 1) => {
    if (!timestamp) return 0;
    const ageMs = now - timestamp;
    if (ageMs >= LAYOUT_CONFIG.ATTENTION_DECAY_MS) return 0;
    const decay = 1 - ageMs / LAYOUT_CONFIG.ATTENTION_DECAY_MS;
    const adjusted = Math.pow(decay, 1.2);
    return adjusted * weight * 100;
  };

  score += computeDecay(lastMoved, LAYOUT_CONFIG.MOVED_WEIGHT);
  score += computeDecay(lastGenerated, LAYOUT_CONFIG.GENERATED_WEIGHT);
  score += computeDecay(lastViewed, LAYOUT_CONFIG.VIEWED_WEIGHT);

  return Math.min(100, Math.max(0, score));
}

/**
 * Update attention scores for all objects
 */
export function updateAttentionScores(
  objects: CanvasObject[],
  attentionScores: Map<string, AttentionScore>
): Map<string, AttentionScore> {
  const updated = new Map(attentionScores);

  objects.forEach((obj) => {
    const existing = updated.get(obj.id);
    const score = calculateAttentionScore(
      obj.id,
      existing?.lastMoved,
      existing?.lastViewed,
      existing?.lastGenerated
    );

    updated.set(obj.id, {
      objectId: obj.id,
      lastMoved: existing?.lastMoved,
      lastViewed: existing?.lastViewed,
      lastGenerated: existing?.lastGenerated,
      score,
    });
  });

  return updated;
}

// ============================================================================
// ATTENTION HEAD CALCULATION
// ============================================================================

/**
 * Calculate the attention head - weighted center of high-relevance objects
 */
export function calculateAttentionHead(
  objects: CanvasObject[],
  attentionScores: Map<string, AttentionScore>,
  viewportCenter: { x: number; y: number },
  cursorPosition?: { x: number; y: number }
): AttentionHead {
  // Filter objects with significant attention scores
  const relevantObjects = objects
    .map((obj) => ({
      obj,
      score: attentionScores.get(obj.id)?.score || 0,
    }))
    .filter(({ score }) => score > 10); // Threshold for relevance

  // If no relevant objects, return viewport center with low confidence
  // If no relevant objects, fall back to viewport center
  // (Ignore cursor when canvas is empty - cursor might be on UI buttons)
  if (relevantObjects.length === 0) {
    return {
      x: viewportCenter.x,
      y: viewportCenter.y,
      confidence: 0.5, // Reasonable confidence in viewport center
    };
  }

  // Calculate weighted center
  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;

  const addPoint = (x: number, y: number, weight: number) => {
    weightedX += x * weight;
    weightedY += y * weight;
    totalWeight += weight;
  };

  relevantObjects.forEach(({ obj, score }) => {
    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;
    addPoint(centerX, centerY, score);
  });

  const viewportWeight = LAYOUT_CONFIG.VIEWPORT_ATTENTION_WEIGHT * 100;
  addPoint(viewportCenter.x, viewportCenter.y, viewportWeight);

  if (cursorPosition) {
    const cursorWeight = LAYOUT_CONFIG.CURSOR_ATTENTION_WEIGHT * 100;
    addPoint(cursorPosition.x, cursorPosition.y, cursorWeight);
  }

  if (totalWeight === 0) {
    return {
      x: viewportCenter.x,
      y: viewportCenter.y,
      confidence: 0.2,
    };
  }

  const avgScore = relevantObjects.length
    ? totalWeight / (relevantObjects.length + 1)
    : totalWeight;
  const confidence = Math.min(1, avgScore / 80);

  return {
    x: weightedX / totalWeight,
    y: weightedY / totalWeight,
    confidence,
  };
}

// ============================================================================
// WORK FLOW DIRECTION DETECTION
// ============================================================================

/**
 * Detect work flow direction by analyzing spatial distribution of recent objects
 */
export function detectWorkFlowDirection(
  objects: CanvasObject[],
  attentionScores: Map<string, AttentionScore>
): WorkFlowDirection {
  // Get recently interacted objects (high scores)
  const recentObjects = objects
    .map((obj) => ({
      obj,
      score: attentionScores.get(obj.id)?.score || 0,
      timestamp: Math.max(
        attentionScores.get(obj.id)?.lastMoved || 0,
        attentionScores.get(obj.id)?.lastGenerated || 0
      ),
    }))
    .filter(({ score }) => score > 20)
    .sort((a, b) => b.timestamp - a.timestamp);

  // Need minimum objects to detect flow
  if (recentObjects.length < LAYOUT_CONFIG.FLOW_DETECTION_MIN_OBJECTS) {
    return { x: 1, y: 0, confidence: 0.5 }; // Default: right
  }

  // Analyze progression over time
  let totalDx = 0;
  let totalDy = 0;
  let count = 0;

  for (let i = 1; i < Math.min(5, recentObjects.length); i++) {
    const newer = recentObjects[i - 1].obj;
    const older = recentObjects[i].obj;

    const dx = newer.x - older.x;
    const dy = newer.y - older.y;

    totalDx += dx;
    totalDy += dy;
    count++;
  }

  if (count === 0) {
    return { x: 1, y: 0, confidence: 0.5 }; // Default: right
  }

  const avgDx = totalDx / count;
  const avgDy = totalDy / count;

  // Normalize to -1 to 1 range
  const magnitude = Math.sqrt(avgDx * avgDx + avgDy * avgDy);
  const normalizedX = magnitude > 0 ? avgDx / magnitude : 1;
  const normalizedY = magnitude > 0 ? avgDy / magnitude : 0;

  // Calculate confidence based on consistency
  const confidence = Math.min(1, magnitude / 500);

  return {
    x: normalizedX,
    y: normalizedY,
    confidence: Math.max(0.3, confidence),
  };
}

// ============================================================================
// COLLISION DETECTION & DENSITY
// ============================================================================

/**
 * Check if a position collides with existing objects (with buffer)
 */
export function hasCollision(
  x: number,
  y: number,
  width: number,
  height: number,
  objects: CanvasObject[],
  excludeIds: string[] = []
): boolean {
  const buffer = LAYOUT_CONFIG.BUFFER_ZONE_PX;

  return objects.some((obj) => {
    if (excludeIds.includes(obj.id)) return false;

    // Check bounding box overlap with buffer
    return !(
      x + width + buffer < obj.x ||
      x - buffer > obj.x + obj.width ||
      y + height + buffer < obj.y ||
      y - buffer > obj.y + obj.height
    );
  });
}

/**
 * Calculate visual density at a position (how crowded is this area?)
 */
export function calculateDensity(
  x: number,
  y: number,
  objects: CanvasObject[]
): number {
  const gridSize = LAYOUT_CONFIG.DENSITY_GRID_SIZE;
  const region = {
    x: x - gridSize / 2,
    y: y - gridSize / 2,
    width: gridSize,
    height: gridSize,
  };

  // Count objects that overlap with this region
  let overlappingArea = 0;

  objects.forEach((obj) => {
    // Calculate intersection area
    const overlapX = Math.max(
      0,
      Math.min(region.x + region.width, obj.x + obj.width) -
        Math.max(region.x, obj.x)
    );
    const overlapY = Math.max(
      0,
      Math.min(region.y + region.height, obj.y + obj.height) -
        Math.max(region.y, obj.y)
    );

    overlappingArea += overlapX * overlapY;
  });

  // Return density as percentage of region filled
  const totalArea = gridSize * gridSize;
  return overlappingArea / totalArea;
}

// ============================================================================
// SPACE FINDING ALGORITHM
// ============================================================================

/**
 * Find optimal placement position using spiral search from attention head
 */
export function findOptimalPosition(
  context: LayoutContext,
  objects: CanvasObject[],
  attentionHead: AttentionHead,
  workflowDirection: WorkFlowDirection,
  viewportBounds?: { x: number; y: number; width: number; height: number }
): PlacementResult {
  const { width, height } = context.objectSize;
  const startX = attentionHead.x - width / 2;
  const startY = attentionHead.y - height / 2;

  // Check if start position is free
  if (!hasCollision(startX, startY, width, height, objects)) {
    const density = calculateDensity(startX, startY, objects);
    return {
      x: startX,
      y: startY,
      confidence: 1 - density * LAYOUT_CONFIG.DENSITY_WEIGHT,
      reason: "attention_head_free",
    };
  }

  // Spiral search biased by workflow direction
  const step = LAYOUT_CONFIG.SEARCH_STEP_SIZE;
  const maxRadius = LAYOUT_CONFIG.SEARCH_RADIUS_MAX;
  let bestPosition: PlacementResult | null = null;
  let bestScore = -Infinity;

  // Search in expanding rings
  for (let radius = step; radius < maxRadius; radius += step) {
    // Check positions around the circle, biased toward workflow direction
    const numChecks = Math.ceil((2 * Math.PI * radius) / step);

    for (let i = 0; i < numChecks; i++) {
      const angle = (i / numChecks) * Math.PI * 2;

      // Bias angle toward workflow direction
      const biasedAngle =
        angle +
        Math.atan2(workflowDirection.y, workflowDirection.x) *
          workflowDirection.confidence *
          0.5;

      const testX = startX + Math.cos(biasedAngle) * radius;
      const testY = startY + Math.sin(biasedAngle) * radius;

      if (!hasCollision(testX, testY, width, height, objects)) {
        const density = calculateDensity(testX, testY, objects);

        // Score based on: distance (lower is better), density (lower is better), workflow alignment
        const distanceScore = 1 - radius / maxRadius;
        const densityScore = 1 - density;

        // Check alignment with workflow direction
        const dx = testX - startX;
        const dy = testY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const alignment =
          dist > 0
            ? (dx * workflowDirection.x + dy * workflowDirection.y) / dist
            : 0;
        const alignmentScore = (alignment + 1) / 2; // Normalize to 0-1

        const totalScore =
          distanceScore * 0.5 +
          densityScore * 0.3 +
          alignmentScore * workflowDirection.confidence * 0.2;

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestPosition = {
            x: testX,
            y: testY,
            confidence: totalScore,
            reason: `spiral_search_r${radius}`,
          };
        }

        // If we found a good enough position, return it
        if (totalScore > 0.8) {
          return bestPosition!;
        }
      }
    }

    // If we found any valid position, consider returning it
    if (bestPosition && radius > maxRadius / 2) {
      return bestPosition;
    }
  }

  // Fallback: return best position found, or place to the right
  if (bestPosition) {
    return bestPosition;
  }

  // Ultimate fallback
  return {
    x: startX + 300,
    y: startY,
    confidence: 0.2,
    reason: "fallback_right",
  };
}

// ============================================================================
// AGENT FRAME PLACEMENT
// ============================================================================

/**
 * Estimate maximum possible height for an agent frame
 * Based on artifact sizes and max items per scenario
 */
function estimateMaxAgentFrameHeight(): number {
  const padding = LAYOUT_CONFIG.DEFAULT_FRAME_PADDING; // 20px
  
  // From agentFrameManager.ts, tallest artifact is document at 300px
  const tallestArtifact = 300;
  
  // Looking at real usage: most frames are single row with 2-4 items
  // With horizontal nowrap layout, they stay on one row
  // Add extra buffer for frame heading (positioned above frame at -24px)
  
  // Height = top padding + tallest item + bottom padding + heading buffer
  const headingBuffer = 60; // Extra space to account for heading above frame
  const estimatedHeight = padding + tallestArtifact + padding + headingBuffer;
  
  return estimatedHeight; // 400px (20 + 300 + 20 + 60)
}

/**
 * Find placement for agent frames
 * Strategy: Start at attention head, search downward if occupied
 * Biased downward since agent frames grow horizontally
 * Uses estimated max height to avoid overlaps during growth
 */
export function findAgentFramePosition(
  frameWidth: number,
  frameHeight: number,
  objects: CanvasObject[],
  attentionHead: AttentionHead,
  viewportCenter: { x: number; y: number }
): PlacementResult {
  const gap = LAYOUT_CONFIG.PLACEMENT_GAP_PX;
  
  // Use estimated max height for collision detection to account for growth
  const estimatedMaxHeight = estimateMaxAgentFrameHeight();
  
  // Strategy: "Where is user looking?" → Check if there's a recent agent frame nearby
  // If yes, stack below it. If no, start fresh at viewport center.
  
  const agentFrames = objects.filter(obj => 
    obj.type === 'frame' && (obj as any).createdBy === 'agent'
  );
  
  // FIRST: Check if there's an agent frame NEAR viewport center
  // This means user is still "in the conversation" at this location
  if (agentFrames.length > 0) {
    // Find agent frames near where user is currently looking
    const nearbyAgentFrames = agentFrames
      .map(frame => ({
        frame,
        distance: Math.hypot(
          (frame.x + frame.width / 2) - viewportCenter.x,
          (frame.y + frame.height / 2) - viewportCenter.y
        )
      }))
      .filter(({ distance }) => distance < 800) // Within "conversation radius"
      .sort((a, b) => a.distance - b.distance);
    
    if (nearbyAgentFrames.length > 0) {
      // User is near existing frames - find the bottommost one and stack below it
      const nearbyFrameObjects = nearbyAgentFrames.map(nf => nf.frame);
      const bottomFrame = nearbyFrameObjects.reduce((lowest, frame) => 
        (frame.y + frame.height > lowest.y + lowest.height) ? frame : lowest
      );
      
      // Stack below, reserving full estimated height
      const bottomFrameReservedY = bottomFrame.y + estimatedMaxHeight;
      let testX = bottomFrame.x;
      let testY = bottomFrameReservedY + gap;
      
      // Check collision with full estimated height
      if (!hasCollision(testX, testY, frameWidth, estimatedMaxHeight, objects)) {
        return {
          x: testX,
          y: testY,
          confidence: 1,
          reason: "stacked_below_nearby_agent_frame",
        };
      }
      
      // Direct stacking failed - search downward from the stack
      // Keep the same X (left-aligned), but search for space going down
      const searchStep = 300;
      const maxAttempts = 10;
      
      for (let i = 1; i <= maxAttempts; i++) {
        testY = bottomFrameReservedY + gap + (i * searchStep);
        
        if (!hasCollision(testX, testY, frameWidth, estimatedMaxHeight, objects)) {
          return {
            x: testX,
            y: testY,
            confidence: 0.9,
            reason: `stacked_with_gap_step_${i}`,
          };
        }
      }
      
      // Still couldn't find space in the stack area - this is an ongoing conversation
      // so keep going further down rather than jumping to viewport center
      const furthestY = testY + searchStep * 3; // Go even further down
      return {
        x: testX,
        y: furthestY,
        confidence: 0.7,
        reason: "forced_stack_continuation",
      };
    }
  }
  
  // SECOND: No nearby agent frames - user has moved to a new area
  // Try to place at viewport center (where they're looking)
  
  let testX = viewportCenter.x - frameWidth / 2; // Center the frame
  let testY = viewportCenter.y;
  
  if (!hasCollision(testX, testY, frameWidth, estimatedMaxHeight, objects)) {
    return {
      x: testX,
      y: testY,
      confidence: 0.9,
      reason: "viewport_center_empty",
    };
  }
  
  // THIRD: Viewport center occupied - search nearby for empty space
  // Try positions around viewport center
  const searchOffsets = [
    { dx: 0, dy: 200 },      // Below viewport center
    { dx: 200, dy: 0 },      // Right of viewport center
    { dx: -200, dy: 0 },     // Left of viewport center
    { dx: 0, dy: -200 },     // Above viewport center
    { dx: 300, dy: 200 },    // Diagonal bottom-right
    { dx: -300, dy: 200 },   // Diagonal bottom-left
  ];
  
  for (const offset of searchOffsets) {
    testX = viewportCenter.x + offset.dx - frameWidth / 2;
    testY = viewportCenter.y + offset.dy;
    
    if (!hasCollision(testX, testY, frameWidth, estimatedMaxHeight, objects)) {
      return {
        x: testX,
        y: testY,
        confidence: 0.8,
        reason: "near_viewport_center",
      };
    }
  }
  
  // FOURTH: If crowded, search downward from attention head
  // Use smaller steps (actual frame height, not estimated max)
  // This makes better use of space in crowded areas
  const searchStep = 200; // Reasonable step size
  const maxAttempts = 10;
  
  for (let i = 1; i <= maxAttempts; i++) {
    let testY = attentionHead.y + i * searchStep;
    
    // Try at attention head X
    let testX = attentionHead.x;
    if (!hasCollision(testX, testY, frameWidth, estimatedMaxHeight, objects)) {
      return {
        x: testX,
        y: testY,
        confidence: 0.7,
        reason: `downward_search_step_${i}`,
      };
    }
    
    // Try centered
    testX = attentionHead.x - frameWidth / 2;
    if (!hasCollision(testX, testY, frameWidth, estimatedMaxHeight, objects)) {
      return {
        x: testX,
        y: testY,
        confidence: 0.6,
        reason: `downward_centered_step_${i}`,
      };
    }
  }
  
  // Ultimate fallback: place far below everything
  // Find the bottommost object
  const bottomY = objects.length > 0
    ? Math.max(...objects.map(obj => obj.y + obj.height))
    : attentionHead.y;
  
  return {
    x: attentionHead.x,
    y: bottomY + gap * 4,
    confidence: 0.3,
    reason: "fallback_below_all",
  };
}

// ============================================================================
// HEURISTIC PLACEMENT
// ============================================================================

/**
 * Place object to the right of a source object (for "show more" or manual placement)
 */
export function placeToRightOf(
  sourceObject: CanvasObject,
  objectSize: { width: number; height: number },
  objects: CanvasObject[]
): PlacementResult {
  const gap = LAYOUT_CONFIG.PLACEMENT_GAP_PX;
  const exclude = [sourceObject.id];
  let x = sourceObject.x + sourceObject.width + gap;
  const y = sourceObject.y; // Align top

  const maxHorizontalAttempts = 12;
  for (let i = 0; i < maxHorizontalAttempts; i++) {
    if (!hasCollision(x, y, objectSize.width, objectSize.height, objects, exclude)) {
      return {
        x,
        y,
        confidence: 1,
        reason: i === 0 ? "right_of_source" : "right_of_source_offset",
      };
    }
    x += objectSize.width + gap;
  }

  // If horizontal space is packed, fall back to original downward shift
  const fallbackX = sourceObject.x + sourceObject.width + gap;
  for (let i = 1; i <= 8; i++) {
    const testY = y + i * (objectSize.height + gap);
    if (!hasCollision(fallbackX, testY, objectSize.width, objectSize.height, objects, exclude)) {
      return {
        x: fallbackX,
        y: testY,
        confidence: 0.6,
        reason: "right_of_source_shifted",
      };
    }
  }

  return {
    x,
    y,
    confidence: 0.4,
    reason: "right_of_source_far",
  };
}

/**
 * Get the rightmost object (for sequential manual placement)
 */
export function getRightmostObject(objects: CanvasObject[]): CanvasObject | null {
  if (objects.length === 0) return null;

  return objects.reduce((rightmost, obj) => {
    const objRightEdge = obj.x + obj.width;
    const rightmostRightEdge = rightmost.x + rightmost.width;
    return objRightEdge > rightmostRightEdge ? obj : rightmost;
  });
}

/**
 * Place object sequentially after the last one
 */
export function placeSequentially(
  objectSize: { width: number; height: number },
  objects: CanvasObject[],
  viewportCenter: { x: number; y: number }
): PlacementResult {
  // If no objects, place at viewport center
  if (objects.length === 0) {
    return {
      x: viewportCenter.x - objectSize.width / 2,
      y: viewportCenter.y - objectSize.height / 2,
      confidence: 1,
      reason: "first_object",
    };
  }

  // Find rightmost object and place to its right
  const rightmost = getRightmostObject(objects);
  if (rightmost) {
    return placeToRightOf(rightmost, objectSize, objects);
  }

  // Fallback
  return {
    x: viewportCenter.x,
    y: viewportCenter.y,
    confidence: 0.3,
    reason: "fallback_viewport",
  };
}

