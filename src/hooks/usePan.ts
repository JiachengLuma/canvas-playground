/**
 * usePan Hook
 * Manages canvas panning state
 */

import { useState, useRef } from "react";

export interface PanState {
  isPanning: boolean;
  startPan: (x: number, y: number) => void;
  updatePan: (x: number, y: number, setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>) => void;
  endPan: () => void;
}

export function usePan(): PanState {
  const [isPanning, setIsPanning] = useState(false);
  const panStartPos = useRef({ x: 0, y: 0 });

  const startPan = (x: number, y: number) => {
    setIsPanning(true);
    panStartPos.current = { x, y };
  };

  const updatePan = (
    x: number,
    y: number,
    setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  ) => {
    if (!isPanning) return;

    const dx = x - panStartPos.current.x;
    const dy = y - panStartPos.current.y;

    setPanOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));

    panStartPos.current = { x, y };
  };

  const endPan = () => {
    setIsPanning(false);
  };

  return {
    isPanning,
    startPan,
    updatePan,
    endPan,
  };
}

