# Canvas System Architecture

Current architecture and implementation details for Canvas Playground.

## System Overview

Canvas Playground is a comprehensive canvas system built with React and TypeScript. The architecture emphasizes clean separation of concerns, custom hooks for state management, and handler factories for business logic.

## Core Principles

1. **Modular State Management**: Each concern (selection, drag, zoom, etc.) is isolated in a custom hook
2. **Handler Factories**: Business logic extracted into reusable handler factories
3. **Scale-Aware UI**: All UI elements adapt to zoom levels for consistent visual appearance
4. **Animation Performance**: Motion values and RAF for smooth animations without re-renders
5. **Type Safety**: Comprehensive TypeScript types throughout the codebase

## Object Types

### Type Hierarchy

```typescript
type ObjectType = CanvasNativeType | ArtifactType | ContainerType;

type CanvasNativeType = "text" | "shape" | "doodle" | "sticky" | "link" | "pdf";

type ArtifactType = "image" | "video" | "audio" | "document";

type ContainerType = "frame";
```

### Base Object Structure

```typescript
interface BaseCanvasObject {
  id: string;
  type: ObjectType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  colorTag: ColorTag | null;
  parentId: string | null;
  metadata: ObjectMetadata;
}
```

### Specialized Object Types

**VideoObject**:

```typescript
interface VideoObject extends BaseCanvasObject {
  type: "video";
  content: string; // URL
  duration: number;
  createdBy: CreatedBy;
}
```

**FrameObject**:

```typescript
interface FrameObject extends BaseCanvasObject {
  type: "frame";
  createdBy: "human" | "agent";
  autoLayout: boolean;
  layout: LayoutType;
  padding: number;
  gap: number;
  children: string[];
  backgroundColor: string;
  borderRadius: number;
  gridColumns?: number | "auto-fit";
}
```

## Component Architecture

### High-Level Structure

```
App.tsx
├── Custom Hooks (state management)
│   ├── useCanvasState
│   ├── useSelection
│   ├── useDrag
│   ├── useToolbar
│   ├── usePan
│   ├── useWheel
│   ├── useKeyboardShortcuts
│   ├── useHistory
│   ├── useFrameDrawing
│   └── useContextMenu
│
├── Handler Factories (business logic)
│   ├── createObjectHandlers
│   ├── createFrameHandlers
│   ├── createArtifactHandlers
│   ├── createMouseHandlers
│   └── createCanvasHandlers
│
└── Components (UI)
    ├── CanvasLayer
    ├── HeaderToolbar
    ├── ZoomControls
    ├── CanvasContextMenu
    └── Documentation
```

### Component Breakdown

**CanvasLayer**:

- Main canvas rendering
- Transforms for zoom/pan
- Object rendering loop
- Selection box
- Frame drawing overlay

**ObjectsLayer**:

- Renders all canvas objects
- Handles z-index ordering
- Manages parent-child relationships

**UnifiedToolbarWrapper**:

- Single and multi-select toolbars
- Position calculation based on selection bounds
- Animation logic for smooth transitions
- Scale-aware sizing and compact mode

**CanvasObject**:

- Wrapper for all object types
- Renders headers, content, selection bounds
- Handles object-specific rendering
- Integrates resize handles

**VideoPlayer**:

- Custom video player with hover controls
- Scale-aware UI elements
- Progress bar with scrubbing
- Auto-play on hover

## State Management Pattern

### Hook-Based State

Each concern is isolated in a custom hook that returns state and actions:

```typescript
// Example: useSelection hook
const selection = useSelection(objects);
// Returns:
// {
//   selectedIds: string[],
//   selectObject: (id: string) => void,
//   toggleSelection: (id: string) => void,
//   clearSelection: () => void,
//   ...
// }
```

### Handler Factories

Business logic is extracted into handler factories that receive dependencies:

```typescript
const objectHandlers = createObjectHandlers({
  objects,
  setObjects,
  selectedIds,
  clearSelection,
  pushToHistory,
});

// Returns:
// {
//   handleDelete: () => void,
//   handleDuplicate: () => void,
//   handleColorTag: (color: ColorTag) => void,
//   ...
// }
```

### Benefits

1. **Testability**: Handlers can be tested in isolation
2. **Reusability**: Hooks can be composed across components
3. **Clarity**: Clear separation between state, logic, and UI
4. **Type Safety**: Full TypeScript inference
5. **Performance**: Selective re-renders based on dependency changes

## Visual System

### Rendering Pipeline

