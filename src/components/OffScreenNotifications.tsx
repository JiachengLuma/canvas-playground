/**
 * Off-Screen Notifications Component
 * Simple centered notification at bottom showing off-screen agent frames
 */

import { motion, AnimatePresence } from 'motion/react';
import { IndicatorItem } from '../hooks/useOffScreenAgentFrames';
import { CanvasObject } from '../types';

interface OffScreenNotificationsProps {
  indicators: IndicatorItem[];
  objects: CanvasObject[];
  zoomLevel: number;
  panOffset: { x: number; y: number };
  onPanToFrame: (frameId: string) => void;
  onZoomToShowAll: (frameIds: string[]) => void;
}

export function OffScreenNotifications({
  indicators,
  objects,
  zoomLevel,
  panOffset,
  onPanToFrame,
  onZoomToShowAll,
}: OffScreenNotificationsProps) {
  // Count unique frames (avoid double-counting in clusters)
  const uniqueFrames = new Set<string>();
  let generatingCount = 0;
  let completeCount = 0;

  indicators.forEach((item) => {
    if (item.type === 'single') {
      if (!uniqueFrames.has(item.frameId)) {
        uniqueFrames.add(item.frameId);
        if (item.state === 'generating') {
          generatingCount++;
        } else {
          completeCount++;
        }
      }
    } else {
      // Cluster - count each indicator once
      item.indicators.forEach((ind) => {
        if (!uniqueFrames.has(ind.frameId)) {
          uniqueFrames.add(ind.frameId);
          if (ind.state === 'generating') {
            generatingCount++;
          } else {
            completeCount++;
          }
        }
      });
    }
  });

  const allFrameIds = Array.from(uniqueFrames);
  const total = generatingCount + completeCount;
  const progressPercent = total > 0 ? (completeCount / total) * 100 : 0;

  if (total === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          pointerEvents: 'auto',
        }}
        onClick={() => onZoomToShowAll(allFrameIds)}
        className="cursor-pointer"
      >
        {/* Perfect circle with progress ring */}
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            width: '48px',
            height: '48px',
            position: 'relative',
          }}
        >
          {/* Circular progress ring */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: 'rotate(-90deg)',
            }}
          >
            {/* Background circle (light gray) */}
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="none"
              stroke="rgba(0, 0, 0, 0.08)"
              strokeWidth="2.5"
            />
            {/* Progress circle (green) */}
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="none"
              stroke="#4ade80"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - progressPercent / 100)}`}
              style={{
                transition: 'stroke-dashoffset 0.3s ease',
              }}
            />
          </svg>

          {/* Count in center */}
          <span className="text-sm font-medium text-black relative z-10">
            {total}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

