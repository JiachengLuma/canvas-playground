import { motion } from "motion/react";
import { useState, useEffect } from "react";

interface SelectionBoundsProps {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  zoomLevel: number;
  selectionColor: string;
  onResizeStart?: (corner: string, e: React.MouseEvent) => void;
}

export function SelectionBounds({
  minX,
  minY,
  maxX,
  maxY,
  zoomLevel,
  selectionColor,
  onResizeStart,
}: SelectionBoundsProps) {
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Listen for Shift key to show proportional scale mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
  const width = maxX - minX;
  const height = maxY - minY;
  // Elements inside transform need /zoomLevel to compensate for scaling
  const viewportBorderWidth = 2 / zoomLevel; // Will appear as 2px on screen after transform
  const viewportHandleSize = 10 / zoomLevel;
  const viewportHandleBorderWidth = 2 / zoomLevel; // Will appear as 2px on screen after transform
  const viewportBorderRadius = 5 / zoomLevel;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: minX,
        top: minY,
        width,
        height,
        pointerEvents: "none",
        // Use outline instead of border so it renders outside the box
        outline: `${viewportBorderWidth}px solid ${selectionColor}`,
        outlineOffset: 0,
        borderRadius: viewportBorderRadius,
        zIndex: 500, // Higher z-index to ensure selection is visible above all objects
      }}
    >
      {/* Corner handles - ALWAYS show for multi-selection */}
      {onResizeStart && (
        <>
          {/* Top-left */}
          <motion.div
            className="absolute bg-white cursor-nwse-resize hover:bg-gray-50"
            initial={false}
            animate={{
              borderRadius: isShiftPressed ? "50%" : "20%",
            }}
            transition={{
              duration: 0.15,
              ease: "easeInOut",
            }}
            style={{
              top: -viewportHandleSize / 2,
              left: -viewportHandleSize / 2,
              width: viewportHandleSize,
              height: viewportHandleSize,
              borderWidth: viewportHandleBorderWidth,
              borderColor: selectionColor,
              borderStyle: "solid",
              pointerEvents: "auto",
              boxSizing: "border-box",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onResizeStart("top-left", e);
            }}
          />
          {/* Top-right */}
          <motion.div
            className="absolute bg-white cursor-nesw-resize hover:bg-gray-50"
            initial={false}
            animate={{
              borderRadius: isShiftPressed ? "50%" : "20%",
            }}
            transition={{
              duration: 0.15,
              ease: "easeInOut",
            }}
            style={{
              top: -viewportHandleSize / 2,
              right: -viewportHandleSize / 2,
              width: viewportHandleSize,
              height: viewportHandleSize,
              borderWidth: viewportHandleBorderWidth,
              borderColor: selectionColor,
              borderStyle: "solid",
              pointerEvents: "auto",
              boxSizing: "border-box",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onResizeStart("top-right", e);
            }}
          />
          {/* Bottom-left */}
          <motion.div
            className="absolute bg-white cursor-nesw-resize hover:bg-gray-50"
            initial={false}
            animate={{
              borderRadius: isShiftPressed ? "50%" : "20%",
            }}
            transition={{
              duration: 0.15,
              ease: "easeInOut",
            }}
            style={{
              bottom: -viewportHandleSize / 2,
              left: -viewportHandleSize / 2,
              width: viewportHandleSize,
              height: viewportHandleSize,
              borderWidth: viewportHandleBorderWidth,
              borderColor: selectionColor,
              borderStyle: "solid",
              pointerEvents: "auto",
              boxSizing: "border-box",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onResizeStart("bottom-left", e);
            }}
          />
          {/* Bottom-right */}
          <motion.div
            className="absolute bg-white cursor-nwse-resize hover:bg-gray-50"
            initial={false}
            animate={{
              borderRadius: isShiftPressed ? "50%" : "20%",
            }}
            transition={{
              duration: 0.15,
              ease: "easeInOut",
            }}
            style={{
              bottom: -viewportHandleSize / 2,
              right: -viewportHandleSize / 2,
              width: viewportHandleSize,
              height: viewportHandleSize,
              borderWidth: viewportHandleBorderWidth,
              borderColor: selectionColor,
              borderStyle: "solid",
              pointerEvents: "auto",
              boxSizing: "border-box",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onResizeStart("bottom-right", e);
            }}
          />
        </>
      )}
    </motion.div>
  );
}
