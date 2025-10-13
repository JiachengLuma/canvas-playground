# Canvas System Architecture

## Project Vision

Build a comprehensive canvas system that handles all types of generative content with a unified interaction model. The system should elegantly handle creation, generation, loading, error, and ready states for all object types while providing powerful organization through frames and layouts.

---

## Core Object Types

### Canvas Native Things (Immediate, No Generation)

Objects created directly by users - appear immediately with no loading state:

1. **Text** - Rich text content
2. **Shape** - Basic geometric shapes (rectangle, circle, triangle, etc.)
3. **Doodle** - Freehand drawings
4. **Sticky** - Sticky note cards with title, author, and color
5. **Link** - URL previews with metadata
6. **PDF** - Uploaded PDF documents

### Artifacts (AI-Generated, Require Generation Pipeline)

Objects that go through: pre-placeholder → generating → ready/error:

7. **Image** - AI-generated images
8. **Video** - AI-generated videos
9. **Audio** - AI-generated audio clips
10. **Document** - AI-generated rich documents

### Organizational Concepts

11. **Frame** - Container with layout options

    - Can be human-made (user creates) or agent-made (AI suggests grouping)
    - AutoLayout toggle: ON (HStack/VStack/Grid) or OFF (manual positioning)

12. **Placeholder** - Visual representation during artifact generation states

---

## Object Lifecycle & State Machine

Every object follows this state machine:

```
┌─────────────────┐
│     IDLE        │  ← Normal ready state
└────────┬────────┘
         │
    [User creates]
         │
         ↓
┌─────────────────┐
│ PRE_PLACEHOLDER │  ← Clicked "Add Image" but no prompt yet
└────────┬────────┘
         │
    [Prompt given]
         │
         ↓
┌─────────────────┐
│   GENERATING    │  ← Prompt sent, waiting for result
└────────┬────────┘
         │
         ├─────────→ [Success] → READY (IDLE)
         │
         └─────────→ [Failure] → ERROR
                                    │
                              [Retry] → GENERATING
```

### State Properties

| State             | Visual Indicator            | Actions Available | Header Shows               |
| ----------------- | --------------------------- | ----------------- | -------------------------- |
| `IDLE`            | Normal content              | All actions       | Name, type icon            |
| `PRE_PLACEHOLDER` | Dashed border, prompt input | Cancel, Submit    | "Add prompt..."            |
| `GENERATING`      | Spinner, progress           | Cancel            | "Generating..." + progress |
| `ERROR`           | Red border, error icon      | Retry, Delete     | Error message              |

---

## Visual System

### Consistent Component Structure

Every canvas object has these visual layers:

```
┌────────────────────────────────────┐
│ Header (always visible)            │ ← Name, type icon, status
├────────────────────────────────────┤
│                                    │
│  Content or Placeholder            │ ← The actual content
│                                    │
├────────────────────────────────────┤
│ Footer (optional)                  │ ← Metadata, timestamps
└────────────────────────────────────┘

External (on hover/select):
- Toolbar (floating above)
- Resize Handles (8 corners/edges)
- Selection Bounds (blue outline)
```

### Header System

**Editable Header** (click to edit name):

```
┌─────────────────────────────────────┐
│ [Icon] Object Name        [Status]  │
└─────────────────────────────────────┘
```

**States**:

- Normal: Click to edit name
- Editing: Input field with save/cancel
- Draggable: Click & drag header to move entire object

**Status Indicators**:

- `●` Green dot: Ready
- `⟳` Spinner: Generating
- `⚠` Warning: Error
- `○` Gray dot: Pre-placeholder

---

## Frame System

Frames are containers that can hold multiple objects with different layout engines.

### Layout Engines

#### 1. Auto Layout

- Objects positioned manually by user
- No automatic reflow
- Default behavior (like current canvas)

#### 2. HStack (Horizontal Stack)

```
┌────────────────────────────────────┐
│ [Obj1] [Obj2] [Obj3]              │
└────────────────────────────────────┘
```

- Children arranged horizontally
- Configurable gap between items
- Configurable padding

#### 3. VStack (Vertical Stack)

```
┌───────────┐
│   [Obj1]  │
│   [Obj2]  │
│   [Obj3]  │
└───────────┘
```

- Children arranged vertically
- Configurable gap between items
- Configurable padding