```
Canvas Transform (zoom + pan)
  └── Objects Loop
      ├── Frame objects (render first)
      │   └── Frame background
      ├── Regular objects (render second)
      │   ├── Object header (conditional)
      │   ├── Object content (type-specific)
      │   └── Object footer (metadata)
      └── Selection system (render last)
          ├── Selection bounds
          ├── Resize handles
          └── Toolbar
```

### Z-Index Management

1. Frames render at base z-index
2. Objects render at z-index based on creation order
3. Selected objects elevated z-index
4. Toolbar and handles at highest z-index

### Scale-Aware Calculations

All UI elements use scale-aware sizing:

```typescript
function getScaledSize(baseSize: number, zoomLevel: number): number {
  return baseSize / zoomLevel;
}
```

This ensures UI elements maintain consistent visual size across zoom levels.

### UI Size Classification

Objects classified by screen dimensions:

```typescript
type UISize = "tiny" | "small" | "large";

function classifyUISize(width: number, height: number): UISize {
  const minDimension = Math.min(width, height);
  if (minDimension < 30) return "tiny";
  if (minDimension < 120) return "small";
  return "large";
}
```

Classification determines:

- Whether object header is visible
- Whether toolbar is compact
- Whether video controls are shown

## Animation System

### Toolbar Position Animation

**Strategy**: Only animate when zoom causes size classification change for the same object.

**Implementation**:

- Framer Motion `useMotionValue` for position
- Spring physics for natural movement
- No animation when switching selections
- Instant snap during drag/resize

**Parameters**:

```typescript
{
  type: "spring",
  stiffness: 400,
  damping: 35,
  mass: 0.8,
}
```

### Layout Animation

**Toolbar Size Changes**:

- Framer Motion `layout` prop
- Automatic animation for width/height changes
- Smooth morphing between full and compact modes

**Video Progress Bar**:

- RequestAnimationFrame for 60fps updates
- No CSS transitions on width (instant)
- CSS transition on height (hover effect)

## Interaction System

### Event Flow

```
User Input
  └── Event Handler
      └── Hook Action
          └── Handler Factory Function
              └── State Update
                  └── Re-render
```

### Example: Object Deletion

```
User presses Delete
  └── useKeyboardShortcuts
      └── objectHandlers.handleDelete()
          └── setObjects (filter deleted)
              └── pushToHistory (for undo)
                  └── Canvas re-renders
```

### Drag System

**Architecture**:

- `useDrag` hook manages drag state
- `createMouseHandlers` provides drag logic
- Canvas handles mouse events
- Objects receive computed positions

**Features**:

- Multi-object drag
- Frame drag with children
- Constrained dragging (future)
- Snap to grid (future)

### Resize System

**8-Point Handles**:

- Top-left, top, top-right
- Left, right
- Bottom-left, bottom, bottom-right

**Logic**:

- Corner resize: diagonal
- Edge resize: single axis
- Frame resize: scale children proportionally
- Maintains minimum size constraints

## Performance Optimizations

### Rendering

1. **Selective Re-renders**: React.memo on expensive components
2. **Transform-Based Positioning**: CSS transforms for zoom/pan (GPU accelerated)
3. **Motion Values**: Framer Motion motion values bypass React renders
4. **RAF Animations**: RequestAnimationFrame for 60fps updates

### State Management

1. **Immutable Updates**: New object arrays prevent unnecessary re-renders
2. **Dependency Arrays**: Precise useEffect dependencies
3. **Refs for Non-State**: useRef for values that don't trigger renders
4. **Batched Updates**: Multiple state changes in single render cycle

### Video Player

1. **RAF Progress**: RequestAnimationFrame instead of timeupdate events
2. **Pointer Events**: Disable when not interactive
3. **Conditional Rendering**: Hide controls at small sizes
4. **Cleanup**: Proper cleanup of animation frames and event listeners

## Configuration System

### Behavior Configuration

`objectBehaviors.json` defines:

- Available actions per object type
- Action icons, labels, tooltips
- Context menu items
- Toolbar button configurations

### Benefits

1. **Declarative**: Actions defined in data, not code
2. **Extensible**: Add new actions without touching components
3. **Type-Safe**: Validated against TypeScript types
4. **Maintainable**: Single source of truth for actions

## File Structure

