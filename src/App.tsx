/**
 * Main App Component (Refactored)
 * Clean orchestration layer using custom hooks
 */

import { useRef, useState, useEffect } from "react";

// Types
import { ColorTag, ArtifactType, CanvasNativeType } from "./types";

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

// Utils
import { screenToCanvas } from "./utils/canvasUtils";
import {
  createCanvasNative,
  createFrame,
  createPlaceholder,
  completePlaceholder,
} from "./utils/objectFactory";

export default function App() {
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

  const canvasRef = useRef<HTMLDivElement>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
  }>({ isOpen: false, x: 0, y: 0 });

  // Frame Drawing State
  const [isDrawingFrame, setIsDrawingFrame] = useState(false);
  const [frameDrawStart, setFrameDrawStart] = useState({ x: 0, y: 0 });
  const [frameDrawCurrent, setFrameDrawCurrent] = useState({ x: 0, y: 0 });

  // Documentation State
  const [showDocumentation, setShowDocumentation] = useState(false);

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
          Math.min(3, canvas.zoomLevel + delta * 0.5)
        );

        // Calculate the point in canvas space that the mouse is over
        const canvasPointX = (mouseX - canvas.panOffset.x) / canvas.zoomLevel;
        const canvasPointY = (mouseY - canvas.panOffset.y) / canvas.zoomLevel;

        // Calculate new pan offset to keep the canvas point under the mouse
        const newPanX = mouseX - canvasPointX * newZoomLevel;
        const newPanY = mouseY - canvasPointY * newZoomLevel;

        canvas.setZoomLevel(newZoomLevel);
        canvas.setPanOffset({ x: newPanX, y: newPanY });
      } else {
        // Pan with trackpad (two-finger scroll) or mouse wheel
        e.preventDefault();

        // Use deltaX for horizontal scrolling, deltaY for vertical
        const panSpeed = 1.0;

        canvas.setPanOffset((prev) => ({
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
  }, [
    canvas.zoomLevel,
    canvas.panOffset.x,
    canvas.panOffset.y,
    canvas.setZoomLevel,
    canvas.setPanOffset,
  ]);

  // Record history whenever objects change
  useEffect(() => {
    history.pushState(canvas.objects);
  }, [canvas.objects, history]);

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
      setIsDrawingFrame((prev) => !prev);
      // Clear selection when entering frame drawing mode
      if (!isDrawingFrame) {
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
  });

  // ===== Prevent Browser Zoom =====
  // Add native wheel event listener to prevent browser zoom on trackpad pinch
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // Prevent default browser zoom behavior for any wheel event with ctrl/cmd key
      // This catches trackpad pinch-to-zoom gestures
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    // Add listener with passive: false to allow preventDefault()
    canvasElement.addEventListener("wheel", handleNativeWheel, {
      passive: false,
    });

    return () => {
      canvasElement.removeEventListener("wheel", handleNativeWheel);
    };
  }, []);

  // ===== Event Handlers =====

  // Selection
  const handleSelect = (id: string, multi: boolean) => {
    selection.selectObject(id, multi);

    if (!multi) {
      // Single select: show toolbar
      toolbar.setActiveToolbarId(id);
    } else {
      // Multi select: hide individual toolbar
      toolbar.setActiveToolbarId(null);
    }

    toolbar.setToolbarSystemActivated(true);
  };

  const handleCanvasClick = () => {
    // Don't deselect if we just completed a box selection
    if (
      !selection.isSelecting &&
      !drag.isDraggingObject &&
      !drag.isResizing &&
      !selection.selectionJustCompleted()
    ) {
      selection.deselectAll();
      toolbar.setActiveToolbarId(null);
    }
  };

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only show context menu if clicking on empty canvas (not on an object)
    const target = e.target as HTMLElement;
    if (target.closest("[data-canvas-object]")) {
      return;
    }

    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ isOpen: false, x: 0, y: 0 });
  };

  // Object Actions
  const handleDelete = (id: string) => {
    const obj = canvas.objects.find((o) => o.id === id);

    // deleteObject now handles frame children automatically
    canvas.deleteObject(id);

    // Remove from selection (including children if it's a frame)
    if (obj && obj.type === "frame") {
      const frameObj = obj as any;
      const childrenIds = frameObj.children || [];
      selection.setSelectedIds((prev) =>
        prev.filter(
          (selectedId) => selectedId !== id && !childrenIds.includes(selectedId)
        )
      );
    } else {
      selection.setSelectedIds((prev) =>
        prev.filter((selectedId) => selectedId !== id)
      );
    }
  };

  const handleDuplicate = (id: string) => {
    const obj = canvas.objects.find((o) => o.id === id);
    if (obj) {
      const newObj = {
        ...obj,
        id: `${Date.now()}-${Math.random()}`,
        x: obj.x + 20,
        y: obj.y + 20,
      };
      canvas.addObject(newObj);
    }
  };

  const handleRotate = (id: string) => {
    canvas.updateObject(id, {
      rotation:
        ((canvas.objects.find((o) => o.id === id)?.rotation || 0) + 45) % 360,
    });
  };

  const handleColorTagChange = (id: string) => {
    const obj = canvas.objects.find((o) => o.id === id);
    const tags = ["none", "red", "yellow", "green"];
    const currentIndex = tags.indexOf(obj?.colorTag || "none");
    const nextTag = tags[(currentIndex + 1) % tags.length] as ColorTag;
    canvas.updateObject(id, { colorTag: nextTag });

    // Keep toolbar visible after clicking color tag (for hover toolbar)
    toolbar.setActiveToolbarId(id);
    toolbar.handleHoverEnter();
  };

  const handleContentUpdate = (id: string, content: string) => {
    canvas.updateObject(id, { content });
  };

  // Helper function to get viewport center position in canvas coordinates
  // Returns position where the CENTER of an object should be placed
  const getViewportCenterInCanvas = (
    objectWidth: number,
    objectHeight: number
  ) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 100, y: 100 }; // Fallback

    // Get viewport center
    const viewportCenterX = rect.width / 2;
    const viewportCenterY = rect.height / 2;

    // Convert to canvas coordinates
    const { x, y } = screenToCanvas(
      viewportCenterX,
      viewportCenterY,
      canvas.zoomLevel,
      canvas.panOffset
    );

    // Offset by half the object's dimensions so it's centered
    return {
      x: x - objectWidth / 2,
      y: y - objectHeight / 2,
    };
  };

  // Canvas Native Actions
  const handleAddCanvasNative = (type: CanvasNativeType) => {
    // Create temporary object to get its dimensions
    const tempObj = createCanvasNative(type, 0, 0);
    const { x, y } = getViewportCenterInCanvas(tempObj.width, tempObj.height);
    const newObj = { ...tempObj, x, y };
    canvas.addObject(newObj);
  };

  // Add Empty Frame
  const handleAddEmptyFrame = () => {
    const defaultSize = 140;
    const { x, y } = getViewportCenterInCanvas(defaultSize, defaultSize);
    const newFrame = createFrame(x, y, defaultSize, defaultSize, []);
    canvas.addObject(newFrame);

    // Select the new frame
    selection.deselectAll();
    selection.selectObject(newFrame.id, false);
    toolbar.setActiveToolbarId(newFrame.id);
  };

  // Artifact Actions - creates artifacts with sample content
  const handleAddArtifact = (type: ArtifactType) => {
    const tempObj = createPlaceholder(type, 0, 0);
    const { x, y } = getViewportCenterInCanvas(tempObj.width, tempObj.height);
    const completedObj = completePlaceholder({ ...tempObj, x, y });
    canvas.addObject(completedObj);
  };

  // Placeholder Actions - creates a loading placeholder that auto-completes
  const handleAddPlaceholder = (type: ArtifactType) => {
    // Tool names for different artifact types
    const toolNames = {
      image: "Gemini",
      video: "Ray 3",
      audio: "11 Labs",
      document: "Cloud",
    };

    const tempObj = createPlaceholder(type, 0, 0);
    const { x, y } = getViewportCenterInCanvas(tempObj.width, tempObj.height);
    const newObj = {
      ...tempObj,
      x,
      y,
      metadata: {
        ...tempObj.metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: {
          type: "model" as const,
          name: toolNames[type],
        },
      },
    };
    canvas.addObject(newObj);

    // Animate progress over 3 seconds
    const startTime = Date.now();
    const duration = 3000; // 3 seconds

    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);

      // Update progress
      canvas.updateObject(newObj.id, {
        metadata: {
          ...newObj.metadata,
          createdAt: newObj.metadata?.createdAt || Date.now(),
          updatedAt: Date.now(),
          progress,
        },
      });

      if (progress < 100) {
        requestAnimationFrame(animateProgress);
      } else {
        // Complete the placeholder after 3 seconds
        // Get the CURRENT object from canvas (it might have been moved!)
        canvas.setObjects((prev) => {
          const currentObj = prev.find((obj) => obj.id === newObj.id);
          if (!currentObj) return prev;

          // Type guard to ensure we have an artifact type
          if (
            !["image", "video", "audio", "document"].includes(currentObj.type)
          ) {
            return prev;
          }

          const completedObj = completePlaceholder(currentObj as any);
          return prev.map((obj) => (obj.id === newObj.id ? completedObj : obj));
        });
      }
    };

    // Start animation
    requestAnimationFrame(animateProgress);
  };

  const handleAIPrompt = (id: string, prompt: string) => {
    console.log(`AI prompt for ${id}: ${prompt}`);
    // TODO: Implement AI generation
  };

  const handleConvertToVideo = (id: string) => {
    console.log(`Convert ${id} to video`);
  };

  const handleRerun = (id: string) => {
    console.log(`Rerun ${id}`);
  };

  const handleReframe = (id: string) => {
    console.log(`Reframe ${id}`);
  };

  const handleMore = (id: string) => {
    console.log(`More options for ${id}`);
  };

  const handleDownload = (id: string) => {
    console.log(`Download ${id}`);
  };

  // Frame/Unframe Actions
  const handleFrameSelection = () => {
    if (selection.selectedIds.length === 0) return;

    // Get all selected objects
    const selectedObjects = canvas.objects.filter((obj) =>
      selection.selectedIds.includes(obj.id)
    );

    // Calculate bounding box
    const minX = Math.min(...selectedObjects.map((obj) => obj.x));
    const minY = Math.min(...selectedObjects.map((obj) => obj.y));
    const maxX = Math.max(...selectedObjects.map((obj) => obj.x + obj.width));
    const maxY = Math.max(...selectedObjects.map((obj) => obj.y + obj.height));

    // Add padding
    const padding = 10;
    const frameX = minX - padding;
    const frameY = minY - padding;
    const frameWidth = maxX - minX + padding * 2;
    const frameHeight = maxY - minY + padding * 2;

    // Create new frame
    const newFrame = createFrame(
      frameX,
      frameY,
      frameWidth,
      frameHeight,
      selection.selectedIds
    );

    // Update selected objects to have parentId
    const updatedObjects = canvas.objects.map((obj) => {
      if (selection.selectedIds.includes(obj.id)) {
        return { ...obj, parentId: newFrame.id };
      }
      return obj;
    });

    // Add frame and update objects
    canvas.setObjects([...updatedObjects, newFrame]);

    // Directly set selection state to avoid timing issues
    console.log("🎯 Frame created, directly setting selection:", newFrame.id);
    selection.setSelectedIds([newFrame.id]);
    toolbar.setActiveToolbarId(newFrame.id);
    toolbar.setToolbarSystemActivated(true);
  };

  const handleUnframe = (frameId: string) => {
    const frame = canvas.objects.find((obj) => obj.id === frameId);
    if (!frame || frame.type !== "frame") {
      return;
    }

    const frameObj = frame as any;
    const childrenIds = frameObj.children || [];
    const wasAutolayout = frameObj.autoLayout;

    // If autolayout was enabled, calculate children's current flexbox positions
    let childPositions: Map<string, { x: number; y: number }> = new Map();
    if (wasAutolayout) {
      const children = canvas.objects.filter((obj) =>
        childrenIds.includes(obj.id)
      );
      const padding = frameObj.padding || 10;
      const gap = frameObj.gap || 10;
      const layout = frameObj.layout || "hstack";

      let currentX = frame.x + padding;
      let currentY = frame.y + padding;
      let rowHeight = 0;

      children.forEach((child) => {
        childPositions.set(child.id, { x: currentX, y: currentY });

        if (layout === "hstack") {
          currentX += child.width + gap;
        } else if (layout === "vstack") {
          currentY += child.height + gap;
        } else if (layout === "grid") {
          currentX += child.width + gap;
          rowHeight = Math.max(rowHeight, child.height);
          // Simple grid wrapping logic
          if (currentX + child.width > frame.x + frame.width - padding) {
            currentX = frame.x + padding;
            currentY += rowHeight + gap;
            rowHeight = 0;
          }
        }
      });
    }

    // Remove frame and update children
    const updatedObjects = canvas.objects
      .filter((obj) => obj.id !== frameId) // Remove the frame
      .map((obj) => {
        if (childrenIds.includes(obj.id)) {
          const { parentId, ...rest } = obj;
          // Update position if autolayout was enabled
          if (wasAutolayout && childPositions.has(obj.id)) {
            const pos = childPositions.get(obj.id)!;
            return { ...rest, x: pos.x, y: pos.y };
          }
          return rest;
        }
        return obj;
      });

    canvas.setObjects(updatedObjects);

    // Select the children that were in the frame
    selection.deselectAll();
    childrenIds.forEach((id: string) => selection.selectObject(id, true));
    toolbar.setActiveToolbarId(null);
  };

  const handleToggleAutolayout = (frameId: string) => {
    const frame = canvas.objects.find((obj) => obj.id === frameId);
    if (!frame || frame.type !== "frame") {
      return;
    }

    const frameObj = frame as any;
    const wasAutolayout = frameObj.autoLayout;
    const layout = frameObj.layout || "hstack";

    // If turning OFF autolayout, calculate children's current flexbox positions AND frame size
    // If turning ON autolayout with grid layout, calculate appropriate size for 5 items per row
    let childPositions: Map<string, { x: number; y: number }> = new Map();
    let newFrameSize = { width: frame.width, height: frame.height };

    if (wasAutolayout) {
      const children = canvas.objects.filter((obj) => obj.parentId === frameId);
      const padding = frameObj.padding || 10;
      const gap = frameObj.gap || 10;
      const layout = frameObj.layout || "hstack";

      let currentX = frame.x + padding;
      let currentY = frame.y + padding;
      let rowHeight = 0;
      let maxX = currentX; // Track rightmost position
      let maxY = currentY; // Track bottommost position

      children.forEach((child) => {
        if (layout === "hstack") {
          childPositions.set(child.id, { x: currentX, y: currentY });
          currentX += child.width + gap;
          maxX = Math.max(maxX, currentX - gap);
          maxY = Math.max(maxY, currentY + child.height);
        } else if (layout === "vstack") {
          childPositions.set(child.id, { x: currentX, y: currentY });
          currentY += child.height + gap;
          maxX = Math.max(maxX, currentX + child.width);
          maxY = Math.max(maxY, currentY - gap);
        } else if (layout === "grid") {
          // Check if we need to wrap to next row BEFORE placing this item
          if (
            currentX + child.width > frame.x + frame.width - padding &&
            currentX > frame.x + padding
          ) {
            // Wrap to next row
            currentX = frame.x + padding;
            currentY += rowHeight + gap;
            rowHeight = 0; // Reset row height for new row
          }

          // Set position for this child
          childPositions.set(child.id, { x: currentX, y: currentY });

          // Track row height
          rowHeight = Math.max(rowHeight, child.height);

          // Update max positions
          maxX = Math.max(maxX, currentX + child.width);
          maxY = Math.max(maxY, currentY + child.height);

          // Move to next position in row
          currentX += child.width + gap;
        }
      });

      // Calculate actual frame size based on layout and tracked positions
      if (children.length > 0) {
        const borderWidth = 2; // Account for 1px border on each side

        if (layout === "hstack") {
          const totalWidth =
            children.reduce((sum, child) => sum + child.width, 0) +
            gap * (children.length - 1) +
            padding * 2 +
            borderWidth;
          const maxHeight =
            Math.max(...children.map((child) => child.height)) +
            padding * 2 +
            borderWidth;
          newFrameSize = { width: totalWidth, height: maxHeight };
        } else if (layout === "vstack") {
          const maxWidth =
            Math.max(...children.map((child) => child.width)) +
            padding * 2 +
            borderWidth;
          const totalHeight =
            children.reduce((sum, child) => sum + child.height, 0) +
            gap * (children.length - 1) +
            padding * 2 +
            borderWidth;
          newFrameSize = { width: maxWidth, height: totalHeight };
        } else {
          // grid - use actual bounding box of positioned children
          newFrameSize = {
            width: maxX - frame.x + padding + borderWidth,
            height: maxY - frame.y + padding + borderWidth,
          };
        }
      }
    } else {
      // Turning ON autolayout - calculate size based on layout type
      // If current layout is hstack (default), switch to grid
      const targetLayout = layout === "hstack" ? "grid" : layout;
      const children = canvas.objects.filter((obj) => obj.parentId === frameId);

      if (children.length > 0) {
        const padding = frameObj.padding || 10;
        const gap = frameObj.gap || 10;

        if (targetLayout === "grid") {
          // Grid layout: calculate based on actual items (max 5 per row)
          const maxItemsPerRow =
            frameObj.gridColumns === "auto-fit" ? 5 : frameObj.gridColumns || 5;
          // Use actual number of items if less than max
          const itemsPerRow = Math.min(children.length, maxItemsPerRow);

          const maxChildWidth = Math.max(...children.map((c) => c.width));
          const maxChildHeight = Math.max(...children.map((c) => c.height));

          // Account for 1px border on each side (2px total) due to box-sizing: border-box
          const borderWidth = 2;
          const calculatedWidth =
            maxChildWidth * itemsPerRow +
            gap * (itemsPerRow - 1) +
            padding * 2 +
            borderWidth;

          const numRows = Math.ceil(children.length / itemsPerRow);
          const calculatedHeight =
            maxChildHeight * numRows +
            gap * (numRows - 1) +
            padding * 2 +
            borderWidth;

          newFrameSize = { width: calculatedWidth, height: calculatedHeight };
        } else if (targetLayout === "hstack") {
          // Horizontal stack: fit all items in one row
          const borderWidth = 2;
          const totalWidth =
            children.reduce((sum, child) => sum + child.width, 0) +
            gap * (children.length - 1) +
            padding * 2 +
            borderWidth;
          const maxHeight =
            Math.max(...children.map((child) => child.height)) +
            padding * 2 +
            borderWidth;
          newFrameSize = { width: totalWidth, height: maxHeight };
        } else if (targetLayout === "vstack") {
          // Vertical stack: fit all items in one column
          const borderWidth = 2;
          const maxWidth =
            Math.max(...children.map((child) => child.width)) +
            padding * 2 +
            borderWidth;
          const totalHeight =
            children.reduce((sum, child) => sum + child.height, 0) +
            gap * (children.length - 1) +
            padding * 2 +
            borderWidth;
          newFrameSize = { width: maxWidth, height: totalHeight };
        }
      }
    }

    // Toggle autolayout and update children positions + frame size
    const updatedObjects = canvas.objects.map((obj) => {
      if (obj.id === frameId) {
        return {
          ...obj,
          autoLayout: !wasAutolayout,
          // When turning ON autolayout, default to grid layout if not already set
          layout: !wasAutolayout && layout === "hstack" ? "grid" : layout,
          padding: 10,
          gap: 10,
          // Always update frame size when toggling autolayout
          ...newFrameSize,
        };
      }
      // Update child positions if turning OFF autolayout
      if (wasAutolayout && childPositions.has(obj.id)) {
        const pos = childPositions.get(obj.id)!;
        return { ...obj, x: pos.x, y: pos.y };
      }
      return obj;
    });

    canvas.setObjects(updatedObjects);

    // Directly set selection state to avoid timing issues
    console.log("🎯 Autolayout toggled, directly setting selection:", frameId);
    selection.setSelectedIds([frameId]);
    toolbar.setActiveToolbarId(frameId);
    toolbar.setToolbarSystemActivated(true);
  };

  // Zoom artifact so it's double the width of the toolbar
  // Toolbar is roughly 350px wide when fully expanded
  const handleZoomToFitToolbar = (objectId: string) => {
    const obj = canvas.objects.find((o) => o.id === objectId);
    if (!obj) return;

    const toolbarWidth = 350; // Approximate full toolbar width
    const targetObjectWidth = toolbarWidth * 2; // Make object 2x toolbar width
    const newZoomLevel = targetObjectWidth / obj.width;

    // Clamp zoom between 0.1 and 3
    const clampedZoom = Math.max(0.1, Math.min(3, newZoomLevel));

    canvas.setZoomLevel(clampedZoom);

    // Center the object in viewport
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const viewportCenterX = rect.width / 2;
    const viewportCenterY = rect.height / 2;

    const objectCenterX = (obj.x + obj.width / 2) * clampedZoom;
    const objectCenterY = (obj.y + obj.height / 2) * clampedZoom;

    const newPanX = viewportCenterX - objectCenterX;
    const newPanY = viewportCenterY - objectCenterY;

    canvas.setPanOffset({ x: newPanX, y: newPanY });
  };

  // Mouse Events
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Panning
      e.preventDefault();
      pan.startPan(e.clientX, e.clientY);
    } else if (e.button === 0 && !drag.isDraggingObject && !drag.isResizing) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const { x: canvasX, y: canvasY } = screenToCanvas(
        e.clientX - rect.left,
        e.clientY - rect.top,
        canvas.zoomLevel,
        canvas.panOffset
      );

      if (isDrawingFrame) {
        // Frame drawing mode
        setFrameDrawStart({ x: canvasX, y: canvasY });
        setFrameDrawCurrent({ x: canvasX, y: canvasY });
      } else {
        // Box selection
        selection.startBoxSelection(canvasX, canvasY);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (pan.isPanning) {
      pan.updatePan(e.clientX, e.clientY, canvas.setPanOffset);
    } else if (drag.isResizing) {
      drag.updateResize(
        e.clientX,
        e.clientY,
        canvas.zoomLevel,
        canvas.panOffset,
        e.shiftKey // Pass shift key state for scale mode
      );
    } else if (
      isDrawingFrame &&
      frameDrawStart.x !== 0 &&
      frameDrawStart.y !== 0
    ) {
      // Update frame drawing
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const { x: canvasX, y: canvasY } = screenToCanvas(
        e.clientX - rect.left,
        e.clientY - rect.top,
        canvas.zoomLevel,
        canvas.panOffset
      );

      setFrameDrawCurrent({ x: canvasX, y: canvasY });
    } else if (selection.isSelecting) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const { x: canvasX, y: canvasY } = screenToCanvas(
        e.clientX - rect.left,
        e.clientY - rect.top,
        canvas.zoomLevel,
        canvas.panOffset
      );

      selection.updateBoxSelection(canvasX, canvasY, canvas.objects);
    }
  };

  const handleCanvasMouseUp = () => {
    if (pan.isPanning) {
      pan.endPan();
    } else if (drag.isResizing) {
      drag.endResize();
    } else if (
      isDrawingFrame &&
      frameDrawStart.x !== 0 &&
      frameDrawStart.y !== 0
    ) {
      // Create frame from drawn bounds
      const minX = Math.min(frameDrawStart.x, frameDrawCurrent.x);
      const minY = Math.min(frameDrawStart.y, frameDrawCurrent.y);
      const maxX = Math.max(frameDrawStart.x, frameDrawCurrent.x);
      const maxY = Math.max(frameDrawStart.y, frameDrawCurrent.y);
      const width = maxX - minX;
      const height = maxY - minY;

      // Only create frame if it has meaningful dimensions
      if (width > 10 && height > 10) {
        // Find objects that are within the frame bounds
        const objectsInFrame = canvas.objects.filter((obj) => {
          // Skip frames themselves to avoid nested frames for now
          if (obj.type === "frame") return false;

          // Check if object's center is within frame bounds
          const objCenterX = obj.x + obj.width / 2;
          const objCenterY = obj.y + obj.height / 2;

          return (
            objCenterX >= minX &&
            objCenterX <= maxX &&
            objCenterY >= minY &&
            objCenterY <= maxY
          );
        });

        const childrenIds = objectsInFrame.map((obj) => obj.id);
        const newFrame = createFrame(minX, minY, width, height, childrenIds);

        // Update objects to have parentId
        const updatedObjects = canvas.objects.map((obj) => {
          if (childrenIds.includes(obj.id)) {
            return { ...obj, parentId: newFrame.id };
          }
          return obj;
        });

        canvas.setObjects([...updatedObjects, newFrame]);

        // Select the new frame
        selection.deselectAll();
        selection.selectObject(newFrame.id, false);
        toolbar.setActiveToolbarId(newFrame.id);
      }

      // Reset frame drawing
      setFrameDrawStart({ x: 0, y: 0 });
      setFrameDrawCurrent({ x: 0, y: 0 });
      setIsDrawingFrame(false); // Exit frame drawing mode after creating
    } else if (selection.isSelecting) {
      const newSelectedIds = selection.endBoxSelection(canvas.objects);

      if (newSelectedIds.length > 0) {
        toolbar.setActiveToolbarId(null);
      }
    }

    drag.endObjectDrag();
  };

  const handleDragHandleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    drag.startHandleDrag(e.clientX, e.clientY);
  };

  const handleResizeStart = (corner: string, e: React.MouseEvent) => {
    e.stopPropagation();
    drag.startResize(corner, e.clientX, e.clientY);
  };

  // ===== Render =====
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#DFDFDF]">
      {/* Documentation */}
      {showDocumentation && (
        <Documentation onClose={() => setShowDocumentation(false)} />
      )}

      {/* Frame Drawing Mode Indicator */}
      {isDrawingFrame && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium">
          Frame Drawing Mode (Press F to exit)
        </div>
      )}

      {/* Header Toolbar */}
      <HeaderToolbar
        onAddCanvasNative={handleAddCanvasNative}
        onAddArtifact={handleAddArtifact}
        onAddPlaceholder={handleAddPlaceholder}
        onAddFrame={handleAddEmptyFrame}
        onOpenDocumentation={() => setShowDocumentation(true)}
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
        isDrawingFrame={isDrawingFrame}
        frameDrawStart={frameDrawStart}
        frameDrawCurrent={frameDrawCurrent}
        isDraggingObject={drag.isDraggingObject}
        isResizing={drag.isResizing}
        isDraggingHandle={drag.isDraggingHandle}
        activeObject={activeObject}
        activeToolbarId={toolbar.activeToolbarId}
        toolbarSystemActivated={toolbar.toolbarSystemActivated}
        onCanvasMouseDown={handleCanvasMouseDown}
        onCanvasMouseMove={handleCanvasMouseMove}
        onCanvasMouseUp={handleCanvasMouseUp}
        onCanvasClick={handleCanvasClick}
        onCanvasContextMenu={handleCanvasContextMenu}
        onSelect={handleSelect}
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
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onRotate={handleRotate}
        onColorTagChange={handleColorTagChange}
        onContentUpdate={handleContentUpdate}
        onSetActiveToolbar={toolbar.setActiveToolbarId}
        onActivateToolbarSystem={() => toolbar.setToolbarSystemActivated(true)}
        onToolbarHoverEnter={toolbar.handleHoverEnter}
        onToolbarHoverLeave={toolbar.handleHoverLeave}
        onZoomToFit={handleZoomToFitToolbar}
        onAIPrompt={handleAIPrompt}
        onConvertToVideo={handleConvertToVideo}
        onRerun={handleRerun}
        onReframe={handleReframe}
        onUnframe={handleUnframe}
        onToggleAutolayout={handleToggleAutolayout}
        onMore={handleMore}
        onDownload={handleDownload}
        onFrameSelection={handleFrameSelection}
        onDragHandleStart={handleDragHandleStart}
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
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={handleCloseContextMenu}
        onNewImage={() => handleAddArtifact("image")}
        onNewVideo={() => handleAddArtifact("video")}
        onNewAudio={() => handleAddArtifact("audio")}
        onNewFrame={handleAddEmptyFrame}
        onUploadMedia={() => console.log("Upload Media - TODO")}
        onCursorChat={() => console.log("Cursor Chat - TODO")}
      />
    </div>
  );
}