#### 4. Grid (Wrapping HStack)

```
┌────────────────────────────────────┐
│ [Obj1] [Obj2] [Obj3]              │
│ [Obj4] [Obj5]                      │
└────────────────────────────────────┘
```

- Children arranged in grid with wrapping
- Configurable columns or auto-fit
- Configurable gap and padding

### Frame Properties

```typescript
interface Frame {
  id: string;
  name: string;
  layout: "auto" | "hstack" | "vstack" | "grid";
  padding: number;
  gap: number;
  children: string[]; // IDs of contained objects
  backgroundColor?: string;
  borderRadius?: number;
  // Layout-specific props
  gridColumns?: number | "auto-fit";
}
```

### Frame Actions

- **Unframe**: Remove frame but keep children
- **Change Layout**: Switch between auto/hstack/vstack/grid
- **Frame Multiple**: Select multiple objects → "Create Frame"
- **Download Frame**: Export frame + all children
- **Tag Frame**: Add color tags to entire frame

---

## Placeholder System

Two types of placeholders represent different stages of content creation.

### Pre-Placeholder

**When**: User clicks "Add Image" but hasn't provided a prompt yet

**Visual**:

```
┌─────────────────────────────────────┐
│ [Icon] New Image          [○]       │
├─────────────────────────────────────┤
│                                     │
│     ┌─────────────────────┐        │
│     │  Enter prompt...    │        │
│     └─────────────────────┘        │
│                                     │
│     [Generate] [Cancel]             │
│                                     │
└─────────────────────────────────────┘
```

**Features**:

- Dashed border (2px dashed gray)
- Centered prompt input
- Generate/Cancel buttons
- Can be resized (affects final content size)
- Can be moved
- Auto-focus on prompt input

### Generating Placeholder

**When**: Prompt submitted, generation in progress

**Visual**:

```
┌─────────────────────────────────────┐
│ [Icon] Generating Image...  [⟳ 45%]│
├─────────────────────────────────────┤
│                                     │
│        ⟳                            │
│     Generating...                   │
│     "sunset over mountains"         │
│                                     │
│     [Progress Bar ████░░░░]        │
│                                     │
│     [Cancel]                        │
│                                     │
└─────────────────────────────────────┘
```

**Features**:

- Solid border (1px solid gray)
- Animated spinner
- Progress bar (if available)
- Shows the prompt used
- Cancel button
- Shimmer/skeleton effect

### Error State

**When**: Generation failed

**Visual**:

```
┌─────────────────────────────────────┐
│ [Icon] Failed to Generate   [⚠]    │
├─────────────────────────────────────┤
│                                     │
│         ⚠                           │
│     Generation failed               │
│     "Rate limit exceeded"           │
│                                     │
│     [Retry] [Edit Prompt] [Delete] │
│                                     │
└─────────────────────────────────────┘
```

**Features**:

- Red border (2px solid red)
- Error icon
- Error message
- Retry button
- Edit prompt button
- Delete option

---

## Menu Options & Behaviors by Type

### Canvas Native Things

| Type   | On Create            | On Select           | Special Actions                   |
| ------ | -------------------- | ------------------- | --------------------------------- |
| Text   | Immediate edit mode  | Edit, Format, Tag   | Font size, color, alignment       |
| Shape  | Choose shape type    | Resize, Rotate, Tag | Fill color, stroke, corner radius |
| Doodle | Drawing mode         | Edit points, Tag    | Stroke color, width               |
| Sticky | Immediate edit mode  | Edit, Tag           | Note color, title, author         |
| Link   | URL input → preview  | Open link, Tag      | Edit URL, refresh preview         |
| PDF    | File upload → viewer | Download, Tag       | Page navigation                   |

### Artifacts (AI-Generated)

| Type     | On Create    | While Generating      | On Ready                          | On Error                   |
| -------- | ------------ | --------------------- | --------------------------------- | -------------------------- |
| Image    | Prompt input | Cancel, View progress | Download, Tag, Rerun, Edit prompt | Retry, Edit prompt, Delete |
| Video    | Prompt input | Cancel, View progress | Play, Download, Tag, Rerun        | Retry, Edit prompt, Delete |
| Audio    | Prompt input | Cancel, View progress | Play, Download, Tag, Rerun        | Retry, Edit prompt, Delete |
| Document | Prompt input | Cancel, View progress | Edit, Export, Tag, Rerun          | Retry, Edit prompt, Delete |

