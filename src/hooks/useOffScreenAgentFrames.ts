/**
 * Off-Screen Agent Frame Detection Hook
 * Tracks agent frames that are generating/complete off-screen
 */

import { useState, useEffect, useRef } from 'react';
import { CanvasObject } from '../types';
import { calculateEdgeIntersection, isFullyVisibleInViewport, EdgePosition } from '../utils/edgeIntersection';

export interface AgentFrameIndicator {
  frameId: string;
  state: 'generating' | 'complete';
  edgePosition: EdgePosition;
  frameCenter: { x: number; y: number }; // canvas coords
}

export interface IndicatorCluster {
  type: 'cluster';
  indicators: AgentFrameIndicator[];
  edgePosition: EdgePosition;
  generatingCount: number;
  completeCount: number;
}

export type IndicatorItem = 
  | (AgentFrameIndicator & { type: 'single' })
  | IndicatorCluster;

export function useOffScreenAgentFrames(
  objects: CanvasObject[],
  zoomLevel: number,
  panOffset: { x: number; y: number },
  canvasRef: React.RefObject<HTMLDivElement | null>
) {
  const [indicators, setIndicators] = useState<IndicatorItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const initialFrameIdsRef = useRef<Set<string>>(new Set());
  
  // Track initial agent frames on first render - don't show indicators for these
  useEffect(() => {
    if (initialFrameIdsRef.current.size === 0) {
      const initialAgentFrames = objects.filter(
        obj => obj.type === 'frame' && (obj as any).createdBy === 'agent'
      );
      initialFrameIdsRef.current = new Set(initialAgentFrames.map(f => f.id));
    }
  }, []); // Only run once on mount

  useEffect(() => {
    const updateIndicators = () => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenWidth = rect.width;
      const screenHeight = rect.height;
      const viewportCenterScreen = {
        x: screenWidth / 2,
        y: screenHeight / 2,
      };

      // Find all agent frames
      const agentFrames = objects.filter(
        obj => obj.type === 'frame' && (obj as any).createdBy === 'agent'
      );

      // Calculate viewport bounds in canvas coordinates
      const viewportBounds = {
        x: -panOffset.x / zoomLevel,
        y: -panOffset.y / zoomLevel,
        width: screenWidth / zoomLevel,
        height: screenHeight / zoomLevel,
      };

      // Check each frame
      const rawIndicators: AgentFrameIndicator[] = [];
      const processedFrameIds = new Set<string>();
      const framesToDismiss = new Set<string>();

      agentFrames.forEach(frame => {
        // Skip initial frames that existed on page load
        if (initialFrameIdsRef.current.has(frame.id)) return;
        
        // Skip dismissed frames
        if (dismissedIds.has(frame.id)) return;
        
        // Skip if already processed (prevent duplicates)
        if (processedFrameIds.has(frame.id)) return;
        processedFrameIds.add(frame.id);

        // Get actual dimensions for autolayout frames
        let width = frame.width;
        let height = frame.height;
        const element = document.querySelector(`[data-object-id="${frame.id}"]`) as HTMLElement;
        if (element) {
          const actualWidth = element.getAttribute('data-actual-width');
          const actualHeight = element.getAttribute('data-actual-height');
          if (actualWidth) width = parseFloat(actualWidth);
          if (actualHeight) height = parseFloat(actualHeight);
        }

        const frameBounds = {
          x: frame.x,
          y: frame.y,
          width,
          height,
        };

        // Calculate frame center in screen coordinates
        const frameCenterCanvas = {
          x: frame.x + width / 2,
          y: frame.y + height / 2,
        };
        const frameCenterScreen = {
          x: frameCenterCanvas.x * zoomLevel + panOffset.x,
          y: frameCenterCanvas.y * zoomLevel + panOffset.y,
        };

        // Check if frame center is off-screen
        const isCenterOffScreen = 
          frameCenterScreen.x < 0 ||
          frameCenterScreen.x > screenWidth ||
          frameCenterScreen.y < 0 ||
          frameCenterScreen.y > screenHeight;

        // Only show indicator if center is off-screen
        if (isCenterOffScreen) {
          // Calculate edge intersection
          const edgePos = calculateEdgeIntersection(
            viewportCenterScreen,
            frameCenterScreen,
            screenWidth,
            screenHeight
          );

          if (edgePos) {
            // Determine state
            const state = (frame as any).isAgentCreating ? 'generating' : 'complete';

            rawIndicators.push({
              frameId: frame.id,
              state,
              edgePosition: edgePos,
              frameCenter: frameCenterCanvas,
            });
          }
        } else {
          // Frame center is in viewport - check if fully visible to auto-dismiss
          const fullyVisible = isFullyVisibleInViewport(frameBounds, viewportBounds);
          if (fullyVisible) {
            framesToDismiss.add(frame.id);
          }
        }
      });

      // Batch dismiss all frames that became visible
      if (framesToDismiss.size > 0) {
        setDismissedIds(prev => {
          const next = new Set(prev);
          framesToDismiss.forEach(id => next.add(id));
          return next;
        });
      }

      // Since we're using a single centered notification, no need to cluster
      // Just convert raw indicators to the format expected by component
      const formatted: IndicatorItem[] = rawIndicators.map(ind => ({
        ...ind,
        type: 'single' as const,
      }));
      
      // Debug: Log the actual count
      console.log('Off-screen agent frames:', formatted.length, formatted.map(f => f.frameId));
      
      setIndicators(formatted);
    };

    // Update immediately
    updateIndicators();

    // Poll every 200ms for updates
    const interval = setInterval(updateIndicators, 200);
    return () => clearInterval(interval);
  }, [objects, zoomLevel, panOffset, canvasRef, dismissedIds]);

  const dismissIndicator = (frameId: string) => {
    setDismissedIds(prev => new Set(prev).add(frameId));
  };

  return {
    indicators,
    dismissIndicator,
  };
}

