import { motion } from "motion/react";

interface SelectionBoundsProps {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  zoomLevel: number;
  onResizeStart?: (corner: string, e: React.MouseEvent) => void;
}

export function SelectionBounds({
  minX,
  minY,
  maxX,
  maxY,
  zoomLevel,
  onResizeStart,
}: SelectionBoundsProps) {
  const width = maxX - minX;
  const height = maxY - minY;
  const viewportBorderWidth = 2 / zoomLevel;
  const viewportHandleSize = 12 / zoomLevel;
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
        borderWidth: viewportBorderWidth,
        borderRadius: viewportBorderRadius,
        zIndex: 500, // Higher z-index to ensure selection is visible above all objects
      }}
      className="border-blue-500"
    >
      {/* Corner handles - ALWAYS show for multi-selection */}
      {onResizeStart && (
        <>
          {/* Top-left */}
          <div
            className="absolute bg-blue-500 rounded-full cursor-nwse-resize hover:bg-blue-600"
            style={{
              top: -viewportHandleSize / 2,
              left: -viewportHandleSize / 2,
              width: viewportHandleSize,
              height: viewportHandleSize,
              pointerEvents: "auto",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart("top-left", e);
            }}
          />
          {/* Top-right */}
          <div
            className="absolute bg-blue-500 rounded-full cursor-nesw-resize hover:bg-blue-600"
            style={{
              top: -viewportHandleSize / 2,
              right: -viewportHandleSize / 2,
              width: viewportHandleSize,
              height: viewportHandleSize,
              pointerEvents: "auto",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart("top-right", e);
            }}
          />
          {/* Bottom-left */}
          <div
            className="absolute bg-blue-500 rounded-full cursor-nesw-resize hover:bg-blue-600"
            style={{
              bottom: -viewportHandleSize / 2,
              left: -viewportHandleSize / 2,
              width: viewportHandleSize,
              height: viewportHandleSize,
              pointerEvents: "auto",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart("bottom-left", e);
            }}
          />
          {/* Bottom-right */}
          <div
            className="absolute bg-blue-500 rounded-full cursor-nwse-resize hover:bg-blue-600"
            style={{
              bottom: -viewportHandleSize / 2,
              right: -viewportHandleSize / 2,
              width: viewportHandleSize,
              height: viewportHandleSize,
              pointerEvents: "auto",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart("bottom-right", e);
            }}
          />
        </>
      )}
    </motion.div>
  );
}