### Frames

| Property                  | Options                | Effect                                          |
| ------------------------- | ---------------------- | ----------------------------------------------- |
| Created By                | Human / Agent          | Visual badge indicator                          |
| AutoLayout                | On / Off               | Toggle between manual and automatic positioning |
| Layout (if AutoLayout ON) | HStack / VStack / Grid | Children reflow automatically                   |
| Padding                   | 0-100px                | Space around edges                              |
| Gap                       | 0-50px                 | Space between children                          |

**Frame Actions**: Unframe, Tag, Change Layout, Toggle AutoLayout, Download All

---

## Interaction System

### Selection States

| State            | Visual             | Toolbar       | Handles        |
| ---------------- | ------------------ | ------------- | -------------- |
| **Unselected**   | Default            | Hidden        | Hidden         |
| **Hover**        | Subtle highlight   | Show on hover | Hidden         |
| **Selected**     | Blue outline (2px) | Always show   | Show 8 handles |
| **Multi-select** | Blue outline       | Multi-toolbar | Show bounds    |

### Resize Handles

When object is selected, show 8 resize handles:

```
TL ─── TM ─── TR
│              │
ML      ○      MR  ← ○ = center drag handle
│              │
BL ─── BM ─── BR
```

**Behaviors**:

- Corner handles: Resize proportionally (maintain aspect ratio if holding Shift)
- Edge handles: Resize in one dimension
- Center handle: Move entire object (alternative to dragging body)

### Drag Behaviors

1. **Drag Body**: Move object (if not in frame with fixed layout)
2. **Drag Header**: Move object (always works, even in frames)
3. **Drag Handle**: Resize object from that handle
4. **Drag to Select**: Draw selection box to multi-select

### Keyboard Shortcuts

- `Delete` / `Backspace`: Delete selected
- `Cmd+D`: Duplicate selected
- `Cmd+G`: Group selected into frame
- `Cmd+Shift+G`: Unframe selected frame
- `Cmd+Enter`: Confirm prompt in pre-placeholder
- `Escape`: Cancel editing/deselect
- Arrow keys: Nudge selected objects
- `Shift+Arrow`: Nudge by 10px

---

## Component Architecture

### Proposed File Structure

```
src/
├── types/
│   ├── objects.ts          # All object type definitions
│   ├── states.ts           # State machine types
│   └── frames.ts           # Frame types
├── components/
│   ├── canvas/
│   │   ├── Canvas.tsx      # Main canvas component
│   │   ├── CanvasObject.tsx # Wrapper for all objects
│   │   └── SelectionBox.tsx
│   ├── objects/
│   │   ├── ObjectHeader.tsx
│   │   ├── ObjectBody.tsx
│   │   ├── ObjectPlaceholder.tsx
│   │   ├── ImageObject.tsx
│   │   ├── VideoObject.tsx
│   │   ├── TextObject.tsx
│   │   ├── DoodleObject.tsx
│   │   ├── ShapeObject.tsx
│   │   ├── DocumentObject.tsx
│   │   └── AudioObject.tsx
│   ├── frames/
│   │   ├── Frame.tsx
│   │   ├── AutoLayout.tsx
│   │   ├── HStackLayout.tsx
│   │   ├── VStackLayout.tsx
│   │   └── GridLayout.tsx
│   ├── placeholders/
│   │   ├── PrePlaceholder.tsx
│   │   ├── GeneratingPlaceholder.tsx
│   │   └── ErrorState.tsx
│   ├── interactions/
│   │   ├── ResizeHandles.tsx
│   │   ├── DragHandle.tsx
│   │   ├── SelectionBounds.tsx
│   │   └── ContextToolbar.tsx
│   └── ui/
│       └── ... (existing UI components)
├── hooks/
│   ├── useObjectState.ts   # State machine logic
│   ├── useFrameLayout.ts   # Frame layout calculations
│   └── useSelection.ts     # Selection management
└── utils/
    ├── layout.ts           # Layout engine calculations
    └── geometry.ts         # Positioning helpers
```

### Type System