/**
 * Cluster indicators that are within threshold distance on the same edge
 */
function clusterIndicators(
  indicators: AgentFrameIndicator[],
  threshold: number
): IndicatorItem[] {
  if (indicators.length === 0) return [];

  // Group by edge
  const byEdge: Record<string, AgentFrameIndicator[]> = {
    top: [],
    bottom: [],
    left: [],
    right: [],
  };

  indicators.forEach(ind => {
    byEdge[ind.edgePosition.edge].push(ind);
  });

  const result: IndicatorItem[] = [];

  // Process each edge
  Object.entries(byEdge).forEach(([edge, edgeIndicators]) => {
    if (edgeIndicators.length === 0) return;

    // Sort by position along edge
    edgeIndicators.sort((a, b) => {
      if (edge === 'top' || edge === 'bottom') {
        return a.edgePosition.x - b.edgePosition.x;
      } else {
        return a.edgePosition.y - b.edgePosition.y;
      }
    });

    // Cluster nearby indicators
    let i = 0;
    while (i < edgeIndicators.length) {
      const cluster: AgentFrameIndicator[] = [edgeIndicators[i]];
      let j = i + 1;

      while (j < edgeIndicators.length) {
        const dist = edge === 'top' || edge === 'bottom'
          ? Math.abs(edgeIndicators[j].edgePosition.x - edgeIndicators[j - 1].edgePosition.x)
          : Math.abs(edgeIndicators[j].edgePosition.y - edgeIndicators[j - 1].edgePosition.y);

        if (dist < threshold) {
          cluster.push(edgeIndicators[j]);
          j++;
        } else {
          break;
        }
      }

      // If cluster has multiple indicators, create cluster
      if (cluster.length > 1) {
        const avgPos = edge === 'top' || edge === 'bottom'
          ? {
              edge: cluster[0].edgePosition.edge,
              x: cluster.reduce((sum, ind) => sum + ind.edgePosition.x, 0) / cluster.length,
              y: cluster[0].edgePosition.y,
            }
          : {
              edge: cluster[0].edgePosition.edge,
              x: cluster[0].edgePosition.x,
              y: cluster.reduce((sum, ind) => sum + ind.edgePosition.y, 0) / cluster.length,
            };

        result.push({
          type: 'cluster',
          indicators: cluster,
          edgePosition: avgPos as EdgePosition,
          generatingCount: cluster.filter(ind => ind.state === 'generating').length,
          completeCount: cluster.filter(ind => ind.state === 'complete').length,
        });
      } else {
        // Single indicator
        result.push({
          ...cluster[0],
          type: 'single',
        });
      }

      i = j;
    }
  });

  return result;
}

