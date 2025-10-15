import { motion } from "motion/react";

interface SelectionBoxProps {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  zoomLevel: number;
  selectionColor: string;
}

export function SelectionBox({
  startX,
  startY,
  currentX,
  currentY,
  zoomLevel,
  selectionColor,
}: SelectionBoxProps) {
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  // Since SelectionBox is now inside the transformed container,
  // border width and radius need to compensate for the zoom
  const viewportBorderWidth = 2 / zoomLevel;
  const viewportBorderRadius = 4 / zoomLevel;

  // Convert rgb/rgba to rgba with 10% opacity for background
  const getTransparentBackground = (color: string) => {
    // Extract RGB values from rgb(r g b) or rgb(r, g, b) format
    const match = color.match(/rgb\((\d+)\s*,?\s*(\d+)\s*,?\s*(\d+)\)/);
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, 0.1)`;
    }
    // Fallback to black with transparency
    return "rgba(0, 0, 0, 0.1)";
  };

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
        borderColor: selectionColor,
        borderStyle: "solid",
        borderRadius: viewportBorderRadius,
        backgroundColor: getTransparentBackground(selectionColor),
      }}
    />
  );
}
