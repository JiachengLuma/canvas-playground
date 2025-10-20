/**
 * Canvas Layer Component
 * Main canvas rendering layer with all interactions, objects, and overlays
 */

import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { CanvasObject as CanvasObjectType, ColorTag } from "../../types";
import { ObjectsLayer } from "./ObjectsLayer";
import { SelectionBounds } from "../SelectionBounds";
import { SelectionBox } from "../SelectionBox";
import { FrameDrawingBox } from "../FrameDrawingBox";
import { DragHandle } from "../DragHandle";
import { UnifiedToolbarWrapper } from "./UnifiedToolbarWrapper";
import { shouldShowDragHandle } from "../../config/behaviorConfig";
import {
  shouldShowDragHandleUI,
  getSelectionGap,
} from "../../utils/canvasUtils";

export interface CanvasLayerProps {
  // Canvas ref
  canvasRef: React.RefObject<HTMLDivElement | null>;

  // Canvas state
  objects: CanvasObjectType[];
  zoomLevel: number;
  panOffset: { x: number; y: number };

  // Selection state
  selectedIds: string[];
  isMultiSelect: boolean;
  hoveredBySelectionIds: string[];
  isSelecting: boolean;
  selectionStart: { x: number; y: number };
  selectionCurrent: { x: number; y: number };
  selectionBounds: { minX: number; minY: number; maxX: number; maxY: number };
  selectedObjectTypes: string[];
  multiSelectColorTag: ColorTag;

  // Frame drawing state
  isDrawingFrame: boolean;
  frameDrawStart: { x: number; y: number };
  frameDrawCurrent: { x: number; y: number };

  // Drag state
  isDraggingObject: boolean;
  isResizing: boolean;
  isDraggingHandle: boolean;

  // Toolbar state
  activeObject: CanvasObjectType | null;
  activeToolbarId: string | null;
  toolbarSystemActivated: boolean;

  // Color theme
  selectionColor: string;
  hoverColor: string;

  // Video settings
  videoPauseOnSelect?: boolean;

  // Selection settings
  selectionPaddingMode?: "flush" | "responsive";

  // Label settings
  frameLabelPosition?: "background" | "drag-handle";

  // Event handlers
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onCanvasMouseMove: (e: React.MouseEvent) => void;
  onCanvasMouseUp: () => void;
  onCanvasClick: () => void;
  onCanvasContextMenu: (e: React.MouseEvent) => void;

  // Object event handlers
  onSelect: (id: string, multi: boolean) => void;
  onResizeStart: (corner: string, e: React.MouseEvent) => void;
  onDragStart: (id: string, optionKey: boolean) => void;
  onDrag: (dx: number, dy: number) => void;
  onDragEnd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRotate: (id: string) => void;
  onColorTagChange: (id: string) => void;
  onMultiSelectColorTagChange: () => void; // Multi-select color tag change
  onMultiLabelBgColorChange?: () => void; // Multi-select label bg color change
  onNoteColorChange?: (id: string) => void; // Note color change for sticky notes (handled by note itself)
  onContentUpdate: (id: string, content: string) => void;
  onLabelBgColorChange?: (id: string) => void;
  onNameChange?: (id: string, newName: string) => void;

  // Toolbar handlers
  onSetActiveToolbar: (id: string | null) => void;
  onActivateToolbarSystem: () => void;
  onToolbarHoverEnter: () => void;
  onToolbarHoverLeave: () => void;

  // Toolbar action handlers
  onZoomToFit: (id: string) => void;
  onAIPrompt: (id: string, prompt: string) => void;
  onConvertToVideo: (id: string) => void;
  onRerun: (id: string) => void;
  onReframe: (id: string) => void;
  onUnframe: (id: string) => void;
  onToggleAutolayout: (id: string) => void;
  onMore: (id: string) => void;
  onDownload: (id: string) => void;
  onFrameSelection: () => void;
  onFrameSelectionWithAutolayout: () => void;

  // Drag handle
  onDragHandleStart: (e: React.MouseEvent) => void;
}

