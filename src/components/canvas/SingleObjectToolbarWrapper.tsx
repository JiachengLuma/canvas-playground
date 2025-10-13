/**
 * Single Object Toolbar Wrapper
 * Handles positioning and animation of the context toolbar for single-selected objects
 */

import { motion, AnimatePresence } from "motion/react";
import { ContextToolbar } from "../ContextToolbar";
import { CanvasObject as CanvasObjectType } from "../../types";
import { shouldShowToolbar } from "../../config/behaviorConfig";
import { getToolbarGap } from "../../utils/canvasUtils";

// Helper to calculate actual rendered dimensions for autolayout frames
function getActualDimensions(
  obj: CanvasObjectType,
  allObjects: CanvasObjectType[]
): { width: number; height: number } {
  if (obj.type !== "frame" || !(obj as any).autoLayout) {
    return { width: obj.width, height: obj.height };
  }

  const frameObj = obj as any;
  const padding = frameObj.padding || 10;
  const gap = frameObj.gap || 10;
  const layout = frameObj.layout || "hstack";
  const children = allObjects.filter((o) => o.parentId === obj.id);

  if (children.length === 0) {
    return { width: padding * 2, height: padding * 2 };
  }

  if (layout === "hstack") {
    const totalWidth =
      children.reduce((sum, child) => sum + child.width, 0) +
      gap * (children.length - 1) +
      padding * 2;
    const maxHeight =
      Math.max(...children.map((child) => child.height)) + padding * 2;
    return { width: totalWidth, height: maxHeight };
  } else if (layout === "vstack") {
    const maxWidth =
      Math.max(...children.map((child) => child.width)) + padding * 2;
    const totalHeight =
      children.reduce((sum, child) => sum + child.height, 0) +
      gap * (children.length - 1) +
      padding * 2;

    console.log("📐 VStack height calculation:", {
      children: children.length,
      childHeights: children.map((c) => c.height),
      gap,
      padding,
      totalHeight,
      frameY: obj.y,
    });

    return { width: maxWidth, height: totalHeight };
  } else {
    // grid - calculate actual wrapped dimensions using flow simulation
    const frameWidth = obj.width;
    const borderWidth = 2;
    const availableWidth = frameWidth - padding * 2 - borderWidth;

    // Simulate flexWrap: "wrap" behavior - items wrap based on actual widths
    let currentRowWidth = 0;
    let currentRowHeight = 0;
    let totalHeight = 0;
    let rowCount = 0;

    children.forEach((child, index) => {
      const childWidth = child.width;
      const childHeight = child.height;

      // Check if this child fits in the current row
      const widthNeeded =
        currentRowWidth === 0
          ? childWidth // First item in row (no gap before it)
          : currentRowWidth + gap + childWidth; // Add gap + item width

      if (widthNeeded > availableWidth && currentRowWidth > 0) {
        // Doesn't fit - finalize current row and start new row
        if (rowCount > 0) totalHeight += gap; // Add gap between rows
        totalHeight += currentRowHeight;
        rowCount++;

        // Start new row with this child
        currentRowWidth = childWidth;
        currentRowHeight = childHeight;
      } else {
        // Fits in current row - add it
        currentRowWidth = widthNeeded;
        currentRowHeight = Math.max(currentRowHeight, childHeight);
      }

      // If this is the last item, finalize the last row
      if (index === children.length - 1 && currentRowHeight > 0) {
        if (rowCount > 0) totalHeight += gap;
        totalHeight += currentRowHeight;
        rowCount++;
      }
    });

    const calculatedHeight = totalHeight + padding * 2 + borderWidth;

    console.log(
      "🔷 Grid layout height:",
      "\n  children:",
      children.length,
      "\n  availableWidth:",
      availableWidth,
      "\n  rowCount:",
      rowCount,
      "\n  totalHeight:",
      totalHeight,
      "\n  calculatedHeight:",
      calculatedHeight,
      "\n  frameWidth:",
      frameWidth,
      "\n  childWidths:",
      children.map((c) => c.width),
      "\n  childHeights:",
      children.map((c) => c.height)
    );

    return { width: frameWidth, height: calculatedHeight };
  }
}