```typescript
// Base object interface
interface BaseObject {
  id: string;
  type: ObjectType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  state: ObjectState;
  colorTag?: ColorTag;
  metadata?: ObjectMetadata;
}

// Canvas native things (no generation)
type CanvasNativeType =
  | "text"
  | "shape"
  | "doodle"
  | "sticker"
  | "link"
  | "pdf";

// Artifacts (AI-generated)
type ArtifactType = "image" | "video" | "audio" | "document";

// Organizational
type ContainerType = "frame";

type ObjectType = CanvasNativeType | ArtifactType | ContainerType;

type ObjectState = "idle" | "pre-placeholder" | "generating" | "error";

interface ObjectMetadata {
  prompt?: string;
  progress?: number; // 0-100
  error?: string;
  createdAt: number;
  updatedAt: number;
  generationParams?: Record<string, any>;
}

// Content objects
interface ImageObject extends BaseObject {
  type: "image";
  content: string; // URL or data URI
  aspectRatio?: number;
}

interface VideoObject extends BaseObject {
  type: "video";
  content: string; // URL
  duration?: number;
  thumbnail?: string;
}

interface TextObject extends BaseObject {
  type: "text";
  content: string; // Rich text or markdown
  fontSize?: number;
  fontFamily?: string;
}

// Frame object
interface FrameObject extends BaseObject {
  type: "frame";
  createdBy: "human" | "agent"; // Who created this frame
  autoLayout: boolean; // AutoLayout on/off
  layout: LayoutType; // Only applies when autoLayout = true
  padding: number;
  gap: number;
  children: string[]; // Child object IDs
  backgroundColor?: string;
  borderRadius?: number;
  gridColumns?: number | "auto-fit";
}

type LayoutType = "hstack" | "vstack" | "grid"; // No "auto" - that's autoLayout = false
```

---

## Development Roadmap

### Phase 1: Foundation (30 min)

**Goal**: Refactor existing code to support new type system and states

1. **Update Type System** (10 min)

   - Extend current types with `ObjectState`, `ObjectMetadata`
   - Add Frame type definition
   - Create state machine types

2. **Refactor CanvasObject** (10 min)

   - Add support for different object types
   - Implement state-based rendering
   - Add ObjectHeader component

3. **Create ObjectHeader** (10 min)
   - Editable name (click to edit)
   - Type icon display
   - Status indicator (dot/spinner/error)
   - Draggable header for movement

### Phase 2: Placeholder System (15 min)

**Goal**: Implement pre-placeholder and generating states

4. **PrePlaceholder Component** (8 min)

   - Prompt input UI
   - Generate/Cancel buttons
   - Dashed border styling

5. **GeneratingPlaceholder Component** (7 min)
   - Spinner animation
   - Progress bar
   - Prompt display
   - Cancel button

### Phase 3: Error Handling (5 min)

**Goal**: Handle generation failures gracefully

6. **ErrorState Component**
   - Error message display
   - Retry button
   - Edit prompt option

### Phase 4: Frame System (10 min)

**Goal**: Basic frame container with layout options

7. **Frame Component & Layout Engines**
   - Frame wrapper with layout prop
   - HStack/VStack/Grid layout calculations
   - Frame-specific toolbar actions
   - Unframe functionality

---

## Success Criteria

After implementation, we should be able to:

✅ Click "Add Image" → See pre-placeholder → Enter prompt → See generating state → See result or error

✅ Edit any object's name by clicking its header

✅ Drag objects by their header even in constrained layouts

✅ Create frames with different layout modes and see children reflow

✅ Unframe a frame and keep children

✅ Handle errors gracefully with retry options

✅ Resize objects with 8-handle system

✅ See consistent visual feedback across all object types

---

## Questions to Consider

1. **Frame Nesting**: Should frames be able to contain other frames? (Probably yes for flexibility)

2. **Z-Index Management**: How do we handle stacking order, especially with frames?

3. **Snap-to-Grid**: Should we add grid snapping for cleaner layouts?

4. **Undo/Redo**: Do we need history management in this prototype?

5. **Persistence**: Should we save canvas state to localStorage?

6. **Export**: What formats should we support for download? (PNG, SVG, JSON?)

---

## Next Steps

1. Review this architecture document
2. Prioritize phases based on 1-hour constraint
3. Start with Phase 1: Foundation
4. Iterate quickly with frequent testing
5. Document any deviations or discoveries

Let's build this! 🚀
