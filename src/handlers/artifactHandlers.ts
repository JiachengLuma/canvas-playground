/**
 * Artifact and Placeholder Handlers
 * Handlers for creating artifacts, placeholders, and canvas natives
 */

import { CanvasObject, ArtifactType, CanvasNativeType } from "../types";
import {
  createCanvasNative,
  createFrame,
  createPlaceholder,
  completePlaceholder,
} from "../utils/objectFactory";
import { screenToCanvas } from "../utils/canvasUtils";

export interface ArtifactHandlersParams {
  addObject: (obj: CanvasObject) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  setObjects: React.Dispatch<React.SetStateAction<CanvasObject[]>>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  deselectAll: () => void;
  selectObject: (id: string, multi: boolean) => void;
  setActiveToolbarId: (id: string | null) => void;
}

export const createArtifactHandlers = (params: ArtifactHandlersParams) => {
  const {
    addObject,
    updateObject,
    setObjects,
    canvasRef,
    zoomLevel,
    panOffset,
    deselectAll,
    selectObject,
    setActiveToolbarId,
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
  const handleAddArtifact = (type: ArtifactType) => {
    const tempObj = createPlaceholder(type, 0, 0);
    const { x, y } = getViewportCenterInCanvas(tempObj.width, tempObj.height);
    const completedObj = completePlaceholder({ ...tempObj, x, y });
    addObject(completedObj);
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
    addObject(newObj);

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
  };
};

