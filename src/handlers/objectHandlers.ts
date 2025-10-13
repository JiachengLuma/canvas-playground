/**
 * Object Action Handlers
 * Handlers for basic object operations: delete, duplicate, rotate, color tag, content update
 */

import { CanvasObject, ColorTag } from "../types";

export interface ObjectHandlersParams {
  objects: CanvasObject[];
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  deleteObject: (id: string) => void;
  addObject: (obj: CanvasObject) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  setActiveToolbarId: (id: string | null) => void;
  handleHoverEnter: () => void;
}

export const createObjectHandlers = (params: ObjectHandlersParams) => {
  const {
    objects,
    selectedIds,
    setSelectedIds,
    deleteObject,
    addObject,
    updateObject,
    setActiveToolbarId,
    handleHoverEnter,
  } = params;

  const handleDelete = (id: string) => {
    const obj = objects.find((o) => o.id === id);

    // deleteObject now handles frame children automatically
    deleteObject(id);

    // Remove from selection (including children if it's a frame)
    if (obj && obj.type === "frame") {
      const frameObj = obj as any;
      const childrenIds = frameObj.children || [];
      setSelectedIds((prev) =>
        prev.filter(
          (selectedId) => selectedId !== id && !childrenIds.includes(selectedId)
        )
      );
    } else {
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    }
  };

  const handleDuplicate = (id: string) => {
    const obj = objects.find((o) => o.id === id);
    if (obj) {
      const newObj = {
        ...obj,
        id: `${Date.now()}-${Math.random()}`,
        x: obj.x + 20,
        y: obj.y + 20,
      };
      addObject(newObj);
    }
  };

  const handleRotate = (id: string) => {
    updateObject(id, {
      rotation: ((objects.find((o) => o.id === id)?.rotation || 0) + 45) % 360,
    });
  };

  const handleColorTagChange = (id: string) => {
    const obj = objects.find((o) => o.id === id);
    const tags = ["none", "red", "yellow", "green"];
    const currentIndex = tags.indexOf(obj?.colorTag || "none");
    const nextTag = tags[(currentIndex + 1) % tags.length] as ColorTag;
    updateObject(id, { colorTag: nextTag });

    // Keep toolbar visible after clicking color tag (for hover toolbar)
    // Force it multiple times to ensure it stays through re-renders
    setActiveToolbarId(id);
    handleHoverEnter();

    // Re-assert toolbar visibility after a short delay to handle any re-render issues
    setTimeout(() => {
      setActiveToolbarId(id);
      handleHoverEnter();
    }, 10);

    setTimeout(() => {
      setActiveToolbarId(id);
      handleHoverEnter();
    }, 50);
  };

  const handleContentUpdate = (id: string, content: string) => {
    updateObject(id, { content });
  };

  const handleMultiSelectColorTagChange = () => {
    if (selectedIds.length === 0) return;

    // Get the color tag of the first selected object
    const firstObj = objects.find((o) => o.id === selectedIds[0]);
    const tags = ["none", "red", "yellow", "green"];
    const currentIndex = tags.indexOf(firstObj?.colorTag || "none");
    const nextTag = tags[(currentIndex + 1) % tags.length] as ColorTag;

    // Apply the SAME next color to ALL selected objects
    selectedIds.forEach((id) => {
      updateObject(id, { colorTag: nextTag });
    });

    // Keep toolbar visible
    if (selectedIds[0]) {
      setActiveToolbarId(selectedIds[0]);
      handleHoverEnter();
    }
  };

  return {
    handleDelete,
    handleDuplicate,
    handleRotate,
    handleColorTagChange,
    handleMultiSelectColorTagChange,
    handleContentUpdate,
  };
};

