import { motion } from "motion/react";

interface FrameDrawingBoxProps {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  zoomLevel: number;
}

export function FrameDrawingBox({
  startX,
  startY,
  currentX,
  currentY,
  zoomLevel,
}: FrameDrawingBoxProps) {
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  // Since FrameDrawingBox is inside the transformed container,
  // border width and radius need to compensate for the zoom
  const viewportBorderWidth = 2 / zoomLevel;
  const viewportBorderRadius = 10 / zoomLevel;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        pointerEvents: "none",
        borderWidth: viewportBorderWidth,
        borderRadius: viewportBorderRadius,
        backgroundColor: "#f6f6f6",
      }}
      className="border-gray-400 border-dashed"
    >
      {/* Frame label hint */}
      <div
        style={{
          position: "absolute",
          top: -20 / zoomLevel,
          left: 4 / zoomLevel,
          fontSize: `${12 / zoomLevel}px`,
          color: "rgba(0, 0, 0, 0.5)",
          lineHeight: `${16 / zoomLevel}px`,
          fontFamily: "Graphik, sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        Frame
      </div>
    </motion.div>
  );
}
