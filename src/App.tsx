/**
 * Main App Component (Refactored)
 * Clean orchestration layer using custom hooks and extracted handlers
 */

import { useRef, useState, useEffect } from "react";

// Types
import { ColorTag } from "./types";

// Components
import { ZoomControls } from "./components/ZoomControls";
import { CanvasContextMenu } from "./components/CanvasContextMenu";
import { HeaderToolbar } from "./components/toolbar/HeaderToolbar";
import { CanvasLayer } from "./components/canvas/CanvasLayer";
import { Documentation } from "./components/Documentation";

// Config
import { INITIAL_OBJECTS } from "./config/initialObjects";

// Hooks
import { useCanvasState } from "./hooks/useCanvasState";
import { useSelection } from "./hooks/useSelection";
import { useDrag } from "./hooks/useDrag";
import { useToolbar } from "./hooks/useToolbar";
import { usePan } from "./hooks/usePan";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useHistory } from "./hooks/useHistory";
import { useFrameDrawing } from "./hooks/useFrameDrawing";
import { useContextMenu } from "./hooks/useContextMenu";
import { useWheel } from "./hooks/useWheel";
import { useColorTheme } from "./hooks/useColorTheme";

// Handlers
import { createObjectHandlers } from "./handlers/objectHandlers";
import { createFrameHandlers } from "./handlers/frameHandlers";
import { createArtifactHandlers } from "./handlers/artifactHandlers";
import { createMouseHandlers } from "./handlers/mouseHandlers";
import { createCanvasHandlers } from "./handlers/canvasHandlers";

// Utils
import { promoteToHighestZIndex } from "./utils/canvasUtils";