```
src/
├── components/
│   ├── canvas/
│   │   ├── CanvasLayer.tsx          # Main canvas
│   │   ├── ObjectsLayer.tsx         # Object rendering
│   │   └── UnifiedToolbarWrapper.tsx # Toolbar system
│   ├── objects/
│   │   └── ObjectHeader.tsx         # Editable object header
│   ├── placeholders/
│   │   ├── PrePlaceholder.tsx       # Awaiting input
│   │   ├── GeneratingPlaceholder.tsx # Loading state
│   │   └── ErrorState.tsx           # Error handling
│   ├── toolbar/
│   │   ├── ContextToolbar.tsx       # Single select
│   │   ├── HeaderToolbar.tsx        # Top bar
│   │   └── PlaceholderButtons.tsx   # Generation states
│   ├── CanvasObject.tsx             # Object wrapper
│   ├── VideoPlayer.tsx              # Custom video player
│   ├── DragHandle.tsx               # Drag/move handle
│   ├── SelectionBox.tsx             # Box selection
│   └── CanvasContextMenu.tsx        # Right-click menu
├── config/
│   ├── behaviorConfig.ts            # Runtime behavior config
│   ├── constants.ts                 # App constants
│   ├── initialObjects.ts            # Demo objects
│   └── objectBehaviors.json         # Action definitions
├── handlers/
│   ├── objectHandlers.ts            # Object CRUD logic
│   ├── frameHandlers.ts             # Frame operations
│   ├── artifactHandlers.ts          # Generation logic
│   ├── mouseHandlers.ts             # Mouse interaction logic
│   └── canvasHandlers.ts            # Canvas operations
├── hooks/
│   ├── useCanvasState.ts            # Objects, zoom, pan state
│   ├── useSelection.ts              # Selection management
│   ├── useDrag.ts                   # Drag and resize
│   ├── useToolbar.ts                # Toolbar state
│   ├── usePan.ts                    # Canvas panning
│   ├── useWheel.ts                  # Zoom via wheel
│   ├── useKeyboardShortcuts.ts      # Keyboard handlers
│   ├── useHistory.ts                # Undo/redo
│   ├── useFrameDrawing.ts           # Frame drawing mode
│   └── useContextMenu.ts            # Right-click menu
├── types/
│   ├── types.ts                     # Core type definitions
│   └── actions.ts                   # Action types
└── utils/
    ├── canvasUtils.ts               # Canvas calculations
    └── objectFactory.ts             # Object creation helpers
```

## Key Design Decisions

### 1. Motion Values for Animations

**Decision**: Use Framer Motion motion values instead of state for animations.

**Rationale**:

- No re-renders during animation
- Smooth 60fps performance
- Better for toolbar position animations

### 2. RequestAnimationFrame for Video Progress

**Decision**: Use RAF instead of timeupdate event.

**Rationale**:

- timeupdate fires only 4 times per second
- RAF provides smooth 60fps updates
- Better visual experience

### 3. Handler Factories Pattern

**Decision**: Extract business logic into handler factories.

**Rationale**:

- Testability
- Reusability
- Clear separation of concerns
- Easier to reason about

### 4. Scale-Aware UI System

**Decision**: All UI elements scale inversely with zoom.

**Rationale**:

- Consistent visual size
- Better UX at all zoom levels
- Clearer at high zoom
- Less clutter at low zoom

### 5. Hook-Based State Management

**Decision**: Use custom hooks instead of context or external state library.

**Rationale**:

- Simpler than Redux/Zustand for this scale
- Better than prop drilling
- Hooks are composable
- Good for this app size

## Testing Strategy

### Unit Tests

Test handler factories in isolation:

- Object operations
- Frame operations
- Canvas calculations
- Utility functions

### Integration Tests

Test hook interactions:

- Selection + drag
- Zoom + toolbar positioning
- Frame + child manipulation

### Visual Tests

Test UI appearance:

- Scale-aware sizing
- Animation smoothness
- Cross-browser compatibility

## Future Architecture Enhancements

### 1. Virtual Canvas

For handling thousands of objects:

- Render only visible objects
- Cull objects outside viewport
- Optimize memory usage

### 2. Command Pattern

For better undo/redo:

- Each action as command object
- Command.execute() and Command.undo()
- More granular history

### 3. Plugin System

For extensibility:

- Register custom object types
- Add custom toolbar actions
- Extend context menu

### 4. Web Workers

For expensive operations:

- Layout calculations in worker
- Export operations in worker
- Keep UI thread responsive

### 5. Canvas Rendering

For performance at scale:

- HTML Canvas for rendering
- WebGL for effects
- Maintain React for controls

## Conclusion

The current architecture provides a solid foundation for a comprehensive canvas system. The hook-based state management, handler factories, and scale-aware UI system work together to create a performant and maintainable codebase. Future enhancements can build on these patterns without major refactoring.
