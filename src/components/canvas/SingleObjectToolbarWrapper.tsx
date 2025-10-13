/**
 * Single Object Toolbar Wrapper
 * Handles positioning and animation of the context toolbar for single-selected objects
 */

import { motion, AnimatePresence } from "motion/react";
import { ContextToolbar } from "../ContextToolbar";
import { CanvasObject as CanvasObjectType, ColorTag } from "../../types";
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
    return { width: maxWidth, height: totalHeight };
  } else {
    // grid - calculate actual wrapped dimensions
    const frameWidth = obj.width;
    const maxChildWidth = Math.max(...children.map((child) => child.width));
    const maxChildHeight = Math.max(...children.map((child) => child.height));

    // Calculate how many items fit per row based on frame width
    // Account for 1px border on each side (2px total) due to box-sizing: border-box
    const borderWidth = 2;
    const availableWidth = frameWidth - padding * 2 - borderWidth;
    const itemWidthWithGap = maxChildWidth + gap;
    const itemsPerRow = Math.max(
      1,
      Math.floor((availableWidth + gap) / itemWidthWithGap)
    );

    // Calculate number of rows
    const numRows = Math.ceil(children.length / itemsPerRow);

    // Calculate total height with all rows
    const totalHeight =
      maxChildHeight * numRows +
      gap * (numRows - 1) +
      padding * 2 +
      borderWidth;

    return { width: frameWidth, height: totalHeight };
  }
}

interface SingleObjectToolbarWrapperProps {
  activeObject: CanvasObjectType | null;
  objects: CanvasObjectType[];
  selectedIds: string[];
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
  selectedIds,
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

  // Hide toolbar during resize UNLESS it's an autolayout frame (needs to track height changes)
  const isAutolayoutFrame =
    activeObject.type === "frame" && (activeObject as any).autoLayout;
  if (isResizing && !isAutolayoutFrame) {
    return null;
  }

  if (!shouldShowToolbar(activeObject.type)) {
    return null;
  }

  // Don't show toolbar for generating placeholders
  if (activeObject.state === "generating") {
    return null;
  }

  // Get actual rendered dimensions (important for autolayout frames)
  const { width: actualWidth, height: actualHeight } = getActualDimensions(
    activeObject,
    objects
  );

  // Check if the active object is selected
  const isSelected = selectedIds.includes(activeObject.id);

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
          top:
            activeObject.y * zoomLevel +
            panOffset.y +
            actualHeight * zoomLevel +
            getToolbarGap(zoomLevel),
          pointerEvents: "none",
          zIndex: 10000,
        }}
        onMouseEnter={onToolbarHoverEnter}
        onMouseLeave={() => {
          // Only hide toolbar on hover leave if the object is NOT selected
          // Selected objects should keep their toolbar visible
          if (!isSelected) {
            onToolbarHoverLeave();
          }
        }}
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
