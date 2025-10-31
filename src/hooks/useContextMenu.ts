/**
 * useContextMenu Hook
 * Manages context menu state
 */

import { useState } from "react";

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  canvasPosition: { x: number; y: number };
}

export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    canvasPosition: { x: 0, y: 0 },
  });

  const openContextMenu = (
    x: number,
    y: number,
    canvasPosition: { x: number; y: number }
  ) => {
    setContextMenu({ isOpen: true, x, y, canvasPosition });
  };

  const closeContextMenu = () => {
    setContextMenu((prev) => ({
      isOpen: false,
      x: 0,
      y: 0,
      canvasPosition: prev.canvasPosition,
    }));
  };

  return {
    contextMenu,
    setContextMenu,
    openContextMenu,
    closeContextMenu,
  };
};


