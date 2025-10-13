/**
 * Canvas Native Buttons Component
 * Buttons for creating native canvas objects (Text, Shape, etc.)
 */

import { Button } from "../ui/button";
import { CanvasNativeType } from "../../types";

interface CanvasNativeButtonsProps {
  onAdd: (type: CanvasNativeType) => void;
}

export function CanvasNativeButtons({ onAdd }: CanvasNativeButtonsProps) {
  const nativeTypes: { type: CanvasNativeType; label: string }[] = [
    { type: "text", label: "Text" },
    { type: "shape", label: "Shape" },
    { type: "doodle", label: "Doodle" },
    { type: "sticky", label: "Sticky" },
    { type: "link", label: "Link" },
    { type: "pdf", label: "PDF" },
  ];

  return (
    <>
      {nativeTypes.map(({ type, label }) => (
        <Button
          key={type}
          variant="outline"
          size="sm"
          onClick={() => onAdd(type)}
        >
          {label}
        </Button>
      ))}
    </>
  );
}
