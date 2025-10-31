/**
 * Attention Tracking Hook
 * Tracks user interactions and maintains attention scores for intelligent placement
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { CanvasObject, AttentionScore, AttentionHead, WorkFlowDirection } from "../types";
import {
  updateAttentionScores,
  calculateAttentionHead,
  detectWorkFlowDirection,
  calculateAttentionScore,
} from "../utils/layoutEngine";
import { LAYOUT_CONFIG } from "../config/layoutConfig";

export interface AttentionTrackingState {
  attentionScores: Map<string, AttentionScore>;
  attentionHead: AttentionHead;
  workflowDirection: WorkFlowDirection;
  
  // Methods to update attention
  trackObjectMoved: (objectId: string) => void;
  trackObjectGenerated: (objectId: string) => void;
  trackObjectViewed: (objectIds: string[]) => void;
  
  // Debug access
  getAttentionScore: (objectId: string) => number;
}

export function useAttentionTracking(
  objects: CanvasObject[],
  zoomLevel: number,
  panOffset: { x: number; y: number },
  canvasRef: React.RefObject<HTMLDivElement | null>,
  cursorPosition?: { x: number; y: number }
): AttentionTrackingState {
  const [attentionScores, setAttentionScores] = useState<Map<string, AttentionScore>>(
    new Map()
  );
  const [attentionHead, setAttentionHead] = useState<AttentionHead>({
    x: 0,
    y: 0,
    confidence: 0,
  });
  const [workflowDirection, setWorkflowDirection] = useState<WorkFlowDirection>({
    x: 1,
    y: 0,
    confidence: 0.5,
  });

  // Track last update time to avoid excessive recalculations
  const lastUpdateRef = useRef<number>(0);

  // Initialize attention scores for new objects
  useEffect(() => {
    setAttentionScores((prev) => {
      const updated = new Map(prev);
      
      objects.forEach((obj) => {
        if (!updated.has(obj.id)) {
          updated.set(obj.id, {
            objectId: obj.id,
            lastGenerated: obj.metadata?.createdAt,
            score: 0,
          });
        }
      });

      // Remove scores for deleted objects
      const objectIds = new Set(objects.map((obj) => obj.id));
      Array.from(updated.keys()).forEach((id) => {
        if (!objectIds.has(id)) {
          updated.delete(id);
        }
      });

      return updated;
    });
  }, [objects]);

  // Recalculate attention metrics periodically
  useEffect(() => {
    const recalculate = () => {
      const now = Date.now();
      
      // Throttle updates to every 500ms
      if (now - lastUpdateRef.current < 500) {
        return;
      }
      
      lastUpdateRef.current = now;

      // Update scores with decay (keep for debug visualization)
      const updatedScores = updateAttentionScores(objects, attentionScores);
      setAttentionScores(updatedScores);

      // Calculate viewport center in canvas coordinates
      const rect = canvasRef.current?.getBoundingClientRect();
      const viewportCenter = rect
        ? {
            x: (rect.width / 2 - panOffset.x) / zoomLevel,
            y: (rect.height / 2 - panOffset.y) / zoomLevel,
          }
        : { x: 0, y: 0 };

      // SIMPLIFIED: Attention head is just viewport center
      // (Keeping the complex calculation code for potential future use)
      setAttentionHead({
        x: viewportCenter.x,
        y: viewportCenter.y,
        confidence: 1.0,
      });

      // Detect workflow direction (keep for potential future use)
      const newWorkflowDirection = detectWorkFlowDirection(objects, updatedScores);
      setWorkflowDirection(newWorkflowDirection);
    };

    // Recalculate immediately
    recalculate();

    // Set up interval for periodic updates
    const interval = setInterval(recalculate, 1000);

    return () => clearInterval(interval);
  }, [objects, attentionScores, zoomLevel, panOffset, canvasRef, cursorPosition]);

  // Track when objects are in viewport (viewed)
  useEffect(() => {
    const updateViewedObjects = () => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Calculate viewport bounds in canvas coordinates
      const viewportMinX = -panOffset.x / zoomLevel;
      const viewportMinY = -panOffset.y / zoomLevel;
      const viewportMaxX = (rect.width - panOffset.x) / zoomLevel;
      const viewportMaxY = (rect.height - panOffset.y) / zoomLevel;

      const viewedIds: string[] = [];

      objects.forEach((obj) => {
        // Check if object is in viewport
        const isInView = !(
          obj.x + obj.width < viewportMinX ||
          obj.x > viewportMaxX ||
          obj.y + obj.height < viewportMinY ||
          obj.y > viewportMaxY
        );

        if (isInView) {
          viewedIds.push(obj.id);
        }
      });

      // Update viewed timestamps
      if (viewedIds.length > 0) {
        setAttentionScores((prev) => {
          const updated = new Map(prev);
          const now = Date.now();

          viewedIds.forEach((id) => {
            const existing = updated.get(id);
            if (existing) {
              updated.set(id, {
                ...existing,
                lastViewed: now,
              });
            }
          });

          return updated;
        });
      }
    };

    // Update viewed objects on zoom/pan changes
    updateViewedObjects();
  }, [objects, zoomLevel, panOffset, canvasRef]);

  // Track object moved
  const trackObjectMoved = useCallback((objectId: string) => {
    setAttentionScores((prev) => {
      const updated = new Map(prev);
      const existing = updated.get(objectId);
      const now = Date.now();
      
      updated.set(objectId, {
        objectId,
        lastMoved: now,
        lastViewed: existing?.lastViewed,
        lastGenerated: existing?.lastGenerated,
        score: calculateAttentionScore(
          objectId,
          now,
          existing?.lastViewed,
          existing?.lastGenerated
        ),
      });

      return updated;
    });
  }, []);

  // Track object generated
  const trackObjectGenerated = useCallback((objectId: string) => {
    setAttentionScores((prev) => {
      const updated = new Map(prev);
      const existing = updated.get(objectId);
      const now = Date.now();
      
      updated.set(objectId, {
        objectId,
        lastMoved: existing?.lastMoved,
        lastViewed: existing?.lastViewed,
        lastGenerated: now,
        score: calculateAttentionScore(
          objectId,
          existing?.lastMoved,
          existing?.lastViewed,
          now
        ),
      });

      return updated;
    });
  }, []);

  // Track objects viewed
  const trackObjectViewed = useCallback((objectIds: string[]) => {
    setAttentionScores((prev) => {
      const updated = new Map(prev);
      const now = Date.now();

      objectIds.forEach((id) => {
        const existing = updated.get(id);
        if (existing) {
          updated.set(id, {
            ...existing,
            lastViewed: now,
          });
        }
      });

      return updated;
    });
  }, []);

  // Get attention score for an object (for debug visualization)
  const getAttentionScore = useCallback(
    (objectId: string): number => {
      return attentionScores.get(objectId)?.score || 0;
    },
    [attentionScores]
  );

  return {
    attentionScores,
    attentionHead,
    workflowDirection,
    trackObjectMoved,
    trackObjectGenerated,
    trackObjectViewed,
    getAttentionScore,
  };
}