interface SingleObjectToolbarWrapperProps {
  activeObject: CanvasObjectType | null;
  objects: CanvasObjectType[];
  isMultiSelect: boolean;
  isDraggingObject: boolean;
  isResizing: boolean;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  onToolbarHoverEnter: () => void;
  onToolbarHoverLeave: () => void;
  onZoomToFit: (id: string) => void;
  onColorTagChange: (id: string) => void;
  onAIPrompt: (id: string, prompt: string) => void;
  onConvertToVideo: (id: string) => void;
  onRerun: (id: string) => void;
  onReframe: (id: string) => void;
  onUnframe: (id: string) => void;
  onToggleAutolayout: (id: string) => void;
  onMore: (id: string) => void;
  onDownload: (id: string) => void;
}

export function SingleObjectToolbarWrapper({
  activeObject,
  objects,
  isMultiSelect,
  isDraggingObject,
  isResizing,
  zoomLevel,
  panOffset,
  onToolbarHoverEnter,
  onToolbarHoverLeave,
  onZoomToFit,
  onColorTagChange,
  onAIPrompt,
  onConvertToVideo,
  onRerun,
  onReframe,
  onUnframe,
  onToggleAutolayout,
  onMore,
  onDownload,
}: SingleObjectToolbarWrapperProps) {
  if (!activeObject || isMultiSelect || isDraggingObject) {
    return null;
  }

  // ALWAYS hide toolbar during resize to prevent interference with resize handles
  if (isResizing) {
    return null;
  }

  if (!shouldShowToolbar(activeObject.type)) {
    return null;
  }

  // Don't show toolbar for generating placeholders
  if (activeObject.state === "generating") {
    return null;
  }

  // Don't show toolbar during agent frame creation
  if (activeObject.type === "frame") {
    const frameObj = activeObject as any;
    if (frameObj.isAgentCreating) {
      return null;
    }
  }

  // Get actual rendered dimensions (important for autolayout frames)
  const { width: actualWidth, height: actualHeight } = getActualDimensions(
    activeObject,
    objects
  );

  const toolbarTop =
    activeObject.y * zoomLevel +
    panOffset.y +
    actualHeight * zoomLevel +
    getToolbarGap(zoomLevel);

  console.log(
    "🎯 Toolbar positioning:",
    "\n  objectId:",
    activeObject.id,
    "\n  objectY:",
    activeObject.y,
    "\n  objectHeight:",
    activeObject.height,
    "\n  actualHeight:",
    actualHeight,
    "\n  zoomLevel:",
    zoomLevel,
    "\n  panOffsetY:",
    panOffset.y,
    "\n  calculatedTop:",
    toolbarTop
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1, ease: "easeOut" }}
        style={{
          position: "absolute",
          left:
            activeObject.x * zoomLevel +
            panOffset.x +
            (actualWidth * zoomLevel) / 2,
          top: toolbarTop,
          pointerEvents: "none",
          zIndex: 10000,
        }}
        onMouseEnter={onToolbarHoverEnter}
        onMouseLeave={onToolbarHoverLeave}
      >
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            justifyContent: "center",
            transform: "translate(-50%, 0)",
          }}
        >
          <ContextToolbar
            objectTypes={[activeObject.type]}
            isMultiSelect={false}
            objectWidth={activeObject.width * zoomLevel}
            activeObject={activeObject}
            onZoomToFit={() => onZoomToFit(activeObject.id)}
            colorTag={activeObject.colorTag || "none"}
            onColorTagChange={() => onColorTagChange(activeObject.id)}
            onAIPrompt={(prompt) => onAIPrompt(activeObject.id, prompt)}
            onConvertToVideo={() => onConvertToVideo(activeObject.id)}
            onRerun={
              activeObject.type !== "frame"
                ? () => onRerun(activeObject.id)
                : undefined
            }
            onReframe={() =>
              activeObject.type === "frame"
                ? onUnframe(activeObject.id)
                : onReframe(activeObject.id)
            }
            onToggleAutolayout={
              activeObject.type === "frame"
                ? () => onToggleAutolayout(activeObject.id)
                : undefined
            }
            onMore={() => onMore(activeObject.id)}
            onDownload={() => onDownload(activeObject.id)}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
