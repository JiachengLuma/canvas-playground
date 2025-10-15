import { motion } from "motion/react";
import { useState } from "react";

interface DragHandleProps {
  x: number; // Screen position
  y: number; // Screen position
  width: number; // Selection width in screen pixels
  height: number; // Selection height in screen pixels
  rotation: number; // Selection rotation in degrees
  side?: "left" | "right"; // Which side to show the handle on
  selectionColor: string;
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
  side = "right",
  selectionColor,
  onDragStart,
  onMouseEnter,
  onMouseLeave,
}: DragHandleProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Width in screen space (constant visual size, matches corner handle)
  const handleWidth = 10;

  // Height is proportional to object height with smart constraints
  // - Start with 30% of object height
  // - Min: 16px for usability (reduced to avoid blocking corner handles)
  // - Max: 60px to avoid being too large
  // - CRITICAL: Never exceed 50% of object height to avoid blocking corner handles
  const minHeight = 16;
  const maxHeight = 60;
  const proportionalHeight = height * 0.3;
  const maxAllowedHeight = height * 0.5; // Never more than 50% to keep clear of corners

  const handleHeight = Math.max(
    minHeight,
    Math.min(maxHeight, proportionalHeight, maxAllowedHeight)
  );

  // Border properties - constant in screen space (like corner handles appear)
  // Drag handle is outside transform, so use constant values for constant visual appearance
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

  // Calculate horizontal position based on side
  const leftPosition =
    side === "left"
      ? x - handleWidth / 2 // Left edge
      : x + width - handleWidth / 2; // Right edge (default)

  return (
    <motion.div
      key={side} // Key ensures smooth transition when side changes
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        scale: isHovered ? 1.1 : 1,
      }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: { duration: 0.12, ease: "easeOut" },
        scale: { duration: 0.12, ease: "easeOut" },
      }}
      style={{
        position: "absolute",
        left: leftPosition,
        top: y + height / 2 - handleHeight / 2, // Center vertically
        width: handleWidth,
        height: handleHeight,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center",
        cursor: "grab",
        zIndex: 10001,
        borderWidth: handleBorderWidth,
        borderRadius: handleBorderRadius,
        borderColor: selectionColor,
        borderStyle: "solid",
        boxSizing: "border-box",
        backgroundColor: "white",
      }}
      onMouseDown={onDragStart}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="hover:bg-gray-50 active:cursor-grabbing shadow-sm"
    />
  );
}
