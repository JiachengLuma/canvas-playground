import { motion } from "motion/react";

interface SelectionBoxProps {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  zoomLevel: number;
}

export function SelectionBox({
  startX,
  startY,
  currentX,
  currentY,
  zoomLevel,
}: SelectionBoxProps) {
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  // Since SelectionBox is now inside the transformed container,
  // border width and radius need to compensate for the zoom
  const viewportBorderWidth = 2 / zoomLevel;
  const viewportBorderRadius = 4 / zoomLevel;

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
      }}
      className="border-blue-500 bg-blue-500/10"
    />
  );
}
