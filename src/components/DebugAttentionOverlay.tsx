/**
 * Debug Attention Overlay
 * Shows attention scores as red numbers on top of objects for debugging the layout engine
 */

import { CanvasObject } from "../types";

interface DebugAttentionOverlayProps {
  objects: CanvasObject[];
  zoomLevel: number;
  panOffset: { x: number; y: number };
  getAttentionScore: (objectId: string) => number;
  enabled: boolean;
}

export function DebugAttentionOverlay({
  objects,
  zoomLevel,
  panOffset,
  getAttentionScore,
  enabled,
}: DebugAttentionOverlayProps) {
  if (!enabled) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 10000, // Very high z-index to appear on top
      }}
    >
      {objects.map((obj) => {
        const score = Math.round(getAttentionScore(obj.id));
        
        // Skip objects with zero attention
        if (score === 0) return null;
        
        // For children of agent frames, skip rendering their individual scores
        if (obj.parentId) {
          const parent = objects.find(o => o.id === obj.parentId);
          if (parent && parent.type === 'frame' && (parent as any).createdBy === 'agent') {
            return null;
          }
        }

        // Calculate screen position
        const screenX = obj.x * zoomLevel + panOffset.x;
        const screenY = obj.y * zoomLevel + panOffset.y;

        return (
          <div
            key={`attention-${obj.id}`}
            className="absolute flex items-center justify-center"
            style={{
              left: screenX,
              top: screenY,
              width: 40,
              height: 40,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="flex items-center justify-center text-white font-bold text-xs rounded-full shadow-lg"
              style={{
                backgroundColor: score > 75 ? '#dc2626' : score > 50 ? '#ea580c' : score > 25 ? '#f59e0b' : '#64748b',
                width: 32,
                height: 32,
              }}
            >
              {score}
            </div>
          </div>
        );
      })}
    </div>
  );
}

