/**
 * Artifact and Placeholder Handlers
 * Handlers for creating artifacts, placeholders, and canvas natives
 */

import { CanvasObject, ArtifactType, CanvasNativeType, AttentionHead, WorkFlowDirection, ObjectMetadata } from "../types";
import {
  createCanvasNative,
  createFrame,
  createPlaceholder,
  completePlaceholder,
} from "../utils/objectFactory";
import { screenToCanvas } from "../utils/canvasUtils";
import {
  findOptimalPosition,
  placeSequentially,
  placeToRightOf,
  hasCollision,
  calculateDensity,
  findAgentFramePosition,
} from "../utils/layoutEngine";
import { LAYOUT_CONFIG } from "../config/layoutConfig";
import type { LayoutContext } from "../types";
import type { CursorPosition } from "../hooks/useCursorPosition";
import { checkAndDissolveFrames } from "../utils/agentFrameManager";

export interface ArtifactHandlersParams {
  objects: CanvasObject[];
  addObject: (obj: CanvasObject) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  setObjects: React.Dispatch<React.SetStateAction<CanvasObject[]>>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  deselectAll: () => void;
  selectObject: (id: string, multi: boolean) => void;
  setActiveToolbarId: (id: string | null) => void;
  attentionHead?: AttentionHead;
  workflowDirection?: WorkFlowDirection;
  trackObjectGenerated?: (id: string) => void;
  selectedIds?: string[];
  cursorPosition?: CursorPosition | null;
}

