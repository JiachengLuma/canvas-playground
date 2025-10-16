/**
 * useWheel Hook
 * Manages wheel event handling for zoom and pan
 */

import { useEffect } from "react";

interface UseWheelParams {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  setZoomLevel: (level: number | ((prev: number) => number)) => void;
  setPanOffset: (
    offset: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })
  ) => void;
}

export const useWheel = ({
  canvasRef,
  zoomLevel,
  panOffset,
  setZoomLevel,
  setPanOffset,
}: UseWheelParams) => {
  // Setup wheel event listener with passive: false to allow preventDefault
  // This fixes the "Unable to preventDefault inside passive event listener" warning
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Zoom (pinch-to-zoom or Ctrl/Cmd + scroll)
        e.preventDefault();

        const rect = canvasEl.getBoundingClientRect();

        // Get mouse position relative to canvas
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate zoom delta
        const delta = -e.deltaY * 0.01;
        const newZoomLevel = Math.max(
          0.1,
          Math.min(4, zoomLevel + delta * 0.5)
        );

        // Calculate the point in canvas space that the mouse is over
        const canvasPointX = (mouseX - panOffset.x) / zoomLevel;
        const canvasPointY = (mouseY - panOffset.y) / zoomLevel;

        // Calculate new pan offset to keep the canvas point under the mouse
        const newPanX = mouseX - canvasPointX * newZoomLevel;
        const newPanY = mouseY - canvasPointY * newZoomLevel;

        setZoomLevel(newZoomLevel);
        setPanOffset({ x: newPanX, y: newPanY });
      } else {
        // Pan with trackpad (two-finger scroll) or mouse wheel
        e.preventDefault();

        // Use deltaX for horizontal scrolling, deltaY for vertical
        const panSpeed = 1.0;

        setPanOffset((prev) => ({
          x: prev.x - e.deltaX * panSpeed,
          y: prev.y - e.deltaY * panSpeed,
        }));
      }
    };

    // Add wheel listener with passive: false to allow preventDefault
    canvasEl.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvasEl.removeEventListener("wheel", handleWheel);
    };
  }, [zoomLevel, panOffset, setZoomLevel, setPanOffset, canvasRef]);
};

