/**
 * MiniCanvas Component
 * Reuses the full canvas implementation for documentation examples
 */

import { useRef, useEffect } from "react";
import { CanvasObject as CanvasObjectType } from "../types";
import { CanvasLayer } from "./canvas/CanvasLayer";
import { useCanvasState } from "../hooks/useCanvasState";
import { useSelection } from "../hooks/useSelection";
import { useDrag } from "../hooks/useDrag";
import { useToolbar } from "../hooks/useToolbar";
import { usePan } from "../hooks/usePan";
import { ZoomControls } from "./ZoomControls";
import { screenToCanvas } from "../utils/canvasUtils";

interface MiniCanvasProps {
  subsectionId: string | null;
}

// Example objects for each documentation section
const getExampleObjects = (subsectionId: string | null): CanvasObjectType[] => {
  const exampleObjects: Record<string, CanvasObjectType[]> = {
    overview: [
      {
        id: "demo-image-1",
        type: "image",
        name: "Sample Image",
        x: 50,
        y: 50,
        width: 200,
        height: 150,
        state: "idle",
        content: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
        colorTag: "green",
      } as CanvasObjectType,
      {
        id: "demo-text-1",
        type: "text",
        name: "Welcome Text",
        x: 280,
        y: 80,
        width: 150,
        height: 40,
        state: "idle",
        content: "Hello Canvas!",
        colorTag: "none",
      } as CanvasObjectType,
    ],
    navigation: [
      {
        id: "demo-pan-1",
        type: "text",
        name: "Pan Demo",
        x: 100,
        y: 100,
        width: 200,
        height: 60,
        state: "idle",
        content: "Try panning!",
        colorTag: "none",
      } as CanvasObjectType,
    ],
    "selection-modes": [
      {
        id: "demo-sel-1",
        type: "shape",
        name: "Shape 1",
        x: 50,
        y: 80,
        width: 100,
        height: 100,
        state: "idle",
        shapeType: "rectangle",
        fillColor: "#60A5FA",
        colorTag: "none",
      } as CanvasObjectType,
      {
        id: "demo-sel-2",
        type: "shape",
        name: "Shape 2",
        x: 180,
        y: 80,
        width: 100,
        height: 100,
        state: "idle",
        shapeType: "circle",
        fillColor: "#34D399",
        colorTag: "none",
      } as CanvasObjectType,
      {
        id: "demo-sel-3",
        type: "shape",
        name: "Shape 3",
        x: 310,
        y: 80,
        width: 100,
        height: 100,
        state: "idle",
        shapeType: "rectangle",
        fillColor: "#F59E0B",
        colorTag: "none",
      } as CanvasObjectType,
    ],
    "hover-behavior": [
      {
        id: "demo-hover-image",
        type: "image",
        name: "Image",
        x: 80,
        y: 80,
        width: 220,
        height: 176,
        state: "idle",
        content:
          "https://cdn.midjourney.com/c06a44a1-490a-4473-b458-3ff04e60fbba/0_0.png",
        colorTag: "none",
        metadata: {
          createdAt: Date.now() - 60000,
          updatedAt: Date.now() - 60000,
          createdBy: { type: "model", name: "Ray3" },
        },
      } as CanvasObjectType,
      {
        id: "demo-hover-pdf",
        type: "pdf",
        name: "PDF with Toolbar",
        x: 340,
        y: 80,
        width: 220,
        height: 280,
        state: "idle",
        fileUrl:
          "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        fileName: "dummy.pdf",
        colorTag: "yellow",
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          currentPage: 1,
          totalPages: 3,
        },
      } as CanvasObjectType,
      {
        id: "demo-hover-text",
        type: "text",
        name: "No Toolbar (Text)",
        x: 80,
        y: 280,
        width: 180,
        height: 50,
        state: "idle",
        content: "I don't have a toolbar",
        colorTag: "red",
      } as CanvasObjectType,
    ],
    "drag-behavior": [
      {
        id: "demo-drag-image",
        type: "image",
        name: "Image",
        x: 80,
        y: 80,
        width: 200,
        height: 160,
        state: "idle",
        content:
          "https://cdn.midjourney.com/c06a44a1-490a-4473-b458-3ff04e60fbba/0_0.png",
        colorTag: "none",
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: { type: "model", name: "Ray3" },
        },
      } as CanvasObjectType,
      {
        id: "demo-drag-text",
        type: "text",
        name: "No Drag Handle",
        x: 320,
        y: 120,
        width: 180,
        height: 60,
        state: "idle",
        content: "Drag me directly",
        colorTag: "yellow",
      } as CanvasObjectType,
      {
        id: "demo-drag-shape",
        type: "shape",
        name: "Draggable Shape",
        x: 120,
        y: 270,
        width: 120,
        height: 120,
        state: "idle",
        shapeType: "circle",
        fillColor: "#8b5cf6",
        strokeColor: "#6d28d9",
        strokeWidth: 3,
        colorTag: "none",
      } as CanvasObjectType,
    ],
    artifacts: [
      {
        id: "demo-artifact-image",
        type: "image",
        name: "Image",
        x: 60,
        y: 60,
        width: 250,
        height: 200,
        state: "idle",
        content:
          "https://cdn.midjourney.com/c06a44a1-490a-4473-b458-3ff04e60fbba/0_0.png",
        colorTag: "none",
        metadata: {
          createdAt: Date.now() - 120000,
          updatedAt: Date.now() - 120000,
          createdBy: { type: "model", name: "Ray3" },
        },
      } as CanvasObjectType,
      {
        id: "demo-artifact-video",
        type: "video",
        name: "Video",
        x: 340,
        y: 60,
        width: 280,
        height: 160,
        state: "idle",
        content:
          "https://cdn.midjourney.com/video/32f4b0f1-988c-4699-a94c-d46372789aae/0.mp4",
        duration: 5,
        colorTag: "none",
        metadata: {
          createdAt: Date.now() - 300000,
          updatedAt: Date.now() - 300000,
          createdBy: { type: "uploaded" },
        },
      } as CanvasObjectType,
      {
        id: "demo-artifact-audio",
        type: "audio",
        name: "Audio",
        x: 60,
        y: 250,
        width: 250,
        height: 100,
        state: "idle",
        content: "",
        colorTag: "none",
        metadata: {
          createdAt: Date.now() - 60000,
          updatedAt: Date.now() - 60000,
          createdBy: { type: "model", name: "Eleven Labs" },
        },
      } as CanvasObjectType,
      {
        id: "demo-artifact-document",
        type: "document",
        name: "Document",
        x: 340,
        y: 250,
        width: 280,
        height: 300,
        state: "idle",
        content:
          "This is an AI-generated document with rich content. It can contain paragraphs, formatting, and more.",
        colorTag: "none",
        metadata: {
          createdAt: Date.now() - 180000,
          updatedAt: Date.now() - 180000,
          createdBy: { type: "user", name: "Jon" },
        },
      } as CanvasObjectType,
    ],
    "canvas-natives": [
      {
        id: "demo-native-text",
        type: "text",
        name: "Text Object",
        x: 60,
        y: 60,
        width: 150,
        height: 40,
        state: "idle",
        content: "Simple Text",
        colorTag: "none",
      } as CanvasObjectType,
      {
        id: "demo-native-shape",
        type: "shape",
        name: "Shape Object",
        x: 240,
        y: 60,
        width: 120,
        height: 120,
        state: "idle",
        shapeType: "circle",
        fillColor: "#3b82f6",
        strokeColor: "#1e40af",
        strokeWidth: 3,
        colorTag: "none",
      } as CanvasObjectType,
      {
        id: "demo-native-doodle",
        type: "doodle",
        name: "Doodle Object",
        x: 390,
        y: 60,
        width: 150,
        height: 120,
        state: "idle",
        paths: "M 10,30 Q 40,5 60,30 T 110,30",
        strokeColor: "#ef4444",
        strokeWidth: 3,
        colorTag: "none",
      } as CanvasObjectType,
      {
        id: "demo-native-sticky",
        type: "sticky",
        name: "Sticky Note",
        x: 60,
        y: 210,
        width: 180,
        height: 140,
        state: "idle",
        content: "This is a sticky note for quick reminders and annotations",
        noteColor: "#fef3c7",
        noteTitle: "Sticky Note",
        noteAuthor: "Jon",
        colorTag: "none",
      } as CanvasObjectType,
      {
        id: "demo-native-link",
        type: "link",
        name: "Link Preview",
        x: 270,
        y: 210,
        width: 270,
        height: 140,
        state: "idle",
        url: "https://www.figma.com",
        linkTitle: "Figma",
        linkDescription: "The collaborative interface design tool",
        linkThumbnail:
          "https://images.unsplash.com/photo-1611162617474-5b21e879e113",
        colorTag: "none",
      } as CanvasObjectType,
      {
        id: "demo-native-pdf",
        type: "pdf",
        name: "PDF Document",
        x: 60,
        y: 380,
        width: 240,
        height: 320,
        state: "idle",
        fileUrl:
          "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        fileName: "dummy.pdf",
        colorTag: "none",
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          currentPage: 1,
          totalPages: 3,
        },
      } as CanvasObjectType,
    ],
    "color-tags": [
      {
        id: "tag-1",
        type: "sticky",
        name: "No Tag",
        x: 40,
        y: 60,
        width: 120,
        height: 120,
        state: "idle",
        noteColor: "#FEF3C7",
        colorTag: "none",
      } as CanvasObjectType,
      {
        id: "tag-2",
        type: "sticky",
        name: "Red Tag",
        x: 180,
        y: 60,
        width: 120,
        height: 120,
        state: "idle",
        noteColor: "#FEE2E2",
        colorTag: "red",
      } as CanvasObjectType,
      {
        id: "tag-3",
        type: "sticky",
        name: "Yellow Tag",
        x: 320,
        y: 60,
        width: 120,
        height: 120,
        state: "idle",
        noteColor: "#FEF3C7",
        colorTag: "yellow",
      } as CanvasObjectType,
      {
        id: "tag-4",
        type: "sticky",
        name: "Green Tag",
        x: 460,
        y: 60,
        width: 120,
        height: 120,
        state: "idle",
        noteColor: "#D1FAE5",
        colorTag: "green",
      } as CanvasObjectType,
    ],
    "keyboard-shortcuts": [
      {
        id: "demo-kb-1",
        type: "image",
        name: "Image",
        x: 80,
        y: 80,
        width: 180,
        height: 144,
        state: "idle",
        content:
          "https://cdn.midjourney.com/c06a44a1-490a-4473-b458-3ff04e60fbba/0_0.png",
        colorTag: "none",
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: { type: "model", name: "Ray3" },
        },
      } as CanvasObjectType,
      {
        id: "demo-kb-2",
        type: "text",
        name: "Alt+Drag to Duplicate",
        x: 300,
        y: 100,
        width: 200,
        height: 60,
        state: "idle",
        content: "Hold Alt and drag me",
        colorTag: "yellow",
      } as CanvasObjectType,
      {
        id: "demo-kb-3",
        type: "shape",
        name: "Shift+Click Multi-Select",
        x: 100,
        y: 260,
        width: 100,
        height: 100,
        state: "idle",
        shapeType: "rectangle",
        fillColor: "#10b981",
        strokeColor: "#059669",
        strokeWidth: 2,
        colorTag: "green",
      } as CanvasObjectType,
      {
        id: "demo-kb-4",
        type: "shape",
        name: "Box",
        x: 240,
        y: 260,
        width: 100,
        height: 100,
        state: "idle",
        shapeType: "circle",
        fillColor: "#3b82f6",
        strokeColor: "#2563eb",
        strokeWidth: 2,
        colorTag: "none",
      } as CanvasObjectType,
    ],
    "resize-behavior": [
      {
        id: "demo-resize-image",
        type: "image",
        name: "✅ Resizable Image",
        x: 80,
        y: 80,
        width: 200,
        height: 160,
        state: "idle",
        content:
          "https://cdn.midjourney.com/c06a44a1-490a-4473-b458-3ff04e60fbba/0_0.png",
        colorTag: "none",
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: { type: "model", name: "Ray3" },
        },
      } as CanvasObjectType,
      {
        id: "demo-resize-pdf",
        type: "pdf",
        name: "✅ Resizable PDF",
        x: 320,
        y: 80,
        width: 200,
        height: 250,
        state: "idle",
        fileUrl:
          "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        fileName: "dummy.pdf",
        colorTag: "yellow",
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          currentPage: 1,
          totalPages: 3,
        },
      } as CanvasObjectType,
      {
        id: "demo-resize-frame",
        type: "frame",
        name: "✅ Resizable Frame",
        x: 60,
        y: 360,
        width: 260,
        height: 140,
        state: "idle",
        createdBy: "human",
        autoLayout: false,
        layout: "hstack",
        padding: 10,
        gap: 10,
        children: ["resize-frame-child-1"],
        colorTag: "green",
      } as CanvasObjectType,
      {
        id: "resize-frame-child-1",
        type: "text",
        name: "Frame Child",
        x: 70,
        y: 380,
        width: 120,
        height: 40,
        state: "idle",
        content: "Drag frame edges",
        parentId: "demo-resize-frame",
        colorTag: "none",
      } as CanvasObjectType,
      {
        id: "demo-resize-text",
        type: "text",
        name: "❌ NOT Resizable",
        x: 360,
        y: 380,
        width: 160,
        height: 50,
        state: "idle",
        content: "Text has no resize handles",
        colorTag: "red",
      } as CanvasObjectType,
      {
        id: "demo-resize-shape",
        type: "shape",
        name: "❌ NOT Resizable",
        x: 360,
        y: 460,
        width: 100,
        height: 100,
        state: "idle",
        shapeType: "circle",
        fillColor: "#ef4444",
        strokeColor: "#dc2626",
        strokeWidth: 2,
        colorTag: "red",
      } as CanvasObjectType,
    ],
    frames: [
      {
        id: "demo-frame-1",
        type: "frame",
        name: "Demo Frame",
        x: 80,
        y: 60,
        width: 360,
        height: 200,
        state: "idle",
        createdBy: "human",
        autoLayout: true,
        layout: "hstack",
        padding: 10,
        gap: 10,
        children: ["frame-child-1", "frame-child-2", "frame-child-3"],
        colorTag: "none",
      } as CanvasObjectType,
      {
        id: "frame-child-1",
        type: "text",
        name: "Child 1",
        x: 90,
        y: 70,
        width: 100,
        height: 60,
        state: "idle",
        content: "Item 1",
        parentId: "demo-frame-1",
        colorTag: "none",
      } as CanvasObjectType,
      {
        id: "frame-child-2",
        type: "text",
        name: "Child 2",
        x: 210,
        y: 70,
        width: 100,
        height: 60,
        state: "idle",
        content: "Item 2",
        parentId: "demo-frame-1",
        colorTag: "none",
      } as CanvasObjectType,
      {
        id: "frame-child-3",
        type: "text",
        name: "Child 3",
        x: 330,
        y: 70,
        width: 100,
        height: 60,
        state: "idle",
        content: "Item 3",
        parentId: "demo-frame-1",
        colorTag: "none",
      } as CanvasObjectType,
    ],
  };

  return exampleObjects[subsectionId || "overview"] || exampleObjects.overview;
};

