import { motion } from "motion/react";
import { ObjectType, ColorTag } from "../types";
import { ContextToolbar } from "./ContextToolbar";

interface MultiSelectToolbarProps {
  objectTypes: ObjectType[];
  zoomLevel: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  colorTag?: ColorTag;
  onColorTagChange?: () => void;
  onAIPrompt?: (prompt: string) => void;
  onRerun?: () => void;
  onReframe?: () => void;
  onFrameWithAutolayout?: () => void;
  onMore?: () => void;
  onDownload?: () => void;
}

export function MultiSelectToolbar({
  objectTypes,
  zoomLevel,
  bounds,
  colorTag,
  onColorTagChange,
  onAIPrompt,
  onRerun,
  onReframe,
  onFrameWithAutolayout,
  onMore,
  onDownload,
}: MultiSelectToolbarProps) {
  // Position toolbar at the bottom center of the bounding box in canvas coordinates
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const bottomY = bounds.maxY;
  const boundsWidth = (bounds.maxX - bounds.minX) * zoomLevel;

  // Dynamic toolbar gap: closer when zoomed out (1-4px range)
  const toolbarGap = 1 + 3 * Math.min(1, zoomLevel);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: centerX,
        top: bottomY,
        transform: `translate(-50%, calc(${toolbarGap / zoomLevel}px)) scale(${
          1 / zoomLevel
        })`,
        transformOrigin: "top center",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      <div style={{ pointerEvents: "auto" }}>
        <ContextToolbar
          objectTypes={objectTypes}
          isMultiSelect={true}
          objectWidth={boundsWidth}
          colorTag={colorTag}
          onColorTagChange={onColorTagChange}
          onAIPrompt={onAIPrompt}
          onRerun={onRerun}
          onReframe={onReframe}
          onFrameWithAutolayout={onFrameWithAutolayout}
          onMore={onMore}
          onDownload={onDownload}
        />
      </div>
    </motion.div>
  );
}
