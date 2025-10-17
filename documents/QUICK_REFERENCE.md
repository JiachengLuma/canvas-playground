# Quick Reference

Fast reference guide for Canvas Playground developers.

## Project Setup

```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
```

## Key File Locations

### Core Application

- `src/App.tsx` - Main application orchestration
- `src/types.ts` - Core type definitions
- `src/config/initialObjects.ts` - Demo objects

### Components

- `src/components/canvas/CanvasLayer.tsx` - Main canvas rendering
- `src/components/canvas/ObjectsLayer.tsx` - Object rendering loop
- `src/components/canvas/UnifiedToolbarWrapper.tsx` - Toolbar system
- `src/components/CanvasObject.tsx` - Individual object wrapper
- `src/components/VideoPlayer.tsx` - Custom video player

### State Hooks

- `src/hooks/useCanvasState.ts` - Objects, zoom, pan
- `src/hooks/useSelection.ts` - Selection management
- `src/hooks/useDrag.ts` - Drag and resize
- `src/hooks/useHistory.ts` - Undo/redo

### Business Logic

- `src/handlers/objectHandlers.ts` - Object CRUD operations
- `src/handlers/frameHandlers.ts` - Frame operations
- `src/handlers/mouseHandlers.ts` - Mouse interactions

### Configuration

- `src/config/objectBehaviors.json` - Action definitions
- `src/config/behaviorConfig.ts` - Runtime behavior config
- `src/config/constants.ts` - App constants

## Object Types

### Canvas Native Objects

```typescript
"text" | "shape" | "doodle" | "sticky" | "link" | "pdf";
```

### Artifacts (AI-Generated)

```typescript
"image" | "video" | "audio" | "document";
```

### Containers

```typescript
"frame";
```

## Common Type Definitions

### Base Object

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

### Frame

```typescript
interface FrameObject extends BaseCanvasObject {
  type: "frame";
  children: string[];
  padding: number;
  gap: number;
  backgroundColor: string;
  borderRadius: number;
}
```

### Video

```typescript
interface VideoObject extends BaseCanvasObject {
  type: "video";
  content: string; // URL
  duration: number;
  createdBy: CreatedBy;
}
```

## Keyboard Shortcuts

### General

- `Delete` / `Backspace` - Delete selected
- `Cmd/Ctrl + Z` - Undo
- `Cmd/Ctrl + Shift + Z` - Redo
- `Cmd/Ctrl + D` - Duplicate
- `Escape` - Deselect / cancel

### Navigation

- `Space + Drag` - Pan canvas
- `Arrow keys` - Nudge 1px
- `Shift + Arrow` - Nudge 10px
- `Mouse wheel` - Zoom

### Modes

- `F` - Frame drawing mode

## Scale-Aware UI

### Size Classification

```typescript
const minDimension = Math.min(width, height);
if (minDimension < 30) return "tiny";
if (minDimension < 120) return "small";
return "large";
```

### Screen Size Calculation

```typescript
screenWidth = objectWidth * zoomLevel;
screenHeight = objectHeight * zoomLevel;
```

### Scaled Size Calculation

```typescript
scaledSize = baseSize / zoomLevel;
```

### Visibility Rules

- **Object Header**: Shows when size > 120px
- **Full Toolbar**: Shows when size > 30px
- **Compact Toolbar**: Shows when size < 30px
- **Video Controls**: Shows when size > 40px

## Animation Parameters

### Toolbar Position Animation

```typescript
{
  type: "spring",
  stiffness: 400,  // Snappy
  damping: 35,      // Smooth
  mass: 0.8,        // Light
}
```

### When Animations Run

- Animates: Same object, zoom changes
- No animation: Selection changes, drag, resize

## Common Utilities

### Get Selected Objects

```typescript
const selectedObjects = objects.filter((obj) => selectedIds.includes(obj.id));
```

### Get Selection Bounds

```typescript
import { getSelectionBounds } from "./utils/canvasUtils";
const bounds = getSelectionBounds(selectedObjects);
```

### Create New Object

```typescript
import { createTextObject, createShapeObject } from "./utils/objectFactory";
const newText = createTextObject(x, y, width, height);
const newShape = createShapeObject(x, y, width, height, "circle");
```

### Update Object

