import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "./ui/button";

interface ZoomControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export function ZoomControls({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: ZoomControlsProps) {
  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-2 flex items-center gap-2 border border-border">
      <Button
        variant="ghost"
        size="sm"
        onClick={onZoomOut}
        disabled={zoomLevel <= 0.25}
        title="Zoom out"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>

      <button
        onClick={onResetZoom}
        className="px-3 py-1 hover:bg-accent rounded transition-colors min-w-[60px]"
        title="Reset zoom"
      >
        <span className="tabular-nums">{Math.round(zoomLevel * 100)}%</span>
      </button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onZoomIn}
        disabled={zoomLevel >= 4}
        title="Zoom in"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        variant="ghost"
        size="sm"
        onClick={onResetZoom}
        title="Fit to screen"
      >
        <Maximize className="w-4 h-4" />
      </Button>
    </div>
  );
}
