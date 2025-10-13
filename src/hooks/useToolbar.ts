/**
 * useToolbar Hook
 * Manages toolbar visibility and choreography
 */

import { useState, useRef } from "react";
import {
  TOOLBAR_DEACTIVATION_DELAY_MS,
} from "../config/constants";

export interface ToolbarState {
  activeToolbarId: string | null;
  setActiveToolbarId: React.Dispatch<React.SetStateAction<string | null>>;
  toolbarSystemActivated: boolean;
  setToolbarSystemActivated: React.Dispatch<React.SetStateAction<boolean>>;
  handleHoverEnter: () => void;
  handleHoverLeave: () => void;
}

export function useToolbar(): ToolbarState {
  const [activeToolbarId, setActiveToolbarId] = useState<string | null>(null);
  const [toolbarSystemActivated, setToolbarSystemActivated] = useState(false);

  const toolbarDeactivationTimeout = useRef<NodeJS.Timeout | null>(null);
  const systemResetTimeout = useRef<NodeJS.Timeout | null>(null);
  const isHoveringAnyObject = useRef(false);

  const handleHoverEnter = () => {
    isHoveringAnyObject.current = true;
    
    // Clear any pending deactivation
    if (toolbarDeactivationTimeout.current) {
      clearTimeout(toolbarDeactivationTimeout.current);
      toolbarDeactivationTimeout.current = null;
    }

    // Clear any pending system reset
    if (systemResetTimeout.current) {
      clearTimeout(systemResetTimeout.current);
      systemResetTimeout.current = null;
    }
  };

  const handleHoverLeave = () => {
    isHoveringAnyObject.current = false;

    // Add a small grace period to allow moving mouse to toolbar/drag handle
    // If mouse enters toolbar/handle, this timeout will be cleared
    toolbarDeactivationTimeout.current = setTimeout(() => {
      setActiveToolbarId(null);

      // After hiding toolbar, wait 1 second before resetting the system
      // This means: hover away for >1s = next hover will have 300ms delay again
      systemResetTimeout.current = setTimeout(() => {
        setToolbarSystemActivated(false);
      }, 1000);
    }, 150); // 150ms grace period
  };

  return {
    activeToolbarId,
    setActiveToolbarId,
    toolbarSystemActivated,
    setToolbarSystemActivated,
    handleHoverEnter,
    handleHoverLeave,
  };
}

