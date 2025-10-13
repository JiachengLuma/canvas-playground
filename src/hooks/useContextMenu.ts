/**
 * useContextMenu Hook
 * Manages context menu state
 */

import { useState } from "react";

export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
  }>({ isOpen: false, x: 0, y: 0 });

  const openContextMenu = (x: number, y: number) => {
    setContextMenu({ isOpen: true, x, y });
  };

  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, x: 0, y: 0 });
  };

  return {
    contextMenu,
    setContextMenu,
    openContextMenu,
    closeContextMenu,
  };
};


