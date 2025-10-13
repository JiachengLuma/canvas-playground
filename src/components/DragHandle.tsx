import { motion } from "motion/react";

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
  // Adaptive height: max 60px, but if that's >= half the artifact height, use half height
  const maxHeight = 60;
  const halfHeight = height / 2;
  const handleHeight = maxHeight >= halfHeight ? halfHeight : maxHeight;

  // Adaptive width: shrink width for small handles
  // Max 8px, but scale down to 4px when handle is very small
  const handleWidth = handleHeight < 30 ? 4 : handleHeight < 45 ? 6 : 8;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: x + width + 5,
        top: y + height / 2 - handleHeight / 2, // Center vertically
        width: handleWidth,
        height: handleHeight,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center",
        cursor: "grab",
        zIndex: 10001,
      }}
      onMouseDown={onDragStart}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="bg-blue-500 rounded-full hover:bg-blue-600 active:cursor-grabbing shadow-md"
    />
  );
}