export const createArtifactHandlers = (params: ArtifactHandlersParams) => {
  const {
    objects,
    addObject,
    updateObject,
    setObjects,
    canvasRef,
    zoomLevel,
    panOffset,
    deselectAll,
    selectObject,
    setActiveToolbarId,
    attentionHead,
    workflowDirection,
    trackObjectGenerated,
    selectedIds = [],
    cursorPosition,
  } = params;

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
      zoomLevel,
      panOffset
    );

    // Offset by half the object's dimensions so it's centered
    return {
      x: x - objectWidth / 2,
      y: y - objectHeight / 2,
    };
  };

  // NEW: Helper to get intelligent placement using layout engine
  const getIntelligentPlacement = (
    objectWidth: number,
    objectHeight: number,
    objectType: ArtifactType | CanvasNativeType,
    sourceObjectId?: string,
    anchorObjectId?: string,
    preferredPosition?: { x: number; y: number }
  ): { x: number; y: number } => {
    const viewportCenter = getViewportCenterInCanvas(objectWidth, objectHeight);
    const excludeIds = sourceObjectId ? [sourceObjectId] : [];

    const isPositionFree = (x: number, y: number) =>
      !hasCollision(x, y, objectWidth, objectHeight, objects, excludeIds);

    const isLowDensity = (x: number, y: number, threshold = 0.4) =>
      calculateDensity(x, y, objects) <= threshold;

    const context: LayoutContext = {
      objectSize: { width: objectWidth, height: objectHeight },
      objectType,
      sourceObjectId,
    };

    // PRIORITY 0: If sourceObjectId exists (rerun/show more), ALWAYS place next to it
    // This is the highest priority - ignore cursor position completely
    if (sourceObjectId) {
      const sourceObj = objects.find((obj) => obj.id === sourceObjectId);
      
      if (sourceObj) {
        const sourceParent = sourceObj.parentId
          ? objects.find((obj) => obj.id === sourceObj.parentId)
          : undefined;

        // If source is in an autolayout frame, place inside frame
        if (sourceParent && sourceParent.type === "frame" && (sourceParent as any).autoLayout) {
          return { x: sourceObj.x, y: sourceObj.y };
        }

        // Find all items in the same cluster (source + its siblings)
        const cluster = objects.filter((obj) => {
          if (obj.id === sourceObj.id) return true;
          return obj.metadata?.generatedFrom === sourceObjectId;
        });

        if (cluster.length > 0) {
          // Place to the right of the rightmost item in cluster
          const maxRight = Math.max(...cluster.map((obj) => obj.x + obj.width));
          const candidateX = maxRight + LAYOUT_CONFIG.PLACEMENT_GAP_PX;
          const candidateY = sourceObj.y;

          // CRITICAL: Exclude entire cluster from collision detection
          // This prevents false collisions with siblings already placed
          const clusterIds = cluster.map(obj => obj.id);
          const isClusterPositionFree = (x: number, y: number) =>
            !hasCollision(x, y, objectWidth, objectHeight, objects, clusterIds);

          if (isClusterPositionFree(candidateX, candidateY)) {
            return { x: candidateX, y: candidateY };
          }
        }

        // If cluster placement fails, place to right of source
        // Also exclude cluster from collision check here
        const clusterIds = cluster.map(obj => obj.id);
        const result = placeToRightOf(sourceObj, context.objectSize, objects);
        return { x: result.x, y: result.y };
      }
    }

    // Calculate preferred position (cursor or explicit)
    const preferredTopLeft = preferredPosition
      ? preferredPosition
      : cursorPosition?.canvas
      ? {
          x: cursorPosition.canvas.x - objectWidth / 2,
          y: cursorPosition.canvas.y - objectHeight / 2,
        }
      : undefined;

    // PRIORITY 1: If cursor position exists and area is empty/low density, use it
    // This ensures right-click placement respects cursor location
    if (preferredTopLeft) {
      if (isPositionFree(preferredTopLeft.x, preferredTopLeft.y) && isLowDensity(preferredTopLeft.x, preferredTopLeft.y, 0.3)) {
        return preferredTopLeft;
      }
    }

    // PRIORITY 2: Check for anchor object (from selection)
    // Note: sourceObjectId already handled above
    const anchorObj = anchorObjectId
      ? objects.find((obj) => obj.id === anchorObjectId)
      : undefined;

    const anchorParent = anchorObj?.parentId
      ? objects.find((obj) => obj.id === anchorObj.parentId)
      : undefined;

    if (anchorObj) {
      // Only use anchor-based placement if:
      // 1. No cursor position (not right-click), OR
      // 2. Cursor is NEAR the anchor (within 300px)
      const cursorNearAnchor = preferredTopLeft
        ? Math.hypot(
            (anchorObj.x + anchorObj.width / 2) - (preferredTopLeft.x + objectWidth / 2),
            (anchorObj.y + anchorObj.height / 2) - (preferredTopLeft.y + objectHeight / 2)
          ) < 300
        : true; // No cursor position = always use anchor

      if (cursorNearAnchor) {
        if (anchorParent && anchorParent.type === "frame" && (anchorParent as any).autoLayout) {
          return { x: anchorObj.x, y: anchorObj.y };
        }

        const result = placeToRightOf(anchorObj, context.objectSize, objects);
        return { x: result.x, y: result.y };
      }
    }

    // PRIORITY 3: Cursor position even if not perfectly empty (search nearby)
    if (preferredTopLeft) {
      // Try slight offsets from cursor position
      const offsets = [
        { dx: 0, dy: 50 },
        { dx: 50, dy: 0 },
        { dx: 0, dy: -50 },
        { dx: -50, dy: 0 },
      ];
      
      for (const offset of offsets) {
        const testX = preferredTopLeft.x + offset.dx;
        const testY = preferredTopLeft.y + offset.dy;
        if (isPositionFree(testX, testY)) {
          return { x: testX, y: testY };
        }
      }
    }

    if (
      isPositionFree(viewportCenter.x, viewportCenter.y) &&
      isLowDensity(viewportCenter.x, viewportCenter.y, 0.35)
    ) {
      return viewportCenter;
    }

    const optimal = findOptimalPosition(
      context,
      objects,
      attentionHead,
      workflowDirection
    );

    if (optimal) {
      return { x: optimal.x, y: optimal.y };
    }

    // Use sequential placement (to the right of last object)
    const result = placeSequentially(context.objectSize, objects, viewportCenter);
    return { x: result.x, y: result.y };
  };

  type PlaceholderOptions = {
    sourceObjectId?: string;
    position?: { x: number; y: number };
    createdBy?: ObjectMetadata["createdBy"];
    dimensions?: { width: number; height: number };
    parentId?: string;
    anchorObjectId?: string;
  };

  const DEFAULT_TOOL_NAMES: Record<ArtifactType, { type: "model"; name: string }> = {
    image: { type: "model", name: "Gemini" },
    video: { type: "model", name: "Ray 3" },
    audio: { type: "model", name: "11 Labs" },
    document: { type: "model", name: "Cloud" },
  };

  // Canvas Native Actions
  const handleAddCanvasNative = (type: CanvasNativeType) => {
    // Create temporary object to get its dimensions
    const tempObj = createCanvasNative(type, 0, 0);
    const { x, y } = getViewportCenterInCanvas(tempObj.width, tempObj.height);
    const newObj = { ...tempObj, x, y };
    addObject(newObj);
  };

  // Add Empty Frame
  const handleAddEmptyFrame = () => {
    const defaultSize = 140;
    const { x, y } = getViewportCenterInCanvas(defaultSize, defaultSize);
    const newFrame = createFrame(x, y, defaultSize, defaultSize, []);
    addObject(newFrame);

    // Select the new frame
    deselectAll();
    selectObject(newFrame.id, false);
    setActiveToolbarId(newFrame.id);
  };

  // Artifact Actions - creates artifacts with sample content
  const handleAddArtifact = (type: ArtifactType, options?: PlaceholderOptions) => {
    const tempObj = createPlaceholder(type, 0, 0);
    const objectWidth = options?.dimensions?.width ?? tempObj.width;
    const objectHeight = options?.dimensions?.height ?? tempObj.height;
    const preferredTopLeft = options?.position
      ? {
          x: options.position.x - objectWidth / 2,
          y: options.position.y - objectHeight / 2,
        }
      : undefined;
    const placement = getIntelligentPlacement(
      objectWidth,
      objectHeight,
      type,
      options?.sourceObjectId,
      options?.anchorObjectId,
      preferredTopLeft
    );

    const generatedFrom =
      options?.sourceObjectId ?? options?.anchorObjectId ?? tempObj.metadata?.generatedFrom;

    const completedObj = completePlaceholder({
      ...tempObj,
      x: placement.x,
      y: placement.y,
      width: objectWidth,
      height: objectHeight,
      metadata: {
        ...tempObj.metadata,
        createdBy: options?.createdBy || DEFAULT_TOOL_NAMES[type],
        generatedFrom,
      },
    } as any);

    addObject(completedObj);
  };

  // Placeholder Actions - creates a loading placeholder that auto-completes
  const handleAddPlaceholder = (
    type: ArtifactType,
    options?: PlaceholderOptions
  ) => {
    const tempObj = createPlaceholder(type, 0, 0);
    const objectWidth = options?.dimensions?.width ?? tempObj.width;
    const objectHeight = options?.dimensions?.height ?? tempObj.height;
    const preferredTopLeft = options?.position
      ? {
          x: options.position.x - objectWidth / 2,
          y: options.position.y - objectHeight / 2,
        }
      : cursorPosition?.canvas
      ? {
          x: cursorPosition.canvas.x - objectWidth / 2,
          y: cursorPosition.canvas.y - objectHeight / 2,
        }
      : undefined;
    const placement = getIntelligentPlacement(
      objectWidth,
      objectHeight,
      type,
      options?.sourceObjectId,
      options?.anchorObjectId,
      preferredTopLeft
    );

    const generatedFrom =
      options?.sourceObjectId ?? options?.anchorObjectId ?? tempObj.metadata?.generatedFrom;

    const newObj = {
      ...tempObj,
      x: placement.x,
      y: placement.y,
      width: objectWidth,
      height: objectHeight,
      parentId: options?.parentId,
      metadata: {
        ...tempObj.metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: options?.createdBy || DEFAULT_TOOL_NAMES[type],
        generatedFrom,
      },
    };
    
    // If adding to a frame, update the frame's children array
    if (options?.parentId) {
      setObjects((prev) => {
        const parent = prev.find(obj => obj.id === options.parentId);
        if (parent && parent.type === 'frame') {
          const updatedParent = {
            ...parent,
            children: [...(parent.children || []), newObj.id],
          };
          return [...prev.map(obj => obj.id === options.parentId ? updatedParent : obj), newObj];
        }
        return [...prev, newObj];
      });
    } else {
      addObject(newObj);
    }

    if (trackObjectGenerated) {
      trackObjectGenerated(newObj.id);
    }

    // Animate progress over 3 seconds
    const startTime = Date.now();
    const duration = 3000; // 3 seconds

    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);

      // Update progress
      updateObject(newObj.id, {
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
        setObjects((prev) => {
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
    return newObj.id;
  };

  const handleAIPrompt = (id: string, prompt: string) => {
    console.log(`AI prompt for ${id}: ${prompt}`);
    // TODO: Implement AI generation
  };

  const handleConvertToVideo = (id: string) => {
    console.log(`Convert ${id} to video`);
  };

  const handleRerun = (id: string) => {
    const target = objects.find((obj) => obj.id === id);
    if (!target) return;

    const targetType = target.type as ArtifactType;
    if (!["image", "video", "audio", "document"].includes(targetType)) {
      return;
    }

    updateObject(id, {
      metadata: {
        ...(target.metadata || {}),
        generatedFrom: target.metadata?.generatedFrom ?? id,
        updatedAt: Date.now(),
      },
    });

    handleAddPlaceholder(targetType, {
      sourceObjectId: id,
      createdBy: target.metadata?.createdBy,
      dimensions: { width: target.width, height: target.height },
      parentId: target.parentId,
    });
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

  // Agent Frame Creation - orchestrated sequence
  const handleAddAgentFrame = () => {
    const defaultWidth = 400;
    const defaultHeight = 100; // Start small, will grow with content
    const { x, y } = getViewportCenterInCanvas(defaultWidth, defaultHeight);
    
    // Create frame ID upfront to use in placeholders
    const frameId = `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Step 0: Immediately show frame with header only (no background, no content)
    const newFrame = createFrame(x, y, defaultWidth, defaultHeight, []);
    const agentFrame = {
      ...newFrame,
      id: frameId,
      name: 'Agent Frame', // Set proper name
      createdBy: 'agent' as const,
      autoLayout: true,
      layout: 'grid' as const,
      backgroundColor: 'transparent', // Start transparent, will show when content arrives
      isAgentCreating: true,
      agentCreationStep: 0,
      padding: 20,
      gap: 20,
    };
    
    addObject(agentFrame);
    
    // Don't select yet - no toolbar/selection during creation
    deselectAll();

    // Step 1: After 2 seconds, make frame visible and add first document placeholder
    setTimeout(() => {
      // Don't select yet - keep toolbar hidden during generation
      
      // Update frame to show white background now that content is arriving
      updateObject(frameId, {
        backgroundColor: '#f6f6f6',
      });

      // Add first document placeholder
      const docPlaceholder = createPlaceholder('document', 0, 0);
      const docObj = {
        ...docPlaceholder,
        parentId: frameId,
        width: 280, // Fixed width for document
        metadata: {
          ...docPlaceholder.metadata,
          createdBy: {
            type: 'model' as const,
            name: 'Agent',
          },
        },
      };
      
      // Add document and update frame dimensions in a single state update
      setObjects((prev) => {
        const newObjects = [...prev, docObj];
        const frame = newObjects.find(obj => obj.id === frameId);
        if (frame && frame.type === 'frame') {
          const frameObj = frame as any;
          const padding = frameObj.padding || 20;
          const gap = frameObj.gap || 20;
          const children = [docObj.id];
          const allChildren = newObjects.filter(o => children.includes(o.id));
          
          // Calculate width to fit all items in ONE row for grid layout
          // With box-sizing: border-box, we need to account for border (1px on each side = 2px total)
          const borderWidth = 2;
          const totalWidth = allChildren.reduce((sum, child) => sum + child.width, 0) + 
                             (padding * 2) + // left and right padding
                             (gap * (allChildren.length - 1)) + // gaps between items
                             borderWidth; // border on both sides
          const maxHeight = Math.max(...allChildren.map(c => c.height)) + (padding * 2) + borderWidth;
          
          return newObjects.map(obj => 
            obj.id === frameId 
              ? { ...obj, children, agentCreationStep: 1, width: totalWidth, height: maxHeight }
              : obj
          );
        }
        return newObjects;
      });

      // Animate progress for document placeholder
      const startTime = Date.now();
      const duration = 3000;
      const animateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);

        updateObject(docObj.id, {
          metadata: {
            ...docObj.metadata,
            createdAt: docObj.metadata?.createdAt || Date.now(),
            updatedAt: Date.now(),
            progress,
          },
        });

        if (progress < 100) {
          requestAnimationFrame(animateProgress);
        } else {
          // Complete the placeholder
          setObjects((prev) => {
            const currentObj = prev.find((obj) => obj.id === docObj.id);
            if (!currentObj || !['image', 'video', 'audio', 'document'].includes(currentObj.type)) {
              return prev;
            }
            const completedObj = completePlaceholder(currentObj as any);
            return prev.map((obj) => (obj.id === docObj.id ? completedObj : obj));
          });
        }
      };
      requestAnimationFrame(animateProgress);
    }, 2000); // Wait 2s before showing frame with first document

    // Step 2: Add image placeholder at 4s
    setTimeout(() => {
      const imagePlaceholder = createPlaceholder('image', 0, 0);
      const imageObj = {
        ...imagePlaceholder,
        parentId: frameId,
        width: 250, // Fixed width for image
        metadata: {
          ...imagePlaceholder.metadata,
          createdBy: {
            type: 'model' as const,
            name: 'Agent',
          },
        },
      };
      
      // Add image and update frame dimensions in a single state update
      setObjects((prev) => {
        const newObjects = [...prev, imageObj];
        const frame = newObjects.find(obj => obj.id === frameId);
        if (frame && frame.type === 'frame') {
          const frameObj = frame as any;
          const padding = frameObj.padding || 20;
          const gap = frameObj.gap || 20;
          const children = [...(frame.children || []), imageObj.id];
          const allChildren = newObjects.filter(o => children.includes(o.id));
          
          // Calculate width to fit all items in ONE row for grid layout
          // With box-sizing: border-box, we need to account for border (1px on each side = 2px total)
          const borderWidth = 2;
          const totalWidth = allChildren.reduce((sum, child) => sum + child.width, 0) + 
                             (padding * 2) + // left and right padding
                             (gap * (allChildren.length - 1)) + // gaps between items
                             borderWidth; // border on both sides
          const maxHeight = Math.max(...allChildren.map(c => c.height)) + (padding * 2) + borderWidth;
          
          return newObjects.map(obj => 
            obj.id === frameId 
              ? { ...obj, children, agentCreationStep: 2, width: totalWidth, height: maxHeight }
              : obj
          );
        }
        return newObjects;
      });

      // Animate progress
      const startTime = Date.now();
      const duration = 3000;
      const animateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);

        updateObject(imageObj.id, {
          metadata: {
            ...imageObj.metadata,
            createdAt: imageObj.metadata?.createdAt || Date.now(),
            updatedAt: Date.now(),
            progress,
          },
        });

        if (progress < 100) {
          requestAnimationFrame(animateProgress);
        } else {
          setObjects((prev) => {
            const currentObj = prev.find((obj) => obj.id === imageObj.id);
            if (!currentObj || !['image', 'video', 'audio', 'document'].includes(currentObj.type)) {
              return prev;
            }
            const completedObj = completePlaceholder(currentObj as any);
            return prev.map((obj) => (obj.id === imageObj.id ? completedObj : obj));
          });
        }
      };
      requestAnimationFrame(animateProgress);
    }, 4000);

    // Step 3: Add 3 video placeholders with 500ms stagger (starting at 6s)
    // Video 1 at 6s
    setTimeout(() => {
      const videoHeight = 200;
      const videoWidth = Math.round(videoHeight * (16/9)); // 16:9 aspect ratio = ~356px
      const videoPlaceholder = createPlaceholder('video', 0, 0);
      const videoObj = {
        ...videoPlaceholder,
        parentId: frameId,
        width: videoWidth,
        height: videoHeight,
        metadata: {
          ...videoPlaceholder.metadata,
          createdBy: {
            type: 'model' as const,
            name: 'Agent',
          },
        },
      };
      
      // Add video and update frame dimensions in a single state update
      setObjects((prev) => {
        const newObjects = [...prev, videoObj];
        const frame = newObjects.find(obj => obj.id === frameId);
        if (frame && frame.type === 'frame') {
          const frameObj = frame as any;
          const padding = frameObj.padding || 20;
          const gap = frameObj.gap || 20;
          const children = [...(frame.children || []), videoObj.id];
          const allChildren = newObjects.filter(o => children.includes(o.id));
          
          // Calculate width to fit all items in ONE row for grid layout
          // With box-sizing: border-box, we need to account for border (1px on each side = 2px total)
          const borderWidth = 2;
          const totalWidth = allChildren.reduce((sum, child) => sum + child.width, 0) + 
                             (padding * 2) + // left and right padding
                             (gap * (allChildren.length - 1)) + // gaps between items
                             borderWidth; // border on both sides
          const maxHeight = Math.max(...allChildren.map(c => c.height)) + (padding * 2) + borderWidth;
          
          return newObjects.map(obj => 
            obj.id === frameId 
              ? { ...obj, children, agentCreationStep: 2, width: totalWidth, height: maxHeight }
              : obj
          );
        }
        return newObjects;
      });

      // Animate progress
      const startTime = Date.now();
      const duration = 3000;
      const animateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);

        updateObject(videoObj.id, {
          metadata: {
            ...videoObj.metadata,
            createdAt: videoObj.metadata?.createdAt || Date.now(),
            updatedAt: Date.now(),
            progress,
          },
        });

        if (progress < 100) {
          requestAnimationFrame(animateProgress);
        } else {
          setObjects((prev) => {
            const currentObj = prev.find((obj) => obj.id === videoObj.id);
            if (!currentObj || !['image', 'video', 'audio', 'document'].includes(currentObj.type)) {
              return prev;
            }
            const completedObj = completePlaceholder(currentObj as any);
            return prev.map((obj) => (obj.id === videoObj.id ? completedObj : obj));
          });
        }
      };
      requestAnimationFrame(animateProgress);
    }, 6000);

    // Video 2 at 6.5s
    setTimeout(() => {
      const videoHeight = 200;
      const videoWidth = Math.round(videoHeight * (16/9)); // 16:9 aspect ratio = ~356px
      const videoPlaceholder = createPlaceholder('video', 0, 0);
      const videoObj = {
        ...videoPlaceholder,
        parentId: frameId,
        width: videoWidth,
        height: videoHeight,
        metadata: {
          ...videoPlaceholder.metadata,
          createdBy: {
            type: 'model' as const,
            name: 'Agent',
          },
        },
      };
      
      // Add video and update frame dimensions in a single state update
      setObjects((prev) => {
        const newObjects = [...prev, videoObj];
        const frame = newObjects.find(obj => obj.id === frameId);
        if (frame && frame.type === 'frame') {
          const frameObj = frame as any;
          const padding = frameObj.padding || 20;
          const gap = frameObj.gap || 20;
          const children = [...(frame.children || []), videoObj.id];
          const allChildren = newObjects.filter(o => children.includes(o.id));
          console.log('[Agent Frame] Adding video 2. Existing children:', frame.children, 'New children:', children, 'All children:', allChildren.map(c => ({ id: c.id, type: c.type, width: c.width })));
          
          // Calculate width to fit all items in ONE row for grid layout
          // With box-sizing: border-box, we need to account for border (1px on each side = 2px total)
          const borderWidth = 2;
          const totalWidth = allChildren.reduce((sum, child) => sum + child.width, 0) + 
                             (padding * 2) + // left and right padding
                             (gap * (allChildren.length - 1)) + // gaps between items
                             borderWidth; // border on both sides
          const maxHeight = Math.max(...allChildren.map(c => c.height)) + (padding * 2) + borderWidth;
          console.log('[Agent Frame] New dimensions:', { totalWidth, maxHeight, childrenCount: allChildren.length, padding, gap, borderWidth });
          
          return newObjects.map(obj => 
            obj.id === frameId 
              ? { ...obj, children, agentCreationStep: 2, width: totalWidth, height: maxHeight }
              : obj
          );
        }
        return newObjects;
      });

      // Animate progress
      const startTime = Date.now();
      const duration = 3000;
      const animateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);

        updateObject(videoObj.id, {
          metadata: {
            ...videoObj.metadata,
            createdAt: videoObj.metadata?.createdAt || Date.now(),
            updatedAt: Date.now(),
            progress,
          },
        });

        if (progress < 100) {
          requestAnimationFrame(animateProgress);
        } else {
          setObjects((prev) => {
            const currentObj = prev.find((obj) => obj.id === videoObj.id);
            if (!currentObj || !['image', 'video', 'audio', 'document'].includes(currentObj.type)) {
              return prev;
            }
            const completedObj = completePlaceholder(currentObj as any);
            return prev.map((obj) => (obj.id === videoObj.id ? completedObj : obj));
          });
        }
      };
      requestAnimationFrame(animateProgress);
    }, 6500);

    // Video 3 at 7s
    setTimeout(() => {
      const videoHeight = 200;
      const videoWidth = Math.round(videoHeight * (16/9)); // 16:9 aspect ratio = ~356px
      const videoPlaceholder = createPlaceholder('video', 0, 0);
      const videoObj = {
        ...videoPlaceholder,
        parentId: frameId,
        width: videoWidth,
        height: videoHeight,
        metadata: {
          ...videoPlaceholder.metadata,
          createdBy: {
            type: 'model' as const,
            name: 'Agent',
          },
        },
      };
      
      // Add video and update frame dimensions in a single state update
      setObjects((prev) => {
        const newObjects = [...prev, videoObj];
        const frame = newObjects.find(obj => obj.id === frameId);
        if (frame && frame.type === 'frame') {
          const frameObj = frame as any;
          const padding = frameObj.padding || 20;
          const gap = frameObj.gap || 20;
          const children = [...(frame.children || []), videoObj.id];
          const allChildren = newObjects.filter(o => children.includes(o.id));
          console.log('[Agent Frame] Adding video 3. Existing children:', frame.children, 'New children:', children, 'All children:', allChildren.map(c => ({ id: c.id, type: c.type, width: c.width })));
          
          // Calculate width to fit all items in ONE row for grid layout
          // With box-sizing: border-box, we need to account for border (1px on each side = 2px total)
          const borderWidth = 2;
          const totalWidth = allChildren.reduce((sum, child) => sum + child.width, 0) + 
                             (padding * 2) + // left and right padding
                             (gap * (allChildren.length - 1)) + // gaps between items
                             borderWidth; // border on both sides
          const maxHeight = Math.max(...allChildren.map(c => c.height)) + (padding * 2) + borderWidth;
          console.log('[Agent Frame] New dimensions:', { totalWidth, maxHeight, childrenCount: allChildren.length, padding, gap, borderWidth });
          
          return newObjects.map(obj => 
            obj.id === frameId 
              ? { ...obj, children, agentCreationStep: 3, width: totalWidth, height: maxHeight }
              : obj
          );
        }
        return newObjects;
      });

      // Animate progress
      const startTime = Date.now();
      const duration = 3000;
      const animateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);

        updateObject(videoObj.id, {
          metadata: {
            ...videoObj.metadata,
            createdAt: videoObj.metadata?.createdAt || Date.now(),
            updatedAt: Date.now(),
            progress,
          },
        });

        if (progress < 100) {
          requestAnimationFrame(animateProgress);
        } else {
          setObjects((prev) => {
            const currentObj = prev.find((obj) => obj.id === videoObj.id);
            if (!currentObj || !['image', 'video', 'audio', 'document'].includes(currentObj.type)) {
              return prev;
            }
            const completedObj = completePlaceholder(currentObj as any);
            return prev.map((obj) => (obj.id === videoObj.id ? completedObj : obj));
          });
        }
      };
      requestAnimationFrame(animateProgress);
    }, 7000);

    // Step 4: After 11 seconds from start (1s after all loading completes), hide agent header
    // Keep white background, just stop the creating state, and NOW show toolbar
    setTimeout(() => {
      updateObject(frameId, {
        backgroundColor: '#f6f6f6', // Keep normal frame background
        isAgentCreating: false,
        agentCreationStep: 4,
      });
      
      // Now that generation is complete, select frame and show toolbar
      selectObject(frameId, false);
      setActiveToolbarId(frameId);
    }, 11000); // 11s after start (1s after last video completes at 10s)
  };

  // Simulate random agent scenario for testing
  const handleSimulateAgentScenario = () => {
    const randomArtifactType = (): ArtifactType => {
      const types: ArtifactType[] = ['image', 'video', 'audio', 'document'];
      return types[Math.floor(Math.random() * types.length)];
    };

    const scenarios = [
      // Scenario A: Agent frame with single artifact (should dissolve frame after generation)
      (frameId: string) => {
        console.log('🎲 Scenario A: Single artifact → frame dissolves');
        const type = randomArtifactType();
        
        // Show frame with background after 500ms
        setTimeout(() => {
          updateObject(frameId, {
            backgroundColor: '#f6f6f6',
          });
        }, 500);
        
        // Add placeholder at 500ms
        setTimeout(() => {
          handleAddPlaceholder(type, { parentId: frameId });
        }, 500);
        
        // After generation completes (3.5s from placeholder start), turn off header animation
        setTimeout(() => {
          updateObject(frameId, {
            isAgentCreating: false,
          });
        }, 4000);
        
        // After 500ms more, dissolve the frame
        setTimeout(() => {
          setObjects((prev) => checkAndDissolveFrames(prev));
        }, 4500);
      },
      
      // Scenario B: Agent frame with 2-4 sequential artifacts (randomized types)
      (frameId: string) => {
        const count = 2 + Math.floor(Math.random() * 3); // 2-4
        console.log(`🎲 Scenario B: ${count} sequential artifacts`);
        
        // Show frame background
        setTimeout(() => {
          updateObject(frameId, {
            backgroundColor: '#f6f6f6',
          });
        }, 500);
        
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            const type = randomArtifactType();
            handleAddPlaceholder(type, { parentId: frameId });
          }, 500 + i * 800); // Stagger by 800ms
        }
        
        // Turn off header animation after all items complete (last item starts at 500 + (count-1)*800, takes 3000ms)
        const lastItemStart = 500 + (count - 1) * 800;
        const animationDuration = 3000;
        setTimeout(() => {
          updateObject(frameId, {
            isAgentCreating: false,
          });
        }, lastItemStart + animationDuration);
      },
      
      // Scenario C: Agent frame with nested sub-frame (2-3 items in parent, 2-3 in nested)
      (frameId: string) => {
        console.log('🎲 Scenario C: Nested frames');
        
        // Show frame background
        setTimeout(() => {
          updateObject(frameId, {
            backgroundColor: '#f6f6f6',
          });
        }, 500);
        
        // Add 2 artifacts to parent frame
        setTimeout(() => {
          handleAddPlaceholder(randomArtifactType(), { parentId: frameId });
        }, 500);
        
        setTimeout(() => {
          handleAddPlaceholder(randomArtifactType(), { parentId: frameId });
        }, 1300);
        
        // Add nested sub-frame after 2s
        setTimeout(() => {
          const subFrameId = `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Calculate dimensions for nested frame based on expected content
          const nestedCount = 2 + Math.floor(Math.random() * 2); // 2-3 items
          const nestedPadding = 15;
          const nestedGap = 15;
          
          // Use smaller versions of standard artifact sizes for nested frames
          // Standard sizes: image 250×200, video 280×160, audio 250×100, doc 280×300
          // Nested sizes: scale down by ~40%
          const nestedSizes = {
            image: { width: 150, height: 120 },
            video: { width: 168, height: 96 },
            audio: { width: 150, height: 60 },
            document: { width: 168, height: 180 },
          };
          
          // For sizing calculation, use max dimensions (document is tallest/widest)
          const maxWidth = 168;
          const maxHeight = 180;
          
          // Calculate frame size to fit all items in a row (using max dimensions for safety)
          const subFrameWidth = (nestedCount * maxWidth) + ((nestedCount - 1) * nestedGap) + (nestedPadding * 2);
          const subFrameHeight = maxHeight + (nestedPadding * 2);
          
          const subFrame = createFrame(0, 0, subFrameWidth, subFrameHeight, []);
          const agentSubFrame = {
            ...subFrame,
            id: subFrameId,
            parentId: frameId,
            name: 'Sub-Agent Frame',
            createdBy: 'agent' as const,
            autoLayout: true,
            layout: 'hstack' as const,
            backgroundColor: '#e8e8e8',
            padding: nestedPadding,
            gap: nestedGap,
            isAgentCreating: true,
            width: subFrameWidth,
            height: subFrameHeight,
          };
          
          // Add sub-frame and update parent frame's children array
          setObjects((prev) => {
            const parent = prev.find(obj => obj.id === frameId);
            if (parent && parent.type === 'frame') {
              const updatedParent = {
                ...parent,
                children: [...(parent.children || []), subFrameId],
              };
              return [...prev.map(obj => obj.id === frameId ? updatedParent : obj), agentSubFrame];
            }
            return [...prev, agentSubFrame];
          });
          
          // Add 2-3 items to nested frame with proper artifact dimensions
          for (let i = 0; i < nestedCount; i++) {
            setTimeout(() => {
              const artifactType = randomArtifactType();
              const dimensions = nestedSizes[artifactType];
              
              handleAddPlaceholder(artifactType, { 
                parentId: subFrameId,
                dimensions: dimensions
              });
            }, 500 + i * 800);
          }
          
          // Turn off nested frame header animation
          const nestedLastStart = 500 + (nestedCount - 1) * 800;
          setTimeout(() => {
            updateObject(subFrameId, {
              isAgentCreating: false,
            });
          }, nestedLastStart + 3000);
        }, 2000);
        
        // Turn off parent frame header animation after everything completes
        // Last nested item finishes at: 2000 (sub-frame delay) + 500 + (nestedCount-1)*800 + 3000
        // Worst case: nestedCount = 3: 2000 + 500 + 2*800 + 3000 = 7100ms
        setTimeout(() => {
          updateObject(frameId, {
            isAgentCreating: false,
          });
        }, 7500);
      },
      
      // Scenario D: Agent frame with 5-6 artifacts (grid wrapping)
      (frameId: string) => {
        const count = 5 + Math.floor(Math.random() * 2); // 5-6
        console.log(`🎲 Scenario D: ${count} artifacts in grid`);
        
        // Show frame background
        setTimeout(() => {
          updateObject(frameId, {
            backgroundColor: '#f6f6f6',
          });
        }, 500);
        
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            const type = randomArtifactType();
            handleAddPlaceholder(type, { parentId: frameId });
          }, 500 + i * 600); // Faster stagger for many items
        }
        
        // Turn off header animation after all items complete
        const lastItemStart = 500 + (count - 1) * 600;
        setTimeout(() => {
          updateObject(frameId, {
            isAgentCreating: false,
          });
        }, lastItemStart + 3000);
      },
    ];

    // Always create parent agent frame first
    const frameId = `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Use setObjects with callback to ensure we read the LATEST state
    // This prevents race conditions when clicking "Simulate Agent" multiple times
    setObjects((currentObjects) => {
      // Use specialized agent frame placement with the CURRENT objects
      const defaultWidth = 400;
      const defaultHeight = 100;
      
      // Calculate viewport center for placement logic
      const rect = canvasRef.current?.getBoundingClientRect();
      const viewportCenter = rect
        ? {
            x: (rect.width / 2 - panOffset.x) / zoomLevel,
            y: (rect.height / 2 - panOffset.y) / zoomLevel,
          }
        : { x: 0, y: 0 };
      
      // Use specialized placement for agent frames
      // Strategy: Near attention head, stacks vertically, grows horizontally
      const placement = findAgentFramePosition(
        defaultWidth,
        defaultHeight,
        currentObjects, // Use fresh state!
        attentionHead,
        viewportCenter // Pass viewport center for distance checks
      );
      
      const { x, y } = placement;
      
      const newFrame = createFrame(x, y, defaultWidth, defaultHeight, []);
      const agentFrame = {
        ...newFrame,
        id: frameId,
        name: 'Agent Frame',
        createdBy: 'agent' as const,
        autoLayout: true,
        layout: 'grid' as const,
        backgroundColor: 'transparent',
        isAgentCreating: true,
        padding: 20,
        gap: 20,
      };
      
      // Track generation for attention
      if (trackObjectGenerated) {
        trackObjectGenerated(frameId);
      }
      
      // Return updated array with new frame
      return [...currentObjects, agentFrame];
    });
    
    // Randomly pick a scenario and execute it
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    scenario(frameId);
  };

  return {
    handleAddCanvasNative,
    handleAddEmptyFrame,
    handleAddArtifact,
    handleAddPlaceholder,
    handleAddAgentFrame,
    handleAIPrompt,
    handleConvertToVideo,
    handleRerun,
    handleReframe,
    handleMore,
    handleDownload,
    handleSimulateAgentScenario,
  };
};

