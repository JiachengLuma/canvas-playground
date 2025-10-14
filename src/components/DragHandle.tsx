import { motion } from "motion/react";
import { useState } from "react";

interface DragHandleProps {
  x: number; // Screen position
  y: number; // Screen position
  width: number; // Selection width in screen pixels
  height: number; // Selection height in screen pixels
  rotation: number; // Selection rotation in degrees
  onDragStart: (e: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function DragHandle({
  x,
  y,
  width,
  height,
  rotation,
  onDragStart,
  onMouseEnter,
  onMouseLeave,
}: DragHandleProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Width in screen space (constant visual size)
  // Corner handles appear as 10/zoomLevel in screen pixels, so at 1x zoom they're 10px
  // We want to match that 10px appearance
  const handleWidth = 10;

  // Height is 30% of object height, with min/max constraints
  const minHeight = 24;
  const maxHeight = 80;
  const calculatedHeight = height * 0.3;
  const handleHeight = Math.max(
    minHeight,
    Math.min(maxHeight, calculatedHeight)
  );

  // Border properties in screen space to match corner handles at 1x zoom
  const handleBorderWidth = 2;
  const handleBorderRadius = 5;

  const handleMouseEnter = () => {
    setIsHovered(true);
    onMouseEnter?.();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onMouseLeave?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1 }}
      animate={{
        opacity: 1,
        scale: isHovered ? 1.15 : 1,
      }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: { duration: 0.1, ease: "easeOut" },
        scale: { duration: 0.15, ease: "easeOut" },
      }}
      style={{
        position: "absolute",
        // Position on the right edge, horizontally centered
        left: x + width - handleWidth / 2,
        top: y + height / 2 - handleHeight / 2, // Center vertically
        width: handleWidth,
        height: handleHeight,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center",
        cursor: "grab",
        zIndex: 10001,
        borderWidth: handleBorderWidth,
        borderRadius: handleBorderRadius,
        boxSizing: "border-box",
      }}
      onMouseDown={onDragStart}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="bg-white border-blue-500 border-solid hover:bg-gray-50 active:cursor-grabbing shadow-sm"
    />
  );
}
