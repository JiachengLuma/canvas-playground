/**
 * useFrameDrawing Hook
 * Manages frame drawing state and mode
 */

import { useState } from "react";

export const useFrameDrawing = () => {
  const [isDrawingFrame, setIsDrawingFrame] = useState(false);
  const [frameDrawStart, setFrameDrawStart] = useState({ x: 0, y: 0 });
  const [frameDrawCurrent, setFrameDrawCurrent] = useState({ x: 0, y: 0 });

  const toggleFrameDrawing = () => {
    setIsDrawingFrame((prev) => !prev);
    // Reset positions when toggling off
    if (isDrawingFrame) {
      setFrameDrawStart({ x: 0, y: 0 });
      setFrameDrawCurrent({ x: 0, y: 0 });
    }
  };

  const resetFrameDrawing = () => {
    setFrameDrawStart({ x: 0, y: 0 });
    setFrameDrawCurrent({ x: 0, y: 0 });
  };

  return {
    isDrawingFrame,
    setIsDrawingFrame,
    frameDrawStart,
    setFrameDrawStart,
    frameDrawCurrent,
    setFrameDrawCurrent,
    toggleFrameDrawing,
    resetFrameDrawing,
  };
};