export function MiniCanvas({ subsectionId }: MiniCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize with example objects
  const canvas = useCanvasState(getExampleObjects(subsectionId));
  const selection = useSelection(canvas.objects);
  const drag = useDrag(
    canvas.objects,
    selection.selectedIds,
    canvas.setObjects
  );
  const toolbar = useToolbar();
  const pan = usePan();

  // Update objects when subsection changes
  useEffect(() => {
    canvas.setObjects(getExampleObjects(subsectionId));
    selection.deselectAll();
    canvas.resetZoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subsectionId]);

  // Setup wheel event listener with passive: false
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = canvasEl.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const delta = -e.deltaY * 0.01;
        const newZoomLevel = Math.max(
          0.1,
          Math.min(3, canvas.zoomLevel + delta * 0.5)
        );
        const canvasPointX = (mouseX - canvas.panOffset.x) / canvas.zoomLevel;
        const canvasPointY = (mouseY - canvas.panOffset.y) / canvas.zoomLevel;
        const newPanX = mouseX - canvasPointX * newZoomLevel;
        const newPanY = mouseY - canvasPointY * newZoomLevel;
        canvas.setZoomLevel(newZoomLevel);
        canvas.setPanOffset({ x: newPanX, y: newPanY });
      } else {
        e.preventDefault();
        const panSpeed = 1.0;
        canvas.setPanOffset((prev) => ({
          x: prev.x - e.deltaX * panSpeed,
          y: prev.y - e.deltaY * panSpeed,
        }));
      }
    };

    canvasEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      canvasEl.removeEventListener("wheel", handleWheel);
    };
  }, [canvas]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Panning
      e.preventDefault();
      pan.startPan(e.clientX, e.clientY);
    } else if (e.button === 0 && !drag.isDraggingObject && !drag.isResizing) {
      // Box selection
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const { x: canvasX, y: canvasY } = screenToCanvas(
        e.clientX - rect.left,
        e.clientY - rect.top,
        canvas.zoomLevel,
        canvas.panOffset
      );

      selection.startBoxSelection(canvasX, canvasY);
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
    } else if (selection.isSelecting) {
      // Update box selection
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
    } else if (selection.isSelecting) {
      const newSelectedIds = selection.endBoxSelection(canvas.objects);

      if (newSelectedIds.length > 0) {
        toolbar.setActiveToolbarId(null);
      }
    }
  };

  const handleCanvasClick = () => {
    // Deselect all and hide toolbar when clicking on empty canvas
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

  const handleSelect = (id: string, multi: boolean) => {
    selection.selectObject(id, multi);

    if (!multi) {
      // Single select: show toolbar for this object
      toolbar.setActiveToolbarId(id);
    } else {
      // Multi select: hide individual toolbar
      toolbar.setActiveToolbarId(null);
    }
  };

  const handleResizeStart = (corner: string, e: React.MouseEvent) => {
    e.stopPropagation();
    drag.startResize(corner, e.clientX, e.clientY);
  };

  const handleDelete = (id: string) => {
    const obj = canvas.objects.find((o) => o.id === id);

    // deleteObject now handles frame children automatically
    canvas.deleteObject(id);

    // Remove from selection (including children if it's a frame)
    if (obj && obj.type === "frame") {
      const frameObj = obj as any;
      const childrenIds = frameObj.children || [];
      selection.setSelectedIds((prev) =>
        prev.filter((selId) => selId !== id && !childrenIds.includes(selId))
      );
    } else {
      selection.setSelectedIds((prev) => prev.filter((selId) => selId !== id));
    }

    toolbar.setActiveToolbarId(null);
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
    const nextTag = tags[(currentIndex + 1) % tags.length];
    canvas.updateObject(id, { colorTag: nextTag as any });

    // Keep toolbar visible after clicking color tag (for hover toolbar)
    toolbar.setActiveToolbarId(id);
    toolbar.handleHoverEnter();
  };

  const handleContentUpdate = (id: string, content: string) => {
    canvas.updateObject(id, { content });
  };

  const handleDragHandleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    drag.startHandleDrag(e.clientX, e.clientY);
  };

  const selectedObjectTypes = canvas.objects
    .filter((obj) => selection.selectedIds.includes(obj.id))
    .map((obj) => obj.type);

  return (
    <div className="relative w-full h-full overflow-hidden">
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
        multiSelectColorTag="none"
        isDrawingFrame={false}
        frameDrawStart={{ x: 0, y: 0 }}
        frameDrawCurrent={{ x: 0, y: 0 }}
        isDraggingObject={drag.isDraggingObject}
        isResizing={drag.isResizing}
        isDraggingHandle={drag.isDraggingHandle}
        activeObject={
          toolbar.activeToolbarId
            ? canvas.objects.find(
                (obj) => obj.id === toolbar.activeToolbarId
              ) || null
            : null
        }
        activeToolbarId={toolbar.activeToolbarId}
        toolbarSystemActivated={toolbar.toolbarSystemActivated}
        onCanvasMouseDown={handleCanvasMouseDown}
        onCanvasMouseMove={handleCanvasMouseMove}
        onCanvasMouseUp={handleCanvasMouseUp}
        onCanvasClick={handleCanvasClick}
        onCanvasContextMenu={() => {}}
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
        onZoomToFit={() => {}}
        onAIPrompt={() => {}}
        onConvertToVideo={() => {}}
        onRerun={() => {}}
        onReframe={() => {}}
        onUnframe={() => {}}
        onToggleAutolayout={() => {}}
        onMore={() => {}}
        onDownload={() => {}}
        onFrameSelection={() => {}}
        onDragHandleStart={handleDragHandleStart}
      />

      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 z-50">
        <ZoomControls
          zoomLevel={canvas.zoomLevel}
          onZoomIn={canvas.zoomIn}
          onZoomOut={canvas.zoomOut}
          onResetZoom={canvas.resetZoom}
        />
      </div>

      {/* Instructions */}
      <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 text-xs text-gray-600 z-50">
        <div className="font-semibold mb-1">Interactive Demo</div>
        <div>• Click & drag objects</div>
        <div>• Alt+Drag to pan</div>
        <div>• Cmd+Scroll to zoom</div>
      </div>
    </div>
  );
}
