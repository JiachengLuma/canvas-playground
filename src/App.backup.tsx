import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Plus,
  Image as ImageIcon,
  Video,
  Type,
  Music,
  FileText,
  Square,
  Pen,
  StickyNote,
  Link as LinkIcon,
  File,
  Sparkles,
} from "lucide-react";
import {
  CanvasObject as CanvasObjectType,
  ObjectType,
  ColorTag,
  ArtifactType,
  CanvasNativeType,
} from "./types";
import { CanvasObject } from "./components/CanvasObject";
import { ContextToolbar } from "./components/ContextToolbar";
import { ZoomControls } from "./components/ZoomControls";
import { MultiSelectToolbar } from "./components/MultiSelectToolbar";
import { SelectionBox } from "./components/SelectionBox";
import { SelectionBounds } from "./components/SelectionBounds";
import { DragHandle } from "./components/DragHandle";
import { GridPlaceholders } from "./components/GridPlaceholders";
import { Button } from "./components/ui/button";

export default function App() {
  // Initial canvas with 2 rows: Human objects and AI artifacts
  const [objects, setObjects] = useState<CanvasObjectType[]>([
    // Row 1: Human Canvas Natives (Text, Shape, Doodle, Sticky, Link, PDF)
    {
      id: "1",
      type: "text",
      name: "Text",
      x: 100,
      y: 120,
      width: 120,
      height: 60,
      content: "Text",
      state: "idle",
      metadata: { createdAt: Date.now(), updatedAt: Date.now() },
    } as CanvasObjectType,
    {
      id: "2a",
      type: "shape",
      name: "Circle",
      x: 250,
      y: 100,
      width: 140,
      height: 140,
      shapeType: "circle",
      fillColor: "#ef4444",
      state: "idle",
      metadata: { createdAt: Date.now(), updatedAt: Date.now() },
    } as CanvasObjectType,
    {
      id: "2b",
      type: "shape",
      name: "Rectangle",
      x: 320,
      y: 140,
      width: 140,
      height: 140,
      shapeType: "rectangle",
      fillColor: "#6366f1",
      state: "idle",
      metadata: { createdAt: Date.now(), updatedAt: Date.now() },
    } as CanvasObjectType,
    {
      id: "3",
      type: "doodle",
      name: "Doodle",
      x: 490,
      y: 120,
      width: 180,
      height: 120,
      paths:
        "M 20 90 Q 40 20, 80 40 M 70 130 Q 100 80, 150 120 Q 120 100, 80 120 Z",
      strokeColor: "#000000",
      strokeWidth: 2.5,
      state: "idle",
      metadata: { createdAt: Date.now(), updatedAt: Date.now() },
    } as CanvasObjectType,
    {
      id: "4",
      type: "sticky",
      name: "Sticky",
      x: 700,
      y: 100,
      width: 250,
      height: 180,
      noteColor: "#fef08a",
      noteTitle: "Note Title",
      noteAuthor: "@Oskar",
      content:
        "Can we try a bit more motion blur here...Something like the Wong Kai wei film",
      state: "idle",
      metadata: { createdAt: Date.now(), updatedAt: Date.now() },
    } as CanvasObjectType,
    {
      id: "5",
      type: "link",
      name: "Link",
      x: 980,
      y: 100,
      width: 250,
      height: 100,
      url: "https://example.com",
      title: "Example Link",
      description: "This is a link preview",
      state: "idle",
      metadata: { createdAt: Date.now(), updatedAt: Date.now() },
    } as CanvasObjectType,
    {
      id: "6",
      type: "pdf",
      name: "PDF",
      x: 1260,
      y: 100,
      width: 200,
      height: 280,
      fileUrl: "",
      fileName: "document.pdf",
      state: "idle",
      metadata: { createdAt: Date.now(), updatedAt: Date.now() },
    } as CanvasObjectType,

    // Row 2: AI Artifacts (Image, Video, Audio, Document)
    {
      id: "7",
      type: "image",
      name: "Image",
      x: 100,
      y: 420,
      width: 250,
      height: 200,
      content:
        "https://images.unsplash.com/photo-1701664368345-e3bec90acd53?w=400",
      state: "idle",
      metadata: { createdAt: Date.now(), updatedAt: Date.now() },
    } as CanvasObjectType,
    {
      id: "8",
      type: "video",
      name: "Video",
      x: 380,
      y: 420,
      width: 280,
      height: 160,
      content:
        "https://cdn.midjourney.com/video/32f4b0f1-988c-4699-a94c-d46372789aae/0.mp4",
      state: "idle",
      metadata: { createdAt: Date.now(), updatedAt: Date.now() },
    } as CanvasObjectType,
    {
      id: "9",
      type: "audio",
      name: "Audio",
      x: 690,
      y: 420,
      width: 250,
      height: 100,
      content: "",
      state: "idle",
      metadata: { createdAt: Date.now(), updatedAt: Date.now() },
    } as CanvasObjectType,
    {
      id: "10",
      type: "document",
      name: "Document",
      x: 970,
      y: 420,
      width: 280,
      height: 300,
      content:
        "This is an AI-generated document with rich content. It can contain paragraphs, formatting, and more.",
      state: "idle",
      metadata: { createdAt: Date.now(), updatedAt: Date.now() },
    } as CanvasObjectType,
  ]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeToolbarId, setActiveToolbarId] = useState<string | null>(null);
  const [toolbarSystemActivated, setToolbarSystemActivated] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.6);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionCurrent, setSelectionCurrent] = useState({ x: 0, y: 0 });
  const [hoveredBySelectionIds, setHoveredBySelectionIds] = useState<string[]>(
    []
  );
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const [dragHandlePos, setDragHandlePos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panStartPos = useRef({ x: 0, y: 0 });
  const selectionCompleted = useRef(false);
  const hasMovedMouse = useRef(false);
  const toolbarDeactivationTimeout = useRef<NodeJS.Timeout | null>(null);
  const isHoveringAnyObject = useRef(false);

  const handleSelect = (id: string, multi: boolean) => {
    if (multi) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
      // Multi-select: clear individual toolbar (show multi-select toolbar instead)
      setActiveToolbarId(null);
    } else {
      setSelectedIds([id]);
      // Single select: show the toolbar for this object
      setActiveToolbarId(id);
    }
    // Clicking activates the toolbar system
    setToolbarSystemActivated(true);
    // Clear any pending deactivation
    if (toolbarDeactivationTimeout.current) {
      clearTimeout(toolbarDeactivationTimeout.current);
      toolbarDeactivationTimeout.current = null;
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only clear selection if we didn't just complete a drag selection
    if (!selectionCompleted.current) {
      setSelectedIds([]);
      setActiveToolbarId(null);
      // Reset toolbar system when clicking canvas
      setToolbarSystemActivated(false);
      // Clear any pending deactivation
      if (toolbarDeactivationTimeout.current) {
        clearTimeout(toolbarDeactivationTimeout.current);
        toolbarDeactivationTimeout.current = null;
      }
    }
    selectionCompleted.current = false;
  };

  const handleObjectHoverEnter = () => {
    isHoveringAnyObject.current = true;
    // Clear the deactivation timeout when hovering any object
    if (toolbarDeactivationTimeout.current) {
      clearTimeout(toolbarDeactivationTimeout.current);
      toolbarDeactivationTimeout.current = null;
    }
  };

  const handleObjectHoverLeave = () => {
    isHoveringAnyObject.current = false;

    // For non-selected objects with active toolbar, clear it after a delay
    // This gives user time to move from object to toolbar
    if (activeToolbarId && !selectedIds.includes(activeToolbarId)) {
      if (toolbarDeactivationTimeout.current) {
        clearTimeout(toolbarDeactivationTimeout.current);
      }
      toolbarDeactivationTimeout.current = setTimeout(() => {
        if (!isHoveringAnyObject.current) {
          setActiveToolbarId(null);
        }
      }, 600); // 600ms grace period to move to toolbar
    }
  };

  const handleDelete = (id: string) => {
    setObjects((prev) => prev.filter((obj) => obj.id !== id));
    setSelectedIds((prev) => prev.filter((i) => i !== id));
  };

  const handleDeleteSelected = () => {
    setObjects((prev) => prev.filter((obj) => !selectedIds.includes(obj.id)));
    setSelectedIds([]);
  };

  const handleDuplicate = (id: string) => {
    const obj = objects.find((o) => o.id === id);
    if (obj) {
      const newObj: CanvasObjectType = {
        ...obj,
        id: `${Date.now()}-${Math.random()}`,
        x: obj.x + 30,
        y: obj.y + 30,
      };
      setObjects((prev) => [...prev, newObj]);
    }
  };

  const handleDuplicateSelected = () => {
    const selectedObjects = objects.filter((obj) =>
      selectedIds.includes(obj.id)
    );
    const newObjects = selectedObjects.map((obj) => ({
      ...obj,
      id: `${Date.now()}-${Math.random()}`,
      x: obj.x + 30,
      y: obj.y + 30,
    }));
    setObjects((prev) => [...prev, ...newObjects]);
  };

  const handleRotate = (id: string) => {
    setObjects((prev) =>
      prev.map((obj) =>
        obj.id === id
          ? { ...obj, rotation: ((obj.rotation || 0) + 45) % 360 }
          : obj
      )
    );
  };

  const getNextColorTag = (current: ColorTag | undefined): ColorTag => {
    switch (current) {
      case "green":
        return "yellow";
      case "yellow":
        return "red";
      case "red":
        return "none";
      default:
        return "green";
    }
  };

  const handleColorTagChange = (id: string) => {
    setObjects((prev) =>
      prev.map((obj) =>
        obj.id === id
          ? { ...obj, colorTag: getNextColorTag(obj.colorTag) }
          : obj
      )
    );
  };

  const handleColorTagChangeSelected = () => {
    // Get the first selected object's color tag and cycle all to the next state
    const firstSelected = objects.find((obj) => selectedIds.includes(obj.id));
    const nextTag = getNextColorTag(firstSelected?.colorTag);

    setObjects((prev) =>
      prev.map((obj) =>
        selectedIds.includes(obj.id) ? { ...obj, colorTag: nextTag } : obj
      )
    );
  };

  const isDuplicatingDrag = useRef(false);
  const duplicatedIds = useRef<string[]>([]);
  const currentDragIds = useRef<string[]>([]);

  const handleDragStart = (id: string, optionKey: boolean) => {
    // Determine which objects will be dragged
    // If clicking an unselected object, it becomes the only selection
    // If clicking an already-selected object, keep current selection
    const objectsToDrag = selectedIds.includes(id) ? selectedIds : [id];

    if (!selectedIds.includes(id)) {
      setSelectedIds([id]);
    }

    // If Option key is held, duplicate the objects
    if (optionKey) {
      isDuplicatingDrag.current = true;
      const selectedObjects = objects.filter((obj) =>
        objectsToDrag.includes(obj.id)
      );
      const newObjects = selectedObjects.map((obj) => ({
        ...obj,
        id: `${Date.now()}-${Math.random()}`,
      }));

      // Store the new IDs for selection after drag
      duplicatedIds.current = newObjects.map((obj) => obj.id);
      currentDragIds.current = duplicatedIds.current;

      // Add duplicates to canvas
      setObjects((prev) => [...prev, ...newObjects]);

      // Select the duplicates
      setSelectedIds(duplicatedIds.current);
    } else {
      isDuplicatingDrag.current = false;
      duplicatedIds.current = [];
      currentDragIds.current = objectsToDrag;
    }

    setIsDraggingObject(true);
  };

  const handleDrag = (dx: number, dy: number) => {
    // Use currentDragIds to handle immediate dragging after duplication
    const idsToMove =
      currentDragIds.current.length > 0 ? currentDragIds.current : selectedIds;

    setObjects((prev) =>
      prev.map((obj) =>
        idsToMove.includes(obj.id)
          ? { ...obj, x: obj.x + dx, y: obj.y + dy }
          : obj
      )
    );
  };

  const handleDragEnd = () => {
    setIsDraggingObject(false);
    isDuplicatingDrag.current = false;
    duplicatedIds.current = [];
    currentDragIds.current = [];

    // Restore toolbar for selected objects after drag
    if (selectedIds.length === 1) {
      setActiveToolbarId(selectedIds[0]);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.25));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Keyboard event handler for Delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete or Backspace key
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedIds.length > 0
      ) {
        // Prevent default backspace navigation
        e.preventDefault();
        handleDeleteSelected();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    hasMovedMouse.current = false;
    selectionCompleted.current = false;

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle mouse or Alt+Click for panning
      e.preventDefault();
      setIsPanning(true);
      panStartPos.current = { x: e.clientX, y: e.clientY };
    } else if (e.button === 0 && !isDraggingObject) {
      // Left click on canvas for selection box
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const canvasX = (e.clientX - rect.left - panOffset.x) / zoomLevel;
      const canvasY = (e.clientY - rect.top - panOffset.y) / zoomLevel;

      setIsSelecting(true);
      setSelectionStart({ x: canvasX, y: canvasY });
      setSelectionCurrent({ x: canvasX, y: canvasY });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning || isSelecting) {
      hasMovedMouse.current = true;
    }

    if (isPanning) {
      const dx = e.clientX - panStartPos.current.x;
      const dy = e.clientY - panStartPos.current.y;
      setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      panStartPos.current = { x: e.clientX, y: e.clientY };
    } else if (isSelecting) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const canvasX = (e.clientX - rect.left - panOffset.x) / zoomLevel;
      const canvasY = (e.clientY - rect.top - panOffset.y) / zoomLevel;

      setSelectionCurrent({ x: canvasX, y: canvasY });

      // Calculate which objects are currently being hovered by selection box
      const minX = Math.min(selectionStart.x, canvasX);
      const maxX = Math.max(selectionStart.x, canvasX);
      const minY = Math.min(selectionStart.y, canvasY);
      const maxY = Math.max(selectionStart.y, canvasY);

      const hoveredObjects = objects.filter((obj) => {
        const objRight = obj.x + obj.width;
        const objBottom = obj.y + obj.height;

        return !(
          obj.x > maxX ||
          objRight < minX ||
          obj.y > maxY ||
          objBottom < minY
        );
      });

      setHoveredBySelectionIds(hoveredObjects.map((obj) => obj.id));
    }
  };

  const handleCanvasMouseUp = () => {
    if (isSelecting && hasMovedMouse.current) {
      // Calculate which objects are within the selection bounds
      const minX = Math.min(selectionStart.x, selectionCurrent.x);
      const maxX = Math.max(selectionStart.x, selectionCurrent.x);
      const minY = Math.min(selectionStart.y, selectionCurrent.y);
      const maxY = Math.max(selectionStart.y, selectionCurrent.y);

      const selectedObjects = objects.filter((obj) => {
        // Check if object intersects with selection box
        const objRight = obj.x + obj.width;
        const objBottom = obj.y + obj.height;

        return !(
          obj.x > maxX ||
          objRight < minX ||
          obj.y > maxY ||
          objBottom < minY
        );
      });

      setSelectedIds(selectedObjects.map((obj) => obj.id));
      selectionCompleted.current = true;
      setActiveToolbarId(null); // Clear active toolbar on multi-select
    }

    setIsSelecting(false);
    setIsPanning(false);
    setHoveredBySelectionIds([]); // Clear selection hover state
    setIsDraggingObject(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Get mouse position relative to canvas
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate zoom delta
      const delta = -e.deltaY * 0.01;
      const newZoomLevel = Math.max(0.25, Math.min(3, zoomLevel + delta * 0.5));

      // Calculate the point in canvas space that the mouse is over
      const canvasPointX = (mouseX - panOffset.x) / zoomLevel;
      const canvasPointY = (mouseY - panOffset.y) / zoomLevel;

      // Calculate new pan offset to keep the canvas point under the mouse
      const newPanX = mouseX - canvasPointX * newZoomLevel;
      const newPanY = mouseY - canvasPointY * newZoomLevel;

      setZoomLevel(newZoomLevel);
      setPanOffset({ x: newPanX, y: newPanY });
    }
  };

  // Add AI Artifact (starts in pre-placeholder state)
  const addArtifact = (type: ArtifactType) => {
    const baseObj = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      x: 300 + Math.random() * 200,
      y: 200 + Math.random() * 200,
      width: type === "video" ? 320 : 300,
      height: type === "video" ? 180 : type === "audio" ? 100 : 200,
      state: "pre-placeholder" as const,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    const newObj: CanvasObjectType = {
      ...baseObj,
      content: "", // Empty until generated
    } as CanvasObjectType;

    setObjects((prev) => [...prev, newObj]);
  };

  // Add Canvas Native (appears immediately in idle state)
  const addCanvasNative = (type: CanvasNativeType) => {
    const baseObj = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      x: 300 + Math.random() * 200,
      y: 200 + Math.random() * 200,
      state: "idle" as const,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    let newObj: CanvasObjectType;

    switch (type) {
      case "text":
        newObj = {
          ...baseObj,
          width: 200,
          height: 100,
          content: "Double-click to edit text",
        } as CanvasObjectType;
        break;
      case "shape":
        // Randomly choose between circle and rectangle
        const isCircle = Math.random() > 0.5;
        newObj = {
          ...baseObj,
          width: 150,
          height: 150,
          shapeType: isCircle ? "circle" : "rectangle",
          fillColor: isCircle ? "#ef4444" : "#6366f1",
        } as CanvasObjectType;
        break;
      case "doodle":
        newObj = {
          ...baseObj,
          width: 200,
          height: 200,
          paths: "M 10 10 L 100 100 L 10 100 Z", // Simple triangle
          strokeColor: "#000000",
          strokeWidth: 2,
        } as CanvasObjectType;
        break;
      case "sticky":
        newObj = {
          ...baseObj,
          width: 250,
          height: 180,
          noteColor: "#fef08a", // Yellow sticky note
          noteTitle: "Note Title",
          noteAuthor: "@User",
          content: "This is a sticky note. You can write quick notes here.",
        } as CanvasObjectType;
        break;
      case "link":
        newObj = {
          ...baseObj,
          width: 300,
          height: 120,
          url: "https://example.com",
          title: "Example Link",
          description: "Click to edit URL",
        } as CanvasObjectType;
        break;
      case "pdf":
        newObj = {
          ...baseObj,
          width: 300,
          height: 400,
          fileUrl: "",
          fileName: "document.pdf",
        } as CanvasObjectType;
        break;
      default:
        newObj = baseObj as CanvasObjectType;
    }

    setObjects((prev) => [...prev, newObj]);
  };

  // Calculate center of selected objects for multi-select toolbar
  const getMultiSelectCenter = () => {
    const selectedObjects = objects.filter((obj) =>
      selectedIds.includes(obj.id)
    );
    if (selectedObjects.length === 0) return { x: 0, y: 0 };

    const centerX =
      selectedObjects.reduce((sum, obj) => sum + obj.x + obj.width / 2, 0) /
      selectedObjects.length;
    const centerY =
      selectedObjects.reduce((sum, obj) => sum + obj.y + obj.height / 2, 0) /
      selectedObjects.length;

    return {
      x: centerX * zoomLevel + panOffset.x,
      y: centerY * zoomLevel + panOffset.y,
    };
  };

  // Calculate bounding box of selected objects
  const getSelectionBounds = () => {
    const selectedObjects = objects.filter((obj) =>
      selectedIds.includes(obj.id)
    );
    if (selectedObjects.length === 0)
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedObjects.forEach((obj) => {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    });

    return { minX, minY, maxX, maxY };
  };

  // Get bounds for the object that has the drag handle (based on activeToolbarId)
  const getDragHandleBounds = () => {
    const targetObject = activeToolbarId
      ? objects.find((obj) => obj.id === activeToolbarId)
      : null;

    if (!targetObject) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

    return {
      minX: targetObject.x,
      minY: targetObject.y,
      maxX: targetObject.x + targetObject.width,
      maxY: targetObject.y + targetObject.height,
    };
  };

  const selectedObjectTypes = objects
    .filter((obj) => selectedIds.includes(obj.id))
    .map((obj) => obj.type);

  const selectionBounds = getSelectionBounds();
  const isMultiSelect = selectedIds.length > 1;

  // Get the color tag for multi-select (use first selected object's tag)
  const multiSelectColorTag = isMultiSelect
    ? objects.find((obj) => selectedIds.includes(obj.id))?.colorTag || "none"
    : "none";

  // Get active object for single-object toolbar
  const activeObject = activeToolbarId
    ? objects.find((obj) => obj.id === activeToolbarId)
    : null;

  // Dynamic toolbar gap: closer when zoomed out (1-4px range)
  const getToolbarGap = (zoom: number) => 1 + 3 * Math.min(1, zoom);

  const handleAIPrompt = (id: string, prompt: string) => {
    // Implement AI prompt logic here
    console.log(`AI prompt for object ${id}: ${prompt}`);
  };

  const handleConvertToVideo = (id: string) => {
    // Implement convert to video logic here
    console.log(`Convert object ${id} to video`);
  };

  const handleRerun = (id: string) => {
    // Implement rerun logic here
    console.log(`Rerun object ${id}`);
  };

  const handleReframe = (id: string) => {
    // Implement reframe logic here
    console.log(`Reframe object ${id}`);
  };

  const handleMore = (id: string) => {
    // Implement more logic here
    console.log(`More options for object ${id}`);
  };

  const handleDownload = (id: string) => {
    // Implement download logic here
    console.log(`Download object ${id}`);
  };

  const handleAIPromptMultiSelect = (prompt: string) => {
    // Implement AI prompt logic for multi-select here
    console.log(`AI prompt for multi-select: ${prompt}`);
  };

  // Drag handle system
  const PADDING = 10;
  const MAX_ROWS = 10;
  const MAX_COLS = 10;

  const calculateGrid = (
    selectionBounds: { minX: number; minY: number; maxX: number; maxY: number },
    dragCanvasPos: { x: number; y: number }
  ) => {
    // Selection bounds in canvas coordinates
    const selectionCanvasX = selectionBounds.minX;
    const selectionCanvasY = selectionBounds.minY;
    const itemWidth = selectionBounds.maxX - selectionBounds.minX;
    const itemHeight = selectionBounds.maxY - selectionBounds.minY;

    // Calculate how far we've dragged from the top-left corner in canvas units
    const dragDeltaX = dragCanvasPos.x - selectionCanvasX;
    const dragDeltaY = dragCanvasPos.y - selectionCanvasY;

    // Determine direction
    const xDir = dragDeltaX >= 0 ? 1 : -1;
    const yDir = dragDeltaY >= 0 ? 1 : -1;

    // Calculate number of columns and rows based on drag distance
    const numCols = Math.min(
      MAX_COLS,
      Math.max(1, Math.ceil(Math.abs(dragDeltaX) / (itemWidth + PADDING)) + 1)
    );

    const numRows = Math.min(
      MAX_ROWS,
      Math.max(1, Math.ceil(Math.abs(dragDeltaY) / (itemHeight + PADDING)) + 1)
    );

    // Calculate union rectangle in screen coordinates for display
    const selectionScreen = {
      x: selectionBounds.minX * zoomLevel + panOffset.x,
      y: selectionBounds.minY * zoomLevel + panOffset.y,
      width: itemWidth * zoomLevel,
      height: itemHeight * zoomLevel,
    };

    const dragScreen = {
      x: dragCanvasPos.x * zoomLevel + panOffset.x,
      y: dragCanvasPos.y * zoomLevel + panOffset.y,
    };

    const unionRect = {
      left: Math.min(selectionScreen.x, dragScreen.x),
      top: Math.min(selectionScreen.y, dragScreen.y),
      width: Math.abs(dragScreen.x - selectionScreen.x) + selectionScreen.width,
      height:
        Math.abs(dragScreen.y - selectionScreen.y) + selectionScreen.height,
    };

    return { unionRect, numRows, numCols, xDir, yDir, itemWidth, itemHeight };
  };

  const calculatePositions = (
    selectionBounds: { minX: number; minY: number; maxX: number; maxY: number },
    numRows: number,
    numCols: number,
    xDir: number,
    yDir: number
  ) => {
    const positions = [];

    // Start from the top-left of the selection in canvas coordinates
    const startX = selectionBounds.minX;
    const startY = selectionBounds.minY;
    const itemWidth = selectionBounds.maxX - selectionBounds.minX;
    const itemHeight = selectionBounds.maxY - selectionBounds.minY;

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        // Calculate position in canvas coordinates
        const canvasX = startX + col * xDir * (itemWidth + PADDING);
        const canvasY = startY + row * yDir * (itemHeight + PADDING);

        // Convert to screen coordinates for rendering
        positions.push({
          x: canvasX * zoomLevel + panOffset.x,
          y: canvasY * zoomLevel + panOffset.y,
        });
      }
    }

    return positions;
  };

  const handleDragHandleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingHandle(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const canvasX = (moveEvent.clientX - rect.left - panOffset.x) / zoomLevel;
      const canvasY = (moveEvent.clientY - rect.top - panOffset.y) / zoomLevel;
      setDragHandlePos({ x: canvasX, y: canvasY });
    };

    const handleMouseUp = () => {
      if (dragHandlePos) {
        const bounds = getDragHandleBounds();
        const gridInfo = calculateGrid(bounds, dragHandlePos);

        // Only create grid if more than 1x1
        if (gridInfo.numRows > 1 || gridInfo.numCols > 1) {
          createDuplicateGrid(bounds, gridInfo);
        }
      }

      setIsDraggingHandle(false);
      setDragHandlePos(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const createDuplicateGrid = (
    selectionBounds: { minX: number; minY: number; maxX: number; maxY: number },
    gridInfo: { numRows: number; numCols: number; xDir: number; yDir: number }
  ) => {
    const selectedObjects = objects.filter((obj) =>
      selectedIds.includes(obj.id)
    );
    const positions = calculatePositions(
      selectionBounds,
      gridInfo.numRows,
      gridInfo.numCols,
      gridInfo.xDir,
      gridInfo.yDir
    );

    const newObjects: CanvasObjectType[] = [];
    const originalCenter = {
      x: (selectionBounds.minX + selectionBounds.maxX) / 2,
      y: (selectionBounds.minY + selectionBounds.maxY) / 2,
    };

    // For each grid position (skip first, it's the original)
    for (let i = 1; i < positions.length; i++) {
      const gridPos = positions[i];
      const gridCanvasPos = {
        x: (gridPos.x - panOffset.x) / zoomLevel,
        y: (gridPos.y - panOffset.y) / zoomLevel,
      };

      // Calculate the offset of this grid cell from the original
      const cellOffset = {
        x: gridCanvasPos.x - selectionBounds.minX,
        y: gridCanvasPos.y - selectionBounds.minY,
      };

      // Duplicate each selected object with the offset
      for (const obj of selectedObjects) {
        const newObj: CanvasObjectType = {
          ...obj,
          id: `${Date.now()}-${Math.random()}-${i}`,
          x: obj.x + cellOffset.x,
          y: obj.y + cellOffset.y,
        };
        newObjects.push(newObj);
      }
    }

    setObjects((prev) => [...prev, ...newObjects]);
  };

  return (
    <div className="size-full flex flex-col bg-[#DFDFDF] overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <h1 className="font-semibold">Canvas Playground</h1>

          {/* Canvas Natives - Instant creation */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 mr-1">Canvas:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addCanvasNative("text")}
            >
              Text
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addCanvasNative("shape")}
            >
              Shape
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addCanvasNative("doodle")}
            >
              Doodle
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addCanvasNative("sticky")}
            >
              Sticky
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addCanvasNative("link")}
            >
              Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addCanvasNative("pdf")}
            >
              PDF
            </Button>
          </div>

          {/* AI Artifacts - Generated */}
          <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
            <span className="text-xs text-blue-600 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI:
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addArtifact("image")}
              className="border-blue-200 hover:border-blue-300"
            >
              Image
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addArtifact("video")}
              className="border-blue-200 hover:border-blue-300"
            >
              Video
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addArtifact("audio")}
              className="border-blue-200 hover:border-blue-300"
            >
              Audio
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addArtifact("document")}
              className="border-blue-200 hover:border-blue-300"
            >
              Document
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-sm">
            {objects.length} objects
          </span>
          {selectedIds.length > 0 && (
            <span className="text-blue-600 text-sm">
              {selectedIds.length} selected
            </span>
          )}
        </div>
      </header>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0, 0, 0, 0.2) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
          cursor: isSelecting ? "crosshair" : isPanning ? "grabbing" : "grab",
        }}
      >
        <div
          style={{
            transform: `scale(${zoomLevel}) translate(${
              panOffset.x / zoomLevel
            }px, ${panOffset.y / zoomLevel}px)`,
            transformOrigin: "0 0",
            width: "100%",
            height: "100%",
          }}
        >
          {objects.map((obj) => (
            <CanvasObject
              key={obj.id}
              object={obj}
              isSelected={selectedIds.includes(obj.id)}
              isPartOfMultiSelect={
                isMultiSelect && selectedIds.includes(obj.id)
              }
              isHoveredBySelection={hoveredBySelectionIds.includes(obj.id)}
              isSelecting={isSelecting}
              isDraggingAny={isDraggingObject}
              zoomLevel={zoomLevel}
              isActiveToolbar={activeToolbarId === obj.id}
              toolbarSystemActivated={toolbarSystemActivated}
              onSetActiveToolbar={setActiveToolbarId}
              onActivateToolbarSystem={() => setToolbarSystemActivated(true)}
              onObjectHoverEnter={handleObjectHoverEnter}
              onObjectHoverLeave={handleObjectHoverLeave}
              onSelect={handleSelect}
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onRotate={handleRotate}
              onColorTagChange={handleColorTagChange}
            />
          ))}

          {/* Selection bounding box for multi-select */}
          <AnimatePresence>
            {isMultiSelect && !isDraggingObject && (
              <SelectionBounds
                minX={selectionBounds.minX}
                minY={selectionBounds.minY}
                maxX={selectionBounds.maxX}
                maxY={selectionBounds.maxY}
                zoomLevel={zoomLevel}
              />
            )}
          </AnimatePresence>

          {/* Multi-select toolbar */}
          <AnimatePresence>
            {isMultiSelect && !isDraggingObject && (
              <MultiSelectToolbar
                selectedCount={selectedIds.length}
                objectTypes={selectedObjectTypes}
                zoomLevel={zoomLevel}
                bounds={selectionBounds}
                colorTag={multiSelectColorTag}
                onColorTagChange={handleColorTagChangeSelected}
                onAIPrompt={handleAIPromptMultiSelect}
                onRerun={() => console.log("Rerun multi-select")}
                onReframe={() => console.log("Reframe multi-select")}
                onMore={() => console.log("More multi-select")}
                onDownload={() => console.log("Download multi-select")}
              />
            )}
          </AnimatePresence>

          {/* Selection box */}
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
        </div>

        {/* Grid placeholders - OUTSIDE the transformed div */}
        {isDraggingHandle && dragHandlePos && (
          <GridPlaceholders
            unionRect={(() => {
              const bounds = getDragHandleBounds();
              const gridInfo = calculateGrid(bounds, dragHandlePos);
              return gridInfo.unionRect;
            })()}
            positions={(() => {
              const bounds = getDragHandleBounds();
              const gridInfo = calculateGrid(bounds, dragHandlePos);
              return calculatePositions(
                bounds,
                gridInfo.numRows,
                gridInfo.numCols,
                gridInfo.xDir,
                gridInfo.yDir
              );
            })()}
            itemWidth={(() => {
              const bounds = getDragHandleBounds();
              return (bounds.maxX - bounds.minX) * zoomLevel;
            })()}
            itemHeight={(() => {
              const bounds = getDragHandleBounds();
              return (bounds.maxY - bounds.minY) * zoomLevel;
            })()}
          />
        )}

        {/* Drag handle - rendered outside transform */}
        <AnimatePresence>
          {activeObject &&
            !isMultiSelect &&
            !isDraggingObject &&
            !isDraggingHandle && (
              <DragHandle
                x={activeObject.x * zoomLevel + panOffset.x}
                y={activeObject.y * zoomLevel + panOffset.y}
                width={activeObject.width * zoomLevel}
                height={activeObject.height * zoomLevel}
                rotation={0}
                onDragStart={handleDragHandleStart}
              />
            )}
        </AnimatePresence>

        {/* Single object toolbar - rendered outside transform to have proper z-index */}
        <AnimatePresence>
          {activeObject && !isMultiSelect && !isDraggingObject && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                left:
                  (activeObject.x + activeObject.width / 2) * zoomLevel +
                  panOffset.x,
                top:
                  (activeObject.y + activeObject.height) * zoomLevel +
                  panOffset.y,
                transform: `translate(-50%, ${getToolbarGap(zoomLevel)}px)`,
                transformOrigin: "top center",
                pointerEvents: "none",
                zIndex: 10000,
              }}
              onMouseEnter={handleObjectHoverEnter}
              onMouseLeave={handleObjectHoverLeave}
            >
              <div
                style={{
                  pointerEvents: "auto",
                  padding: "10px",
                }}
              >
                <ContextToolbar
                  objectTypes={[activeObject.type]}
                  isMultiSelect={false}
                  zoomLevel={zoomLevel}
                  colorTag={activeObject.colorTag || "none"}
                  onColorTagChange={() => handleColorTagChange(activeObject.id)}
                  onAIPrompt={(prompt) =>
                    handleAIPrompt(activeObject.id, prompt)
                  }
                  onConvertToVideo={() => handleConvertToVideo(activeObject.id)}
                  onRerun={() => handleRerun(activeObject.id)}
                  onReframe={() => handleReframe(activeObject.id)}
                  onMore={() => handleMore(activeObject.id)}
                  onDownload={() => handleDownload(activeObject.id)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Zoom controls */}
      <ZoomControls
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />
    </div>
  );
}