export default function App() {
  // ===== Refs =====
  const canvasRef = useRef<HTMLDivElement>(null);

  // ===== State Management =====
  const canvas = useCanvasState(INITIAL_OBJECTS);
  const selection = useSelection(canvas.objects);
  const drag = useDrag(
    canvas.objects,
    selection.selectedIds,
    canvas.setObjects
  );
  const toolbar = useToolbar();
  const pan = usePan();
  const history = useHistory(INITIAL_OBJECTS, (objects) => {
    canvas.setObjects(objects);
  });
  const frameDrawing = useFrameDrawing();
  const contextMenuState = useContextMenu();
  const [showDocumentation, setShowDocumentation] = useState(false);
  const colorTheme = useColorTheme();
  const [videoPauseOnSelect, setVideoPauseOnSelect] = useState(false);
  const [selectionPaddingMode, setSelectionPaddingMode] = useState<
    "flush" | "responsive"
  >("flush");
  const [frameLabelPosition, setFrameLabelPosition] = useState<
    "background" | "drag-handle"
  >("drag-handle");

  // ===== Multi-Video Sync Play Feature =====
  // Track when hovering over a video while multiple videos are selected
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);

  // ===== Wheel Event Handling =====
  useWheel({
    canvasRef,
    zoomLevel: canvas.zoomLevel,
    panOffset: canvas.panOffset,
    setZoomLevel: canvas.setZoomLevel,
    setPanOffset: canvas.setPanOffset,
  });

  // ===== Disable default browser context menu globally =====
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  // ===== Set global cursor during resize with CSS override =====
  useEffect(() => {
    if (drag.isResizing && drag.resizeCorner) {
      // Set appropriate cursor based on resize corner
      let cursor = "nwse-resize";
      if (
        drag.resizeCorner === "top-right" ||
        drag.resizeCorner === "bottom-left"
      ) {
        cursor = "nesw-resize";
      }

      // Create a style element to force cursor globally with !important
      const styleEl = document.createElement("style");
      styleEl.id = "resize-cursor-override";
      styleEl.innerHTML = `* { cursor: ${cursor} !important; }`;
      document.head.appendChild(styleEl);

      // Also prevent text selection during resize
      document.body.style.userSelect = "none";
    } else {
      // Remove the style override
      const styleEl = document.getElementById("resize-cursor-override");
      if (styleEl) {
        styleEl.remove();
      }
      document.body.style.userSelect = "";
    }

    return () => {
      const styleEl = document.getElementById("resize-cursor-override");
      if (styleEl) {
        styleEl.remove();
      }
      document.body.style.userSelect = "";
    };
  }, [drag.isResizing, drag.resizeCorner, selection.selectedIds]);

  // ===== Record history whenever objects change =====
  useEffect(() => {
    history.pushState(canvas.objects);
  }, [canvas.objects, history]);

  // ===== Promote selected objects to highest z-index =====
  useEffect(() => {
    if (selection.selectedIds.length > 0) {
      const updatedObjects = promoteToHighestZIndex(
        canvas.objects,
        selection.selectedIds
      );

      // Only update if any selected object's z-index actually changed
      const hasChanged = selection.selectedIds.some((id) => {
        const oldObj = canvas.objects.find((o) => o.id === id);
        const newObj = updatedObjects.find((o) => o.id === id);
        return oldObj && newObj && oldObj.zIndex !== newObj.zIndex;
      });

      if (hasChanged) {
        canvas.setObjects(updatedObjects);
      }
    }
  }, [selection.selectedIds]);

  // ===== Create Handlers =====
  const objectHandlers = createObjectHandlers({
    objects: canvas.objects,
    selectedIds: selection.selectedIds,
    setSelectedIds: selection.setSelectedIds,
    deleteObject: canvas.deleteObject,
    addObject: canvas.addObject,
    updateObject: canvas.updateObject,
    setActiveToolbarId: toolbar.setActiveToolbarId,
    handleHoverEnter: toolbar.handleHoverEnter,
  });

  const frameHandlers = createFrameHandlers({
    objects: canvas.objects,
    setObjects: canvas.setObjects,
    selectedIds: selection.selectedIds,
    deselectAll: selection.deselectAll,
    selectObject: selection.selectObject,
    setSelectedIds: selection.setSelectedIds,
    setActiveToolbarId: toolbar.setActiveToolbarId,
    setToolbarSystemActivated: toolbar.setToolbarSystemActivated,
  });

  const artifactHandlers = createArtifactHandlers({
    addObject: canvas.addObject,
    updateObject: canvas.updateObject,
    setObjects: canvas.setObjects,
    canvasRef,
    zoomLevel: canvas.zoomLevel,
    panOffset: canvas.panOffset,
    deselectAll: selection.deselectAll,
    selectObject: selection.selectObject,
    setActiveToolbarId: toolbar.setActiveToolbarId,
  });

  const mouseHandlers = createMouseHandlers({
    canvasRef,
    zoomLevel: canvas.zoomLevel,
    panOffset: canvas.panOffset,
    objects: canvas.objects,
    setObjects: canvas.setObjects,
    isPanning: pan.isPanning,
    startPan: pan.startPan,
    updatePan: pan.updatePan,
    endPan: pan.endPan,
    setPanOffset: canvas.setPanOffset,
    isDraggingObject: drag.isDraggingObject,
    isResizing: drag.isResizing,
    isDraggingHandle: drag.isDraggingHandle,
    updateResize: drag.updateResize,
    endResize: drag.endResize,
    endObjectDrag: drag.endObjectDrag,
    startHandleDrag: drag.startHandleDrag,
    isSelecting: selection.isSelecting,
    startBoxSelection: selection.startBoxSelection,
    updateBoxSelection: selection.updateBoxSelection,
    endBoxSelection: selection.endBoxSelection,
    isDrawingFrame: frameDrawing.isDrawingFrame,
    frameDrawStart: frameDrawing.frameDrawStart,
    frameDrawCurrent: frameDrawing.frameDrawCurrent,
    setFrameDrawStart: frameDrawing.setFrameDrawStart,
    setFrameDrawCurrent: frameDrawing.setFrameDrawCurrent,
    setIsDrawingFrame: frameDrawing.setIsDrawingFrame,
    deselectAll: selection.deselectAll,
    selectObject: selection.selectObject,
    setActiveToolbarId: toolbar.setActiveToolbarId,
    selectedIds: selection.selectedIds,
  });

  const canvasHandlers = createCanvasHandlers({
    objects: canvas.objects,
    selectedIds: selection.selectedIds,
    isSelecting: selection.isSelecting,
    isDraggingObject: drag.isDraggingObject,
    isResizing: drag.isResizing,
    selectionJustCompleted: selection.selectionJustCompleted,
    deselectAll: selection.deselectAll,
    selectObject: selection.selectObject,
    setActiveToolbarId: toolbar.setActiveToolbarId,
    setToolbarSystemActivated: toolbar.setToolbarSystemActivated,
    zoomLevel: canvas.zoomLevel,
    setZoomLevel: canvas.setZoomLevel,
    setPanOffset: canvas.setPanOffset,
    canvasRef,
  });

  // ===== Additional Event Handlers =====

  // Wrapper for object hover enter to detect multi-video sync play scenario
  const handleObjectHoverEnter = (id: string) => {
    toolbar.handleHoverEnter();

    // Check if we're hovering a video in a multi-video selection
    const hoveredObj = canvas.objects.find((obj) => obj.id === id);
    if (!hoveredObj || hoveredObj.type !== "video") {
      setHoveredVideoId(null);
      return;
    }

    // Check if this video is selected
    const isHoveredVideoSelected = selection.selectedIds.includes(id);
    if (!isHoveredVideoSelected) {
      setHoveredVideoId(null);
      return;
    }

    // Count how many selected objects are videos
    const selectedVideos = canvas.objects.filter(
      (obj) => selection.selectedIds.includes(obj.id) && obj.type === "video"
    );

    // If multiple videos are selected, activate sync play
    if (selectedVideos.length > 1) {
      setHoveredVideoId(id);
    } else {
      setHoveredVideoId(null);
    }
  };

  // Wrapper for object hover leave
  const handleObjectHoverLeave = (id: string) => {
    // Clear the hovered video state when leaving any video
    const obj = canvas.objects.find((o) => o.id === id);
    if (obj?.type === "video") {
      setHoveredVideoId(null);
    }

    // Only hide toolbar if object is NOT selected
    const isSelected = selection.selectedIds.includes(id);
    if (!isSelected) {
      toolbar.handleHoverLeave();
    }
  };

  // Clear hovered video state when mouse leaves to empty canvas
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (hoveredVideoId === null) return;

      // Check if mouse is over any canvas object
      const target = e.target as HTMLElement;
      const isOverObject = target.closest("[data-canvas-object]");

      // If not over any object, clear the hovered video state
      if (!isOverObject) {
        setHoveredVideoId(null);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [hoveredVideoId]);

  // Wrapper for toolbar hover leave that checks if we should actually hide
  const handleToolbarHoverLeave = () => {
    // Don't hide toolbar if ANY object is selected
    // During color changes, the activeToolbarId might be stale, so check if ANY selection exists
    if (selection.selectedIds.length > 0) {
      return;
    }
    toolbar.handleHoverLeave();
  };

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    canvasHandlers.handleCanvasContextMenu(e, contextMenuState.setContextMenu);
  };

  const handleResizeStart = (corner: string, e: React.MouseEvent) => {
    e.stopPropagation();
    drag.startResize(corner, e.clientX, e.clientY);
  };

  // ===== Derived State =====
  const activeObject = toolbar.activeToolbarId
    ? canvas.objects.find((obj) => obj.id === toolbar.activeToolbarId) || null
    : null;

  const selectedObjectTypes = canvas.objects
    .filter((obj) => selection.selectedIds.includes(obj.id))
    .map((obj) => obj.type);

  const multiSelectColorTag =
    selection.isMultiSelect &&
    canvas.objects.find((obj) => selection.selectedIds.includes(obj.id))
      ? canvas.objects.find((obj) => selection.selectedIds.includes(obj.id))
          ?.colorTag || "none"
      : "none";

  // ===== Keyboard Shortcuts =====
  useKeyboardShortcuts({
    onDelete: () => {
      if (selection.selectedIds.length > 0) {
        canvas.deleteObjects(selection.selectedIds);
        selection.deselectAll();
      }
    },
    onToggleFrameDrawing: () => {
      frameDrawing.toggleFrameDrawing();
      // Clear selection when entering frame drawing mode
      if (!frameDrawing.isDrawingFrame) {
        selection.deselectAll();
        toolbar.setActiveToolbarId(null);
      }
    },
    onUndo: () => {
      history.undo();
    },
    onRedo: () => {
      history.redo();
    },
    onZoomToFit: () => {
      // Only zoom if exactly one object is selected
      if (selection.selectedIds.length === 1) {
        canvasHandlers.handleZoomToFitToolbar(selection.selectedIds[0]);
      }
    },
  });

  // ===== Render =====
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#DFDFDF]">
      {/* Documentation */}
      {showDocumentation && (
        <Documentation onClose={() => setShowDocumentation(false)} />
      )}

      {/* Frame Drawing Mode Indicator */}
      {frameDrawing.isDrawingFrame && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium">
          Frame Drawing Mode (Press F to exit)
        </div>
      )}

      {/* Header Toolbar */}
      <HeaderToolbar
        onAddCanvasNative={artifactHandlers.handleAddCanvasNative}
        onAddArtifact={artifactHandlers.handleAddArtifact}
        onAddPlaceholder={artifactHandlers.handleAddPlaceholder}
        onAddFrame={artifactHandlers.handleAddEmptyFrame}
        onAddAgentFrame={artifactHandlers.handleAddAgentFrame}
        onOpenDocumentation={() => setShowDocumentation(true)}
        colorTheme={colorTheme.theme}
        onToggleColorTheme={colorTheme.toggleTheme}
        videoPauseOnSelect={videoPauseOnSelect}
        onToggleVideoPauseOnSelect={() =>
          setVideoPauseOnSelect(!videoPauseOnSelect)
        }
        selectionPaddingMode={selectionPaddingMode}
        onToggleSelectionPadding={() =>
          setSelectionPaddingMode(
            selectionPaddingMode === "flush" ? "responsive" : "flush"
          )
        }
        frameLabelPosition={frameLabelPosition}
        onToggleFrameLabelPosition={() => {
          const newPosition =
            frameLabelPosition === "background" ? "drag-handle" : "background";
          console.log(
            "Toggle frame label position:",
            frameLabelPosition,
            "->",
            newPosition
          );
          setFrameLabelPosition(newPosition);
        }}
      />

      {/* Canvas */}
      <CanvasLayer
        canvasRef={canvasRef}
        objects={canvas.objects}
        zoomLevel={canvas.zoomLevel}
        panOffset={canvas.panOffset}
        selectedIds={selection.selectedIds}
        isMultiSelect={selection.isMultiSelect}
        hoveredBySelectionIds={selection.hoveredBySelectionIds}
        isSelecting={selection.isSelecting}
        selectionStart={selection.selectionStart}
        selectionCurrent={selection.selectionCurrent}
        selectionBounds={selection.selectionBounds}
        selectedObjectTypes={selectedObjectTypes}
        multiSelectColorTag={multiSelectColorTag as ColorTag}
        isDrawingFrame={frameDrawing.isDrawingFrame}
        frameDrawStart={frameDrawing.frameDrawStart}
        frameDrawCurrent={frameDrawing.frameDrawCurrent}
        isDraggingObject={drag.isDraggingObject}
        isResizing={drag.isResizing}
        isDraggingHandle={drag.isDraggingHandle}
        activeObject={activeObject}
        selectionColor={colorTheme.selectionColor}
        hoverColor={colorTheme.hoverColor}
        activeToolbarId={toolbar.activeToolbarId}
        toolbarSystemActivated={toolbar.toolbarSystemActivated}
        videoPauseOnSelect={videoPauseOnSelect}
        hoveredVideoId={hoveredVideoId}
        selectionPaddingMode={selectionPaddingMode}
        frameLabelPosition={frameLabelPosition}
        onCanvasMouseDown={mouseHandlers.handleCanvasMouseDown}
        onCanvasMouseMove={mouseHandlers.handleCanvasMouseMove}
        onCanvasMouseUp={mouseHandlers.handleCanvasMouseUp}
        onCanvasClick={canvasHandlers.handleCanvasClick}
        onCanvasContextMenu={handleCanvasContextMenu}
        onSelect={canvasHandlers.handleSelect}
        onResizeStart={handleResizeStart}
        onDragStart={(id, optionKey) =>
          drag.startObjectDrag(
            id,
            selection.selectedIds,
            canvas.objects,
            optionKey,
            canvas.setObjects,
            selection.setSelectedIds
          )
        }
        onDrag={drag.updateObjectDrag}
        onDragEnd={() => {
          drag.endObjectDrag();
          if (selection.selectedIds.length === 1) {
            toolbar.setActiveToolbarId(selection.selectedIds[0]);
          }
        }}
        onDelete={objectHandlers.handleDelete}
        onDuplicate={objectHandlers.handleDuplicate}
        onRotate={objectHandlers.handleRotate}
        onColorTagChange={objectHandlers.handleColorTagChange}
        onMultiSelectColorTagChange={
          objectHandlers.handleMultiSelectColorTagChange
        }
        onMultiLabelBgColorChange={objectHandlers.handleMultiLabelBgColorChange}
        onNoteColorChange={objectHandlers.handleNoteColorChange}
        onContentUpdate={objectHandlers.handleContentUpdate}
        onLabelBgColorChange={objectHandlers.handleLabelBgColorChange}
        onNameChange={objectHandlers.handleNameChange}
        onSetActiveToolbar={toolbar.setActiveToolbarId}
        onActivateToolbarSystem={() => toolbar.setToolbarSystemActivated(true)}
        onToolbarHoverEnter={toolbar.handleHoverEnter}
        onToolbarHoverLeave={handleToolbarHoverLeave}
        onObjectHoverEnter={handleObjectHoverEnter}
        onObjectHoverLeave={handleObjectHoverLeave}
        onZoomToFit={canvasHandlers.handleZoomToFitToolbar}
        onAIPrompt={artifactHandlers.handleAIPrompt}
        onConvertToVideo={artifactHandlers.handleConvertToVideo}
        onRerun={artifactHandlers.handleRerun}
        onReframe={artifactHandlers.handleReframe}
        onUnframe={frameHandlers.handleUnframe}
        onToggleAutolayout={frameHandlers.handleToggleAutolayout}
        onMore={artifactHandlers.handleMore}
        onDownload={artifactHandlers.handleDownload}
        onFrameSelection={frameHandlers.handleFrameSelection}
        onFrameSelectionWithAutolayout={
          frameHandlers.handleFrameSelectionWithAutolayout
        }
        onDragHandleStart={mouseHandlers.handleDragHandleStart}
      />

      {/* Zoom Controls - Bottom Right */}
      <div className="absolute bottom-6 right-6 z-50">
        <ZoomControls
          zoomLevel={canvas.zoomLevel}
          onZoomIn={canvas.zoomIn}
          onZoomOut={canvas.zoomOut}
          onResetZoom={canvas.resetZoom}
        />
      </div>

      {/* Context Menu */}
      <CanvasContextMenu
        isOpen={contextMenuState.contextMenu.isOpen}
        x={contextMenuState.contextMenu.x}
        y={contextMenuState.contextMenu.y}
        onClose={contextMenuState.closeContextMenu}
        onNewImage={() => artifactHandlers.handleAddArtifact("image")}
        onNewVideo={() => artifactHandlers.handleAddArtifact("video")}
        onNewAudio={() => artifactHandlers.handleAddArtifact("audio")}
        onNewFrame={artifactHandlers.handleAddEmptyFrame}
        onUploadMedia={() => console.log("Upload Media - TODO")}
        onCursorChat={() => console.log("Cursor Chat - TODO")}
      />
    </div>
  );
}