export function CanvasLayer({
  canvasRef,
  objects,
  zoomLevel,
  panOffset,
  selectedIds,
  isMultiSelect,
  hoveredBySelectionIds,
  isSelecting,
  selectionStart,
  selectionCurrent,
  selectionBounds,
  selectedObjectTypes,
  multiSelectColorTag,
  isDrawingFrame,
  frameDrawStart,
  frameDrawCurrent,
  isDraggingObject,
  isResizing,
  isDraggingHandle,
  activeObject,
  activeToolbarId,
  toolbarSystemActivated,
  selectionColor,
  hoverColor,
  videoPauseOnSelect = false,
  selectionPaddingMode = "flush",
  frameLabelPosition = "background",
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onCanvasClick,
  onCanvasContextMenu,
  onSelect,
  onResizeStart,
  onDragStart,
  onDrag,
  onDragEnd,
  onDelete,
  onDuplicate,
  onRotate,
  onColorTagChange,
  onMultiSelectColorTagChange,
  onMultiLabelBgColorChange,
  onNoteColorChange,
  onContentUpdate,
  onLabelBgColorChange,
  onNameChange,
  onSetActiveToolbar,
  onActivateToolbarSystem,
  onToolbarHoverEnter,
  onToolbarHoverLeave,
  onZoomToFit,
  onAIPrompt,
  onConvertToVideo,
  onRerun,
  onReframe,
  onUnframe,
  onToggleAutolayout,
  onMore,
  onDownload,
  onFrameSelection,
  onFrameSelectionWithAutolayout,
  onDragHandleStart,
}: CanvasLayerProps) {
  // Track which side the drag handle should appear on based on mouse position
  const [dragHandleSide, setDragHandleSide] = useState<"left" | "right">(
    "right"
  );

  // Track mouse position to determine which edge is being hovered
  useEffect(() => {
    if (!activeObject || isMultiSelect || isDraggingObject || isResizing) {
      setDragHandleSide("right"); // Default to right when not hovering
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Get object bounds in screen space
      const objScreenX = activeObject.x * zoomLevel + panOffset.x;
      const objScreenY = activeObject.y * zoomLevel + panOffset.y;
      const objScreenWidth = activeObject.width * zoomLevel;
      const objScreenHeight = activeObject.height * zoomLevel;

      // Define edge detection zones (20% of width on each side)
      const edgeThreshold = objScreenWidth * 0.3;
      const leftEdgeEnd = objScreenX + edgeThreshold;
      const rightEdgeStart = objScreenX + objScreenWidth - edgeThreshold;

      // Check if mouse is within object bounds
      const isInObjectX =
        e.clientX >= objScreenX && e.clientX <= objScreenX + objScreenWidth;
      const isInObjectY =
        e.clientY >= objScreenY && e.clientY <= objScreenY + objScreenHeight;

      if (isInObjectX && isInObjectY) {
        // Mouse is hovering over the object
        if (e.clientX <= leftEdgeEnd) {
          // Hovering near left edge
          setDragHandleSide("left");
        } else if (e.clientX >= rightEdgeStart) {
          // Hovering near right edge
          setDragHandleSide("right");
        }
        // If in the middle, keep current side
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [
    activeObject,
    zoomLevel,
    panOffset,
    isMultiSelect,
    isDraggingObject,
    isResizing,
  ]);

  // Calculate background size and position based on zoom level and pan offset
  // This makes the dots appear to be part of the canvas coordinate system

  // Level-of-detail system for dots: adjust base spacing to maintain visual density
  // At lower zoom levels, we use larger spacing intervals to prevent overcrowding
  const baseDotSpacing = 20; // Minimum dot spacing
  const targetVisualSpacing = 20; // Target spacing in screen pixels we want to maintain

  // Calculate what spacing we need in canvas coordinates to achieve target visual spacing
  // At zoom 1.0: spacing = 20 (base)
  // At zoom 0.5: spacing = 40 (to keep visual spacing at 20px)
  // At zoom 0.25: spacing = 80 (to keep visual spacing at 20px)
  let dotSpacing = baseDotSpacing;

  // When zoomed out (zoom < 1), multiply spacing to keep visual density reasonable
  if (zoomLevel < 1) {
    // Round to next power of 2 multiplier for clean grid transitions
    const multiplier = Math.pow(
      2,
      Math.ceil(Math.log2(targetVisualSpacing / (baseDotSpacing * zoomLevel)))
    );
    dotSpacing = baseDotSpacing * multiplier;
  }

  const scaledDotSpacing = dotSpacing * zoomLevel;

  // Calculate background position to align with pan offset
  // Use modulo to create seamless tiling effect
  const bgPosX = panOffset.x % scaledDotSpacing;
  const bgPosY = panOffset.y % scaledDotSpacing;

  // Adjust dot opacity based on visual spacing to fade at extreme zoom levels
  const dotOpacity = Math.min(0.2, Math.max(0.05, scaledDotSpacing / 100));

  return (
    <div
      ref={canvasRef}
      className={`absolute inset-0 select-none ${
        isDrawingFrame
          ? "cursor-crosshair"
          : "cursor-grab active:cursor-grabbing"
      }`}
      onMouseDown={onCanvasMouseDown}
      onMouseMove={onCanvasMouseMove}
      onMouseUp={onCanvasMouseUp}
      onClick={onCanvasClick}
      onContextMenu={onCanvasContextMenu}
      style={{
        backgroundImage: `radial-gradient(circle, rgba(0, 0, 0, ${dotOpacity}) 1px, transparent 1px)`,
        backgroundSize: `${scaledDotSpacing}px ${scaledDotSpacing}px`,
        backgroundPosition: `${bgPosX}px ${bgPosY}px`,
        touchAction: "none",
      }}
    >
      {/* Transform wrapper for pan and zoom */}
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Objects Layer */}
        <ObjectsLayer
          objects={objects}
          selectedIds={selectedIds}
          isMultiSelect={isMultiSelect}
          hoveredBySelectionIds={hoveredBySelectionIds}
          isSelecting={isSelecting}
          isDraggingObject={isDraggingObject}
          isResizing={isResizing}
          zoomLevel={zoomLevel}
          activeToolbarId={activeToolbarId}
          toolbarSystemActivated={toolbarSystemActivated}
          selectionColor={selectionColor}
          hoverColor={hoverColor}
          videoPauseOnSelect={videoPauseOnSelect}
          selectionPaddingMode={selectionPaddingMode}
          frameLabelPosition={frameLabelPosition}
          onSetActiveToolbar={onSetActiveToolbar}
          onActivateToolbarSystem={onActivateToolbarSystem}
          onObjectHoverEnter={onToolbarHoverEnter}
          onObjectHoverLeave={onToolbarHoverLeave}
          onSelect={onSelect}
          onResizeStart={onResizeStart}
          onDragStart={onDragStart}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onRotate={onRotate}
          onColorTagChange={onColorTagChange}
          onContentUpdate={onContentUpdate}
          onLabelBgColorChange={onLabelBgColorChange}
          onNameChange={onNameChange}
          onNoteColorChange={onNoteColorChange}
        />

        {/* Selection Bounds */}
        <AnimatePresence>
          {isMultiSelect && !isDraggingObject && !isResizing && (
            <SelectionBounds
              minX={selectionBounds.minX}
              minY={selectionBounds.minY}
              maxX={selectionBounds.maxX}
              maxY={selectionBounds.maxY}
              zoomLevel={zoomLevel}
              selectionColor={selectionColor}
              paddingMode={selectionPaddingMode}
              onResizeStart={onResizeStart}
            />
          )}
        </AnimatePresence>

        {/* Selection Box */}
        <AnimatePresence>
          {isSelecting && (
            <SelectionBox
              startX={selectionStart.x}
              startY={selectionStart.y}
              currentX={selectionCurrent.x}
              currentY={selectionCurrent.y}
              zoomLevel={zoomLevel}
              selectionColor={selectionColor}
            />
          )}
        </AnimatePresence>

        {/* Frame Drawing Box */}
        <AnimatePresence>
          {isDrawingFrame &&
            frameDrawStart.x !== 0 &&
            frameDrawStart.y !== 0 && (
              <FrameDrawingBox
                startX={frameDrawStart.x}
                startY={frameDrawStart.y}
                currentX={frameDrawCurrent.x}
                currentY={frameDrawCurrent.y}
                zoomLevel={zoomLevel}
              />
            )}
        </AnimatePresence>
      </div>

      {/* Multi-Select Toolbar - rendered outside transform wrapper */}
      {isMultiSelect && (
        <UnifiedToolbarWrapper
          mode="multi"
          bounds={selectionBounds}
          selectedObjectTypes={selectedObjectTypes}
          zoomLevel={zoomLevel}
          panOffset={panOffset}
          isMultiSelect={isMultiSelect}
          isDragging={isDraggingObject}
          isResizing={isResizing}
          multiColorTag={multiSelectColorTag}
          onMultiColorTagChange={onMultiSelectColorTagChange}
          onMultiLabelBgColorChange={onMultiLabelBgColorChange}
          onMultiAIPrompt={(prompt) => console.log("Multi AI prompt:", prompt)}
          onFrameSelection={onFrameSelection}
          onFrameSelectionWithAutolayout={onFrameSelectionWithAutolayout}
          onToolbarHoverEnter={onToolbarHoverEnter}
          onToolbarHoverLeave={onToolbarHoverLeave}
        />
      )}

      {/* Drag Handle - rendered outside transform wrapper */}
      {/* Drag handle - shown on right side of object */}
      {/* Hidden in micro and tiny states (≤ 30px) to reduce clutter */}
      <AnimatePresence mode="wait">
        {activeObject &&
          !isMultiSelect &&
          !isDraggingObject &&
          !isResizing &&
          !isDraggingHandle &&
          shouldShowDragHandle(activeObject.type) &&
          shouldShowDragHandleUI(
            activeObject.width,
            activeObject.height,
            zoomLevel
          ) &&
          !(
            activeObject.type === "frame" &&
            (activeObject as any).isAgentCreating
          ) &&
          (() => {
            // Calculate dynamic selection gap for drag handle positioning
            const dragHandleGap = getSelectionGap(
              activeObject.width,
              activeObject.height,
              zoomLevel
            );
            return (
              <DragHandle
                x={activeObject.x * zoomLevel + panOffset.x - dragHandleGap}
                y={activeObject.y * zoomLevel + panOffset.y - dragHandleGap}
                width={activeObject.width * zoomLevel + dragHandleGap * 2}
                height={activeObject.height * zoomLevel + dragHandleGap * 2}
                rotation={0}
                side={dragHandleSide}
                selectionColor={selectionColor}
                onDragStart={onDragHandleStart}
                onMouseEnter={onToolbarHoverEnter}
                onMouseLeave={onToolbarHoverLeave}
              />
            );
          })()}
      </AnimatePresence>

      {/* Single Object Toolbar - rendered outside transform wrapper */}
      {/* Toolbar adapts to object size using 3-state system (tiny/small/normal) */}
      {
        <UnifiedToolbarWrapper
          mode="single"
          object={activeObject || undefined}
          objects={objects}
          isMultiSelect={isMultiSelect}
          isDragging={isDraggingObject}
          isResizing={isResizing}
          zoomLevel={zoomLevel}
          panOffset={panOffset}
          onToolbarHoverEnter={onToolbarHoverEnter}
          onToolbarHoverLeave={onToolbarHoverLeave}
          onZoomToFit={onZoomToFit}
          onColorTagChange={onColorTagChange}
          onLabelBgColorChange={onLabelBgColorChange}
          onAIPrompt={onAIPrompt}
          onConvertToVideo={onConvertToVideo}
          onRerun={onRerun}
          onReframe={onReframe}
          onUnframe={onUnframe}
          onToggleAutolayout={onToggleAutolayout}
          onMore={onMore}
          onDownload={onDownload}
        />
      }
    </div>
  );
}
