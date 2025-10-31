/**
 * Main App Component (Refactored)
 * Clean orchestration layer using custom hooks and extracted handlers
 */

import { useRef, useState, useEffect } from "react";

// Types
import { ArtifactType, ColorTag } from "./types";

// Components
import { ZoomControls } from "./components/ZoomControls";
import { CanvasContextMenu } from "./components/CanvasContextMenu";
import { HeaderToolbar } from "./components/toolbar/HeaderToolbar";
import { CanvasLayer } from "./components/canvas/CanvasLayer";
import { Documentation } from "./components/Documentation";
import { DebugAttentionOverlay } from "./components/DebugAttentionOverlay";
import { OffScreenNotifications } from "./components/OffScreenNotifications";
import { LAYOUT_CONFIG } from "./config/layoutConfig";

// Config
import { INITIAL_OBJECTS } from "./config/initialObjects";
import { INITIAL_OBJECTS_EMPTY } from "./config/initialObjects.empty";

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
import { useAttentionTracking } from "./hooks/useAttentionTracking";
import { useCursorPosition } from "./hooks/useCursorPosition";
import { useOffScreenAgentFrames } from "./hooks/useOffScreenAgentFrames";

// Handlers
import { createObjectHandlers } from "./handlers/objectHandlers";
import { createFrameHandlers } from "./handlers/frameHandlers";
import { createArtifactHandlers } from "./handlers/artifactHandlers";
import { createMouseHandlers } from "./handlers/mouseHandlers";
import { createCanvasHandlers } from "./handlers/canvasHandlers";

