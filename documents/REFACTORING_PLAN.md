# App.tsx Refactoring Plan

## 🎯 Goal

Break down the monolithic App.tsx (~1300 lines) into modular, maintainable pieces with clear separation of concerns.

## 📁 New Structure

```
src/
├── App.tsx                      # Main orchestrator (~150 lines)
├── config/
│   ├── objectActions.ts         # Define actions per object type
│   ├── initialObjects.ts        # Initial canvas objects data
│   └── constants.ts             # App-wide constants
├── hooks/
│   ├── useCanvasState.ts        # Canvas state (objects, zoom, pan)
│   ├── useSelection.ts          # Selection logic (single, multi, box)
│   ├── useDrag.ts               # Drag & drop (objects, handles, duplicate)
│   ├── useToolbar.ts            # Toolbar visibility and timing
│   └── useKeyboardShortcuts.ts  # Keyboard event handlers
├── utils/
│   ├── canvasUtils.ts           # Pure calculations (bounds, positions)
│   ├── objectFactory.ts         # Create objects by type
│   └── transformUtils.ts        # Coordinate transformations
└── types/
    └── actions.ts               # Action type definitions
```

## 🏗️ Architecture Principles

### 1. **Action System**

Define what actions are possible for each object type and multi-select scenarios.

```typescript
// config/objectActions.ts
type ObjectAction =
  | "delete"
  | "duplicate"
  | "rotate"
  | "colorTag"
  | "download"
  | "aiPrompt"
  | "convertToVideo"
  | "rerun"
  | "reframe"
  | "more"
  | "unframe"
  | "tag";

const OBJECT_ACTIONS: Record<ObjectType, ObjectAction[]> = {
  text: ["delete", "duplicate", "rotate", "colorTag"],
  shape: ["delete", "duplicate", "rotate", "colorTag"],
  doodle: ["delete", "duplicate", "rotate", "colorTag"],
  sticky: ["delete", "duplicate", "colorTag"],
  link: ["delete", "duplicate", "colorTag"],
  pdf: ["delete", "duplicate", "colorTag", "download"],
  image: [
    "delete",
    "duplicate",
    "colorTag",
    "download",
    "aiPrompt",
    "convertToVideo",
  ],
  video: ["delete", "duplicate", "colorTag", "download", "rerun"],
  audio: ["delete", "duplicate", "colorTag", "download", "rerun"],
  document: ["delete", "duplicate", "colorTag", "download", "rerun"],
  frame: ["delete", "duplicate", "colorTag", "unframe", "download"],
};

const MULTI_SELECT_ACTIONS: ObjectAction[] = [
  "delete",
  "duplicate",
  "colorTag",
  "aiPrompt",
];
```

### 2. **Custom Hooks**

Each hook manages a specific concern with a clear API.

#### `useCanvasState`

Manages objects, zoom, and pan state.

```typescript
const {
  objects,
  addObject,
  updateObject,
  deleteObject,
  zoomLevel,
  panOffset,
  setZoomLevel,
  setPanOffset,
} = useCanvasState(initialObjects);
```

#### `useSelection`

Manages selection state and logic.

```typescript
const {
  selectedIds,
  selectObject,
  deselectAll,
  isMultiSelect,
  selectionBounds,
  // Box selection
  isSelecting,
  selectionBox,
  startBoxSelection,
  updateBoxSelection,
  endBoxSelection,
} = useSelection(objects);
```

#### `useDrag`

Manages all drag operations.

```typescript
const {
  isDraggingObject,
  isDraggingHandle,
  startObjectDrag,
  updateObjectDrag,
  endObjectDrag,
  startHandleDrag,
  updateHandleDrag,
  endHandleDrag,
} = useDrag(objects, selectedIds, setObjects);
```

#### `useToolbar`

Manages toolbar visibility and choreography.

```typescript
const {
  activeToolbarId,
  toolbarSystemActivated,
  setActiveToolbar,
  clearToolbar,
  handleHoverEnter,
  handleHoverLeave,
} = useToolbar();
```

### 3. **Utility Functions**

Pure functions for calculations.

```typescript
// utils/canvasUtils.ts
export function getSelectionBounds(
  objects: CanvasObject[],
  selectedIds: string[]
): Bounds;
export function isPointInObject(x: y, object: CanvasObject): boolean;
export function getObjectsInBox(
  objects: CanvasObject[],
  box: Box
): CanvasObject[];
export function getToolbarGap(zoomLevel: number): number;
```

### 4. **Object Factories**

Centralized object creation.

```typescript
// utils/objectFactory.ts
export function createText(x: number, y: number): TextObject;
export function createShape(
  x: number,
  y: number,
  shapeType: "circle" | "rectangle"
): ShapeObject;
export function createArtifact(
  type: ArtifactType,
  x: number,
  y: number
): ArtifactObject;
```

## 📋 Migration Steps

1. ✅ **Phase 1: Configuration** (5 files)

   - Create `config/objectActions.ts`
   - Create `config/initialObjects.ts`
   - Create `config/constants.ts`
   - Create `types/actions.ts`

2. **Phase 2: Utilities** (3 files)

   - Create `utils/canvasUtils.ts`
   - Create `utils/objectFactory.ts`
   - Create `utils/transformUtils.ts`

3. **Phase 3: Hooks** (5 files)

   - Create `hooks/useCanvasState.ts`
   - Create `hooks/useSelection.ts`
   - Create `hooks/useDrag.ts`
   - Create `hooks/useToolbar.ts`
   - Create `hooks/useKeyboardShortcuts.ts`

4. **Phase 4: Refactor App.tsx**
   - Import and use all hooks
   - Remove local implementations
   - Keep only JSX and orchestration

## 🎨 Final App.tsx Structure

```typescript
export default function App() {
  // State management via hooks
  const canvas = useCanvasState(INITIAL_OBJECTS);
  const selection = useSelection(canvas.objects);
  const drag = useDrag(
    canvas.objects,
    selection.selectedIds,
    canvas.setObjects
  );
  const toolbar = useToolbar();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onDelete: () => selection.selectedIds.forEach(canvas.deleteObject),
    // ... other shortcuts
  });

  // Derived state
  const activeObject = toolbar.activeToolbarId
    ? canvas.objects.find((obj) => obj.id === toolbar.activeToolbarId)
    : null;

  return (
    <div className="...">
      {/* Canvas */}
      {/* Objects */}
      {/* Toolbars */}
      {/* Controls */}
    </div>
  );
}
```

## 📊 Benefits

1. **Maintainability**: Each file has a single responsibility
2. **Testability**: Pure functions and isolated hooks are easy to test
3. **Reusability**: Hooks and utils can be used in other components
4. **Readability**: Clear naming and structure
5. **Scalability**: Easy to add new object types and actions
6. **Type Safety**: Strongly typed action system

## 🔄 Next Steps

After this refactoring, we can easily:

- Add new object types (just update `objectActions.ts`)
- Implement undo/redo (state management is centralized)
- Add collaborative features (hooks can emit events)
- Optimize performance (memoization in isolated hooks)
