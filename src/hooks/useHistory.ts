/**
 * useHistory Hook
 * Manages undo/redo history for canvas objects
 */

import { useState, useRef, useCallback } from "react";
import { CanvasObject } from "../types";

const MAX_HISTORY = 50; // Keep last 50 states

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  pushState: (objects: CanvasObject[]) => void;
  reset: (objects: CanvasObject[]) => void;
}

export function useHistory(
  initialObjects: CanvasObject[],
  onRestore: (objects: CanvasObject[]) => void
): HistoryState {
  const [historyIndex, setHistoryIndex] = useState(0);
  const history = useRef<CanvasObject[][]>([initialObjects]);
  const isRestoring = useRef(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.current.length - 1;

  const pushState = useCallback((objects: CanvasObject[]) => {
    // Don't record if we're restoring from history
    if (isRestoring.current) return;

    // Remove any future states if we're not at the end
    if (historyIndex < history.current.length - 1) {
      history.current = history.current.slice(0, historyIndex + 1);
    }

    // Add new state
    history.current.push(JSON.parse(JSON.stringify(objects))); // Deep clone

    // Limit history size
    if (history.current.length > MAX_HISTORY) {
      history.current.shift();
    } else {
      setHistoryIndex(history.current.length - 1);
    }
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (!canUndo) return;

    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    
    isRestoring.current = true;
    onRestore(JSON.parse(JSON.stringify(history.current[newIndex])));
    isRestoring.current = false;
  }, [historyIndex, canUndo, onRestore]);

  const redo = useCallback(() => {
    if (!canRedo) return;

    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    
    isRestoring.current = true;
    onRestore(JSON.parse(JSON.stringify(history.current[newIndex])));
    isRestoring.current = false;
  }, [historyIndex, canRedo, onRestore]);

  const reset = useCallback((objects: CanvasObject[]) => {
    history.current = [JSON.parse(JSON.stringify(objects))];
    setHistoryIndex(0);
  }, []);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
    reset,
  };
}


