/**
 * Frame Handlers
 * Handlers for frame operations: frame selection, unframe, toggle autolayout
 */

import { CanvasObject } from "../types";
import { createFrame } from "../utils/objectFactory";

export interface FrameHandlersParams {
  objects: CanvasObject[];
  setObjects: React.Dispatch<React.SetStateAction<CanvasObject[]>>;
  selectedIds: string[];
  deselectAll: () => void;
  selectObject: (id: string, multi: boolean) => void;
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  setActiveToolbarId: (id: string | null) => void;
  setToolbarSystemActivated: (activated: boolean) => void;
}

export const createFrameHandlers = (params: FrameHandlersParams) => {
  const {
    objects,
    setObjects,
    selectedIds,
    deselectAll,
    selectObject,
    setSelectedIds,
    setActiveToolbarId,
    setToolbarSystemActivated,
  } = params;

  const handleFrameSelection = () => {
    if (selectedIds.length === 0) return;

    // Get all selected objects
    const selectedObjects = objects.filter((obj) =>
      selectedIds.includes(obj.id)
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
      selectedIds
    );

    // Update selected objects to have parentId
    const updatedObjects = objects.map((obj) => {
      if (selectedIds.includes(obj.id)) {
        return { ...obj, parentId: newFrame.id };
      }
      return obj;
    });

    // Add frame and update objects
    setObjects([...updatedObjects, newFrame]);

    // Directly set selection state to avoid timing issues
    console.log("🎯 Frame created, directly setting selection:", newFrame.id);
    setSelectedIds([newFrame.id]);
    setActiveToolbarId(newFrame.id);
    setToolbarSystemActivated(true);
  };

  const handleUnframe = (frameId: string) => {
    const frame = objects.find((obj) => obj.id === frameId);
    if (!frame || frame.type !== "frame") {
      return;
    }

    const frameObj = frame as any;
    const childrenIds = frameObj.children || [];
    const wasAutolayout = frameObj.autoLayout;

    // If autolayout was enabled, calculate children's current flexbox positions
    let childPositions: Map<string, { x: number; y: number }> = new Map();
    if (wasAutolayout) {
      const children = objects.filter((obj) => childrenIds.includes(obj.id));
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
    const updatedObjects = objects
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

    setObjects(updatedObjects);

    // Select the children that were in the frame
    deselectAll();
    childrenIds.forEach((id: string) => selectObject(id, true));
    setActiveToolbarId(null);
  };

  const handleToggleAutolayout = (frameId: string) => {
    const frame = objects.find((obj) => obj.id === frameId);
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
      const children = objects.filter((obj) => obj.parentId === frameId);
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
      const children = objects.filter((obj) => obj.parentId === frameId);

      if (children.length > 0) {
        const padding = frameObj.padding || 10;
        const gap = frameObj.gap || 10;

        if (targetLayout === "grid") {
          // Grid layout: calculate based on actual item sizes and flow
          const maxItemsPerRow =
            frameObj.gridColumns === "auto-fit" ? 5 : frameObj.gridColumns || 5;
          const borderWidth = 2;

          // For grid with variable-width items, simulate the actual flow
          // to find the widest row and total height
          let currentRowWidth = 0;
          let currentRowHeight = 0;
          let maxRowWidth = 0;
          let totalHeight = 0;
          let itemsInCurrentRow = 0;

          children.forEach((child, index) => {
            // Check if adding this item would exceed max items per row OR
            // if this is the first item in a new row
            if (itemsInCurrentRow >= maxItemsPerRow && itemsInCurrentRow > 0) {
              // Finalize current row
              maxRowWidth = Math.max(maxRowWidth, currentRowWidth - gap); // Remove last gap
              totalHeight += currentRowHeight + gap;
              
              // Start new row
              currentRowWidth = child.width + gap;
              currentRowHeight = child.height;
              itemsInCurrentRow = 1;
            } else {
              // Add to current row
              currentRowWidth += child.width + gap;
              currentRowHeight = Math.max(currentRowHeight, child.height);
              itemsInCurrentRow++;
            }

            // If this is the last item, finalize the row
            if (index === children.length - 1) {
              maxRowWidth = Math.max(maxRowWidth, currentRowWidth - gap);
              totalHeight += currentRowHeight;
            }
          });

          const calculatedWidth = maxRowWidth + padding * 2 + borderWidth;
          const calculatedHeight = totalHeight + padding * 2 + borderWidth;

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
    const updatedObjects = objects.map((obj) => {
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

    setObjects(updatedObjects);

    // Directly set selection state to avoid timing issues
    console.log("🎯 Autolayout toggled, directly setting selection:", frameId);
    setSelectedIds([frameId]);
    setActiveToolbarId(frameId);
    setToolbarSystemActivated(true);
  };

  const handleFrameSelectionWithAutolayout = () => {
    if (selectedIds.length === 0) return;

    // Get all selected objects
    const selectedObjects = objects.filter((obj) =>
      selectedIds.includes(obj.id)
    );

    // Calculate bounding box
    const minX = Math.min(...selectedObjects.map((obj) => obj.x));
    const minY = Math.min(...selectedObjects.map((obj) => obj.y));
    const maxX = Math.max(...selectedObjects.map((obj) => obj.x + obj.width));
    const maxY = Math.max(...selectedObjects.map((obj) => obj.y + obj.height));

    // Prepare autolayout calculation
    const padding = 10;
    const gap = 10;
    const borderWidth = 2;

    // Calculate size for grid layout (5 items per row by default)
    const maxItemsPerRow = 5;
    let currentRowWidth = 0;
    let currentRowHeight = 0;
    let maxRowWidth = 0;
    let totalHeight = 0;
    let itemsInCurrentRow = 0;

    selectedObjects.forEach((child, index) => {
      if (itemsInCurrentRow >= maxItemsPerRow && itemsInCurrentRow > 0) {
        // Finalize current row
        maxRowWidth = Math.max(maxRowWidth, currentRowWidth - gap);
        totalHeight += currentRowHeight + gap;
        
        // Start new row
        currentRowWidth = child.width + gap;
        currentRowHeight = child.height;
        itemsInCurrentRow = 1;
      } else {
        // Add to current row
        currentRowWidth += child.width + gap;
        currentRowHeight = Math.max(currentRowHeight, child.height);
        itemsInCurrentRow++;
      }

      // If this is the last item, finalize the row
      if (index === selectedObjects.length - 1) {
        maxRowWidth = Math.max(maxRowWidth, currentRowWidth - gap);
        totalHeight += currentRowHeight;
      }
    });

    const frameX = minX - padding;
    const frameY = minY - padding;
    const frameWidth = maxRowWidth + padding * 2 + borderWidth;
    const frameHeight = totalHeight + padding * 2 + borderWidth;

    // Create new frame with autolayout enabled
    const newFrame = createFrame(
      frameX,
      frameY,
      frameWidth,
      frameHeight,
      selectedIds
    );

    // Enable autolayout with grid layout
    const autolayoutFrame = {
      ...newFrame,
      autoLayout: true,
      layout: "grid" as const,
      padding: 10,
      gap: 10,
      gridColumns: 5,
    };

    // Update selected objects to have parentId
    const updatedObjects = objects.map((obj) => {
      if (selectedIds.includes(obj.id)) {
        return { ...obj, parentId: autolayoutFrame.id };
      }
      return obj;
    });

    // Add frame and update objects
    setObjects([...updatedObjects, autolayoutFrame]);

    // Directly set selection state to avoid timing issues
    console.log("🎯 Frame with autolayout created, directly setting selection:", autolayoutFrame.id);
    setSelectedIds([autolayoutFrame.id]);
    setActiveToolbarId(autolayoutFrame.id);
    setToolbarSystemActivated(true);
  };

  return {
    handleFrameSelection,
    handleUnframe,
    handleToggleAutolayout,
    handleFrameSelectionWithAutolayout,
  };
};