```typescript
setObjects(
  objects.map((obj) =>
    obj.id === targetId ? { ...obj, x: newX, y: newY } : obj
  )
);
```

### Delete Objects

```typescript
setObjects(objects.filter((obj) => !selectedIds.includes(obj.id)));
```

## Adding New Object Types

1. Add type to `ObjectType` union in `types.ts`
2. Create interface extending `BaseCanvasObject`
3. Add factory function in `utils/objectFactory.ts`
4. Add rendering case in `CanvasObject.tsx`
5. Add actions in `config/objectBehaviors.json`
6. Update toolbar in `ContextToolbar.tsx`

## Adding New Actions

1. Add action definition to `config/objectBehaviors.json`:

```json
{
  "id": "myAction",
  "icon": "IconName",
  "label": "My Action",
  "tooltip": "Description"
}
```

2. Add handler in appropriate handler factory:

```typescript
const handleMyAction = () => {
  // Implementation
};
```

3. Wire up in component using action

## Debugging Tips

### Log Selection Changes

```typescript
useEffect(() => {
  console.log("Selected:", selectedIds);
}, [selectedIds]);
```

### Log Object Updates

```typescript
useEffect(() => {
  console.log("Objects:", objects.length);
}, [objects]);
```

### Check Zoom/Pan State

```typescript
console.log("Zoom:", zoomLevel, "Pan:", panOffset);
```

### Verify Scale Calculations

```typescript
const screenWidth = object.width * zoomLevel;
const scaledUI = baseSize / zoomLevel;
console.log("Screen:", screenWidth, "Scaled UI:", scaledUI);
```

## Performance Tips

1. **Use React.memo** for expensive components
2. **Use refs** for values that don't need re-renders
3. **Use motion values** for animations
4. **Batch state updates** when possible
5. **Avoid inline functions** in render
6. **Use CSS transforms** for positioning (GPU accelerated)

## Common Patterns

### Handler Factory Pattern

```typescript
export function createMyHandlers(deps: HandlerDeps) {
  const { objects, setObjects, selectedIds } = deps;

  const handleAction = () => {
    // Implementation using deps
  };

  return { handleAction };
}
```

### Custom Hook Pattern

```typescript
export function useMyFeature() {
  const [state, setState] = useState(initialState);

  const action = useCallback(() => {
    // Implementation
  }, [dependencies]);

  return { state, action };
}
```

### Scale-Aware Component

```typescript
function MyComponent({ zoomLevel, width, height }) {
  const screenWidth = width * zoomLevel;
  const size = classifyUISize(screenWidth, screenHeight);
  const scaledPadding = 10 / zoomLevel;

  if (size === "tiny") return null;

  return <div style={{ padding: scaledPadding }}>...</div>;
}
```

## Testing Checklist

### New Object Type

- [ ] Creates correctly
- [ ] Selects properly
- [ ] Drags smoothly
- [ ] Resizes correctly
- [ ] Shows appropriate toolbar
- [ ] Context menu works
- [ ] Deletes properly
- [ ] Duplicates correctly

### New Interaction

- [ ] Works with single selection
- [ ] Works with multi-selection
- [ ] Works with frames
- [ ] Works at different zoom levels
- [ ] Undo/redo works
- [ ] No performance issues

### UI Changes

- [ ] Looks good at 100% zoom
- [ ] Looks good at 25% zoom
- [ ] Looks good at 200% zoom
- [ ] Works on different screen sizes
- [ ] Animations are smooth
- [ ] No layout shift

## Common Issues

### Toolbar Not Showing

- Check if object is selected
- Verify zoom level (may be in compact mode)
- Check z-index stacking

### Objects Not Dragging

- Verify isDragging state
- Check for event handler conflicts
- Ensure object is not in locked frame

### Animations Janky

- Use motion values instead of state
- Avoid re-renders during animation
- Check for unnecessary useEffect triggers

### Scale Issues

- Verify screenSize calculation (width \* zoom)
- Check scaledSize calculation (size / zoom)
- Ensure using correct classification

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## Getting Help

1. Check [FEATURES.md](FEATURES.md) for feature documentation
2. Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
3. Check [INDEX.md](INDEX.md) for specific topics
4. Review relevant feature-specific docs
