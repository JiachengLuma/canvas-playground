/**
 * Canvas Layer Component
 * Main canvas rendering layer with all interactions, objects, and overlays
 */

import { AnimatePresence } from "motion/react";
import { CanvasObject as CanvasObjectType, ColorTag } from "../../types";
import { ObjectsLayer } from "./ObjectsLayer";
import { SelectionBounds } from "../SelectionBounds";
import { MultiSelectToolbar } from "../MultiSelectToolbar";
import { SelectionBox } from "../SelectionBox";
import { FrameDrawingBox } from "../FrameDrawingBox";
import { DragHandle } from "../DragHandle";
import { SingleObjectToolbarWrapper } from "./SingleObjectToolbarWrapper";
import { shouldShowDragHandle } from "../../config/behaviorConfig";

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
  onContentUpdate: (id: string, content: string) => void;

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
  onContentUpdate,
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
              onResizeStart={onResizeStart}
            />
          )}
        </AnimatePresence>

        {/* Multi-Select Toolbar */}
        <AnimatePresence>
          {isMultiSelect && !isDraggingObject && !isResizing && (
            <MultiSelectToolbar
              selectedCount={selectedIds.length}
              objectTypes={selectedObjectTypes}
              zoomLevel={zoomLevel}
              bounds={selectionBounds}
              colorTag={multiSelectColorTag}
              onColorTagChange={onMultiSelectColorTagChange}
              onAIPrompt={(prompt) => console.log("Multi AI prompt:", prompt)}
              onReframe={onFrameSelection}
              onFrameWithAutolayout={onFrameSelectionWithAutolayout}
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

      {/* Drag Handle - rendered outside transform wrapper */}
      {/* Show for generating placeholders too (but not toolbar) */}
      <AnimatePresence mode="wait">
        {activeObject &&
          !isMultiSelect &&
          !isDraggingObject &&
          !isResizing &&
          !isDraggingHandle &&
          shouldShowDragHandle(activeObject.type) &&
          !(
            activeObject.type === "frame" &&
            (activeObject as any).isAgentCreating
          ) && (
            <DragHandle
              x={activeObject.x * zoomLevel + panOffset.x}
              y={activeObject.y * zoomLevel + panOffset.y}
              width={activeObject.width * zoomLevel}
              height={activeObject.height * zoomLevel}
              rotation={0}
              onDragStart={onDragHandleStart}
              onMouseEnter={onToolbarHoverEnter}
              onMouseLeave={onToolbarHoverLeave}
            />
          )}
      </AnimatePresence>

      {/* Single Object Toolbar - rendered outside transform wrapper */}
      <SingleObjectToolbarWrapper
        activeObject={activeObject}
        objects={objects}
        isMultiSelect={isMultiSelect}
        isDraggingObject={isDraggingObject}
        isResizing={isResizing}
        zoomLevel={zoomLevel}
        panOffset={panOffset}
        onToolbarHoverEnter={onToolbarHoverEnter}
        onToolbarHoverLeave={onToolbarHoverLeave}
        onZoomToFit={onZoomToFit}
        onColorTagChange={onColorTagChange}
        onAIPrompt={onAIPrompt}
        onConvertToVideo={onConvertToVideo}
        onRerun={onRerun}
        onReframe={onReframe}
        onUnframe={onUnframe}
        onToggleAutolayout={onToggleAutolayout}
        onMore={onMore}
        onDownload={onDownload}
      />
    </div>
  );
}
