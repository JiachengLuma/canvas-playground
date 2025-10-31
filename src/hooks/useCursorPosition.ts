/*
 * useCursorPosition Hook
 * Tracks the last known cursor position in both screen and canvas coordinates.
 */

import { useState, useCallback } from "react";

export interface CursorPosition {
  screen: { x: number; y: number };
  canvas: { x: number; y: number };
}

export const useCursorPosition = () => {
  const [position, setPosition] = useState<CursorPosition | null>(null);

  const updateCursorPosition = useCallback((pos: CursorPosition) => {
    setPosition((prev) => {
      if (
        prev &&
        prev.screen.x === pos.screen.x &&
        prev.screen.y === pos.screen.y &&
        prev.canvas.x === pos.canvas.x &&
        prev.canvas.y === pos.canvas.y
      ) {
        return prev;
      }
      return pos;
    });
  }, []);

  return {
    cursorPosition: position,
    updateCursorPosition,
  };
};