// Utils
import { promoteToHighestZIndex } from "./utils/canvasUtils";
import { checkAndDissolveFrames } from "./utils/agentFrameManager";

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
  const cursorTracker = useCursorPosition();

  const computeAnchorObjectId = (canvasPoint?: {
    x: number;
    y: number;
  }): string | undefined => {
    const gap = LAYOUT_CONFIG.PLACEMENT_GAP_PX;
    const point = canvasPoint ?? cursorTracker.cursorPosition?.canvas;

    const getObjectById = (id: string) =>
      canvas.objects.find((obj) => obj.id === id);

    const candidateId =
      selection.selectedIds[selection.selectedIds.length - 1] ||
      toolbar.activeToolbarId ||
      undefined;
    const candidate = candidateId ? getObjectById(candidateId) : undefined;

    const isPointNearObject = (
      obj: typeof candidate,
      anchorPoint?: { x: number; y: number }
    ) => {
      if (!obj) return false;
      if (!anchorPoint) return true;

      const expandedX1 = obj.x - gap;
      const expandedX2 = obj.x + obj.width + gap * 3;
      const expandedY1 = obj.y - gap;
      const expandedY2 = obj.y + obj.height + gap * 2;

      if (
        anchorPoint.x >= expandedX1 &&
        anchorPoint.x <= expandedX2 &&
        anchorPoint.y >= expandedY1 &&
        anchorPoint.y <= expandedY2
      ) {
        return true;
      }

      const centerX = obj.x + obj.width / 2;
      const centerY = obj.y + obj.height / 2;
      const distance = Math.hypot(
        anchorPoint.x - centerX,
        anchorPoint.y - centerY
      );
      return distance < 200;
    };

    if (candidate && isPointNearObject(candidate, point)) {
      return candidate.id;
    }

    if (point) {
      // Prefer an object to the left that shares roughly the same row
      let rowNeighbor: { id: string; rightEdge: number } | undefined;
      canvas.objects.forEach((obj) => {
        if (obj.type === "frame") return;
        const verticalOverlap =
          point.y >= obj.y - gap && point.y <= obj.y + obj.height + gap;
        if (!verticalOverlap) return;
        const objRight = obj.x + obj.width;
        if (objRight <= point.x + gap) {
          if (!rowNeighbor || objRight > rowNeighbor.rightEdge) {
            rowNeighbor = { id: obj.id, rightEdge: objRight };
          }
        }
      });
      if (rowNeighbor) {
        return rowNeighbor.id;
      }

      let nearest: { id: string; distance: number } | undefined;
      canvas.objects.forEach((obj) => {
        if (obj.type === "frame") return;
        const dx = Math.max(obj.x - point.x, 0, point.x - (obj.x + obj.width));
        const dy = Math.max(obj.y - point.y, 0, point.y - (obj.y + obj.height));
        const distance = Math.hypot(dx, dy);
        if (distance < 160 && (!nearest || distance < nearest.distance)) {
          nearest = { id: obj.id, distance };
        }
      });
      if (nearest) {
        return nearest.id;
      }
    }

    return undefined;
  };
  const [showDocumentation, setShowDocumentation] = useState(false);
  const colorTheme = useColorTheme();
  const [videoPauseOnSelect, setVideoPauseOnSelect] = useState(false);
  const [selectionPaddingMode, setSelectionPaddingMode] = useState<
    "flush" | "responsive"
  >("flush");
  const [frameLabelPosition, setFrameLabelPosition] = useState<
    "background" | "drag-handle"
  >("drag-handle");
  const [videoControlsLayout, setVideoControlsLayout] = useState<
    "unified-pill" | "split-top-bottom"
  >("unified-pill");
  const [showPlayIconOnHover, setShowPlayIconOnHover] = useState(true);

  // ===== Layout Engine Debug State =====
  const [showAttentionScores, setShowAttentionScores] = useState(false);
  const [canvasMode, setCanvasMode] = useState<"empty" | "showcase">(
    "showcase"
  );

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

  // ===== Attention Tracking =====
  const attentionTracking = useAttentionTracking(
    canvas.objects,
    canvas.zoomLevel,
    canvas.panOffset,
    canvasRef,
    cursorTracker.cursorPosition?.canvas
  );

  // Off-screen agent frame notifications
  const offScreenFrames = useOffScreenAgentFrames(
    canvas.objects,
    canvas.zoomLevel,
    canvas.panOffset,
    canvasRef
  );

  // Track when objects are moved (after drag ends)
  useEffect(() => {
    if (!drag.isDraggingObject && drag.draggedObjectIds.length > 0) {
      drag.draggedObjectIds.forEach((id) => {
        attentionTracking.trackObjectMoved(id);
      });
    }
  }, [drag.isDraggingObject, drag.draggedObjectIds, attentionTracking]);

  // Check for agent frame dissolution after objects change
  useEffect(() => {
    const checkDissolution = () => {
      const dissolved = checkAndDissolveFrames(canvas.objects);
      if (dissolved.length !== canvas.objects.length) {
        canvas.setObjects(dissolved);
      }
    };

    // Debounce to avoid checking too frequently
    const timeout = setTimeout(checkDissolution, 500);
    return () => clearTimeout(timeout);
  }, [canvas.objects]);

  const artifactHandlers = createArtifactHandlers({
    objects: canvas.objects,
    addObject: canvas.addObject,
    updateObject: canvas.updateObject,
    setObjects: canvas.setObjects,
    canvasRef,
    zoomLevel: canvas.zoomLevel,
    panOffset: canvas.panOffset,
    deselectAll: selection.deselectAll,
    selectObject: selection.selectObject,
    setActiveToolbarId: toolbar.setActiveToolbarId,
    attentionHead: attentionTracking.attentionHead,
    workflowDirection: attentionTracking.workflowDirection,
    trackObjectGenerated: attentionTracking.trackObjectGenerated,
    selectedIds: selection.selectedIds,
    cursorPosition: cursorTracker.cursorPosition,
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
    updateCursorPosition: cursorTracker.updateCursorPosition,
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
    panOffset: canvas.panOffset,
    setZoomLevel: canvas.setZoomLevel,
    setPanOffset: canvas.setPanOffset,
    canvasRef,
    updateCursorPosition: cursorTracker.updateCursorPosition,
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

    // Toolbar should stay visible when an object is selected
    // Only hide toolbar when leaving non-selected objects during hover
    const isSelected = selection.selectedIds.includes(id);
    if (!isSelected) {
      // Only hide toolbar if leaving a non-selected object
      toolbar.handleHoverLeave();
    }
    // If leaving a selected object, toolbar stays visible (no action needed)
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
    canvasHandlers.handleCanvasContextMenu(e, contextMenuState.openContextMenu);
  };

  const handleResizeStart = (corner: string, e: React.MouseEvent) => {
    e.stopPropagation();
    drag.startResize(corner, e.clientX, e.clientY);
  };

  // ===== Derived State =====
  // For single-select toolbar, use the selected object (not activeToolbarId)
  // This ensures toolbar stays visible based on selection, not hover state
  const activeObject =
    !selection.isMultiSelect && selection.selectedIds.length === 1
      ? canvas.objects.find((obj) => obj.id === selection.selectedIds[0]) ||
        null
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

  const cloneCanvasObjects = <T,>(data: T): T => {
    const structuredCloneFn = (globalThis as any).structuredClone;
    if (typeof structuredCloneFn === "function") {
      return structuredCloneFn(data);
    }
    return JSON.parse(JSON.stringify(data)) as T;
  };

  useEffect(() => {
    if (canvasMode === "empty") {
      canvas.setObjects(cloneCanvasObjects(INITIAL_OBJECTS_EMPTY));
    } else {
      canvas.setObjects(cloneCanvasObjects(INITIAL_OBJECTS));
    }

    selection.deselectAll();
    toolbar.setActiveToolbarId(null);
  }, [canvasMode]);

  const getCursorPlacementOption = () => {
    const position = cursorTracker.cursorPosition?.canvas;
    const anchorObjectId = computeAnchorObjectId();

    if (!position && !anchorObjectId) {
      return undefined;
    }

    const options: Record<string, unknown> = {};
    if (position) options.position = position;
    if (anchorObjectId) options.anchorObjectId = anchorObjectId;
    return options as any;
  };

  const addPlaceholderAtFocus = (type: ArtifactType) =>
    artifactHandlers.handleAddPlaceholder(type, getCursorPlacementOption());

  const addArtifactAtFocus = (type: ArtifactType) =>
    artifactHandlers.handleAddArtifact(type, getCursorPlacementOption());

  // ===== Off-Screen Frame Handlers =====
  const handlePanToFrame = (frameId: string) => {
    const frame = canvas.objects.find((obj) => obj.id === frameId);
    if (!frame) return;

    // Get actual dimensions
    let width = frame.width;
    let height = frame.height;
    const element = document.querySelector(
      `[data-object-id="${frameId}"]`
    ) as HTMLElement;
    if (element) {
      const actualWidth = element.getAttribute("data-actual-width");
      const actualHeight = element.getAttribute("data-actual-height");
      if (actualWidth) width = parseFloat(actualWidth);
      if (actualHeight) height = parseFloat(actualHeight);
    }

    // Calculate frame center in canvas coords
    const frameCenterX = frame.x + width / 2;
    const frameCenterY = frame.y + height / 2;

    // Calculate viewport dimensions
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Pan so frame center is at viewport center
    const newPanX = rect.width / 2 - frameCenterX * canvas.zoomLevel;
    const newPanY = rect.height / 2 - frameCenterY * canvas.zoomLevel;

    canvas.setPanOffset({ x: newPanX, y: newPanY });
  };

  const handleZoomToShowAll = (frameIds: string[]) => {
    // Get ALL agent frames (not just the off-screen ones)
    // This shows the full vertical stack/conversation
    const allAgentFrames = canvas.objects.filter(
      (obj) => obj.type === "frame" && (obj as any).createdBy === "agent"
    );

    if (allAgentFrames.length === 0) return;

    const frames = allAgentFrames;

    // Calculate bounding box of all frames
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    frames.forEach((frame) => {
      let width = frame.width;
      let height = frame.height;
      const element = document.querySelector(
        `[data-object-id="${frame.id}"]`
      ) as HTMLElement;
      if (element) {
        const actualWidth = element.getAttribute("data-actual-width");
        const actualHeight = element.getAttribute("data-actual-height");
        if (actualWidth) width = parseFloat(actualWidth);
        if (actualHeight) height = parseFloat(actualHeight);
      }

      minX = Math.min(minX, frame.x);
      minY = Math.min(minY, frame.y);
      maxX = Math.max(maxX, frame.x + width);
      maxY = Math.max(maxY, frame.y + height);
    });

    const boundingWidth = maxX - minX;
    const boundingHeight = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate zoom to fit with adaptive padding based on content
    // More frames = more padding (to show context around the stack)
    const basePadding = 150;
    const paddingPerFrame = 20; // Add padding for each frame
    const padding =
      basePadding + Math.min(frames.length * paddingPerFrame, 300);

    const zoomX = (rect.width - padding * 2) / boundingWidth;
    const zoomY = (rect.height - padding * 2) / boundingHeight;

    // Calculate ideal zoom based on content
    let calculatedZoom = Math.min(zoomX, zoomY);

    // Adaptive zoom limits based on number of frames
    const maxZoom = 1.0; // Never zoom in
    let minZoom = 0.3; // Default minimum

    // For many frames, allow smaller zoom
    if (frames.length > 5) {
      minZoom = 0.25;
    }
    if (frames.length > 10) {
      minZoom = 0.2;
    }

    const finalZoom = Math.max(Math.min(calculatedZoom, maxZoom), minZoom);

    // Pan to center
    const newPanX = rect.width / 2 - centerX * finalZoom;
    const newPanY = rect.height / 2 - centerY * finalZoom;

    canvas.setZoomLevel(finalZoom);
    canvas.setPanOffset({ x: newPanX, y: newPanY });

    // Dismiss all the frames we just showed
    frameIds.forEach((id) => offScreenFrames.dismissIndicator(id));
  };

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
        onAddArtifact={addArtifactAtFocus}
        onAddPlaceholder={addPlaceholderAtFocus}
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
        videoControlsLayout={videoControlsLayout}
        onToggleVideoControlsLayout={() => {
          const newLayout =
            videoControlsLayout === "unified-pill"
              ? "split-top-bottom"
              : "unified-pill";
          setVideoControlsLayout(newLayout);
        }}
        showPlayIconOnHover={showPlayIconOnHover}
        onToggleShowPlayIconOnHover={() => {
          setShowPlayIconOnHover(!showPlayIconOnHover);
        }}
        onSimulateAgentScenario={artifactHandlers.handleSimulateAgentScenario}
        showAttentionScores={showAttentionScores}
        onToggleAttentionScores={() =>
          setShowAttentionScores(!showAttentionScores)
        }
        canvasMode={canvasMode}
        onToggleCanvasMode={() =>
          setCanvasMode(canvasMode === "empty" ? "showcase" : "empty")
        }
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
        videoControlsLayout={videoControlsLayout}
        showPlayIconOnHover={showPlayIconOnHover}
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

      {/* Debug Attention Overlay */}
      <DebugAttentionOverlay
        objects={canvas.objects}
        zoomLevel={canvas.zoomLevel}
        panOffset={canvas.panOffset}
        getAttentionScore={attentionTracking.getAttentionScore}
        enabled={showAttentionScores}
      />

      {/* Off-Screen Notifications */}
      <OffScreenNotifications
        indicators={offScreenFrames.indicators}
        objects={canvas.objects}
        zoomLevel={canvas.zoomLevel}
        panOffset={canvas.panOffset}
        onPanToFrame={handlePanToFrame}
        onZoomToShowAll={handleZoomToShowAll}
      />

      {/* Context Menu */}
      <CanvasContextMenu
        isOpen={contextMenuState.contextMenu.isOpen}
        x={contextMenuState.contextMenu.x}
        y={contextMenuState.contextMenu.y}
        onClose={contextMenuState.closeContextMenu}
        onNewImage={() =>
          artifactHandlers.handleAddPlaceholder("image", {
            position: contextMenuState.contextMenu.canvasPosition,
            anchorObjectId: computeAnchorObjectId(
              contextMenuState.contextMenu.canvasPosition
            ),
          })
        }
        onNewVideo={() =>
          artifactHandlers.handleAddPlaceholder("video", {
            position: contextMenuState.contextMenu.canvasPosition,
            anchorObjectId: computeAnchorObjectId(
              contextMenuState.contextMenu.canvasPosition
            ),
          })
        }
        onNewAudio={() =>
          artifactHandlers.handleAddPlaceholder("audio", {
            position: contextMenuState.contextMenu.canvasPosition,
            anchorObjectId: computeAnchorObjectId(
              contextMenuState.contextMenu.canvasPosition
            ),
          })
        }
        onNewFrame={artifactHandlers.handleAddEmptyFrame}
        onUploadMedia={() => console.log("Upload Media - TODO")}
        onCursorChat={() => console.log("Cursor Chat - TODO")}
      />
    </div>
  );
}
