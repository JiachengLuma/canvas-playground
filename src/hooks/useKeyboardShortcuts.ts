/**
 * useKeyboardShortcuts Hook
 * Manages keyboard event listeners for canvas shortcuts
 */

import { useEffect } from "react";

export interface KeyboardShortcutsConfig {
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onToggleFrameDrawing?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoomToFit?: () => void;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const { onDelete, onDuplicate, onSelectAll, onDeselectAll, onToggleFrameDrawing, onUndo, onRedo, onZoomToFit } = config;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Z for undo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey && onUndo) {
        e.preventDefault();
        onUndo();
        return;
      }

      // Cmd/Ctrl + Shift + Z for redo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey && onRedo) {
        e.preventDefault();
        onRedo();
        return;
      }

      // Delete or Backspace
      if ((e.key === "Delete" || e.key === "Backspace") && onDelete) {
        e.preventDefault();
        onDelete();
      }

      // Cmd/Ctrl + D for duplicate
      if ((e.metaKey || e.ctrlKey) && e.key === "d" && onDuplicate) {
        e.preventDefault();
        onDuplicate();
      }

      // Cmd/Ctrl + A for select all
      if ((e.metaKey || e.ctrlKey) && e.key === "a" && onSelectAll) {
        e.preventDefault();
        onSelectAll();
      }

      // Escape for deselect all
      if (e.key === "Escape" && onDeselectAll) {
        e.preventDefault();
        onDeselectAll();
      }

      // F for frame drawing mode
      if (e.key === "f" && !e.metaKey && !e.ctrlKey && onToggleFrameDrawing) {
        e.preventDefault();
        onToggleFrameDrawing();
      }

      // Space for zoom to fit selected object
      if (e.key === " " && !e.metaKey && !e.ctrlKey && onZoomToFit) {
        e.preventDefault();
        onZoomToFit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDelete, onDuplicate, onSelectAll, onDeselectAll, onToggleFrameDrawing, onUndo, onRedo, onZoomToFit]);
}

