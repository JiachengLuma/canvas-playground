/**
 * Edge Intersection Utilities
 * Calculate where a line intersects with screen edges
 */

export type Edge = 'top' | 'bottom' | 'left' | 'right';

export interface EdgePosition {
  edge: Edge;
  x: number; // px from left (for top/bottom edges)
  y: number; // px from top (for left/right edges)
}

/**
 * Calculate intersection point of a line with screen edges
 * Line goes from viewport center to frame center
 */
export function calculateEdgeIntersection(
  viewportCenterScreen: { x: number; y: number },
  frameCenterScreen: { x: number; y: number },
  screenWidth: number,
  screenHeight: number
): EdgePosition | null {
  const { x: cx, y: cy } = viewportCenterScreen;
  const { x: fx, y: fy } = frameCenterScreen;

  // Direction vector
  const dx = fx - cx;
  const dy = fy - cy;

  // If frame is at viewport center, no indicator needed
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
    return null;
  }

  // Calculate parametric t values for each edge
  // Line equation: P = (cx, cy) + t * (dx, dy)
  const intersections: { t: number; edge: Edge; x: number; y: number }[] = [];

  // Top edge (y = 0)
  if (dy !== 0) {
    const t = (0 - cy) / dy;
    if (t > 0) {
      const x = cx + t * dx;
      if (x >= 0 && x <= screenWidth) {
        intersections.push({ t, edge: 'top', x, y: 0 });
      }
    }
  }

  // Bottom edge (y = screenHeight)
  if (dy !== 0) {
    const t = (screenHeight - cy) / dy;
    if (t > 0) {
      const x = cx + t * dx;
      if (x >= 0 && x <= screenWidth) {
        intersections.push({ t, edge: 'bottom', x, y: screenHeight });
      }
    }
  }

  // Left edge (x = 0)
  if (dx !== 0) {
    const t = (0 - cx) / dx;
    if (t > 0) {
      const y = cy + t * dy;
      if (y >= 0 && y <= screenHeight) {
        intersections.push({ t, edge: 'left', x: 0, y });
      }
    }
  }

  // Right edge (x = screenWidth)
  if (dx !== 0) {
    const t = (screenWidth - cx) / dx;
    if (t > 0) {
      const y = cy + t * dy;
      if (y >= 0 && y <= screenHeight) {
        intersections.push({ t, edge: 'right', x: screenWidth, y });
      }
    }
  }

  // Return intersection with smallest t (closest to viewport center)
  if (intersections.length === 0) {
    return null;
  }

  intersections.sort((a, b) => a.t - b.t);
  const closest = intersections[0];

  return {
    edge: closest.edge,
    x: closest.x,
    y: closest.y,
  };
}

/**
 * Check if a point is fully visible in viewport
 */
export function isFullyVisibleInViewport(
  objectBounds: { x: number; y: number; width: number; height: number },
  viewportBounds: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    objectBounds.x >= viewportBounds.x &&
    objectBounds.y >= viewportBounds.y &&
    objectBounds.x + objectBounds.width <= viewportBounds.x + viewportBounds.width &&
    objectBounds.y + objectBounds.height <= viewportBounds.y + viewportBounds.height
  );
}

