# Implementation Plan (1 Hour Sprint)

## Priority Order

Given the 1-hour time constraint, here's the recommended priority order:

### 🔴 Critical (Must Have - 40 min)

#### 1. Object Header System (10 min)

- Editable object names
- Type icons
- Status indicators
- **Value**: Core UX improvement, makes canvas feel professional

#### 2. State Machine & Placeholders (15 min)

- Pre-placeholder (prompt input)
- Generating state (spinner + progress)
- Error state (retry/cancel)
- **Value**: Solves the core "how do objects get created" problem

#### 3. Improved Object Types (15 min)

- Extend types to support metadata
- Add state management hooks
- Implement type-specific rendering
- **Value**: Foundation for everything else

### 🟡 High Priority (Should Have - 15 min)

#### 4. Basic Frame System (15 min)

- Frame container component
- Auto layout (manual positioning)
- HStack layout (horizontal)
- Frame/Unframe actions
- **Value**: Enables organization, core feature request

### 🟢 Nice to Have (If Time Permits - 5 min)

#### 5. Resize Handles Improvement (5 min)

- 8-handle system (corners + edges)
- Visual refinement
- **Value**: Polish, better UX

---

## Detailed Task Breakdown

### Task 1: Update Type System (3 min)

**File**: `src/types.ts`

```typescript
// Add new types
type ObjectState = "idle" | "pre-placeholder" | "generating" | "error";

interface ObjectMetadata {
  prompt?: string;
  progress?: number;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

// Extend existing CanvasObject
interface CanvasObject {
  // ... existing fields
  name?: string; // Make required
  state: ObjectState;
  metadata?: ObjectMetadata;
}
```

### Task 2: Create ObjectHeader Component (7 min)

**File**: `src/components/objects/ObjectHeader.tsx`

- Click to edit name (inline input)
- Show type icon (Image/Video/Text/etc)
- Show status dot/spinner
- Draggable to move object
- Save on blur or Enter key

### Task 3: Create PrePlaceholder Component (8 min)

**File**: `src/components/placeholders/PrePlaceholder.tsx`

- Prompt input field
- Generate button
- Cancel button
- Dashed border styling
- Auto-focus input

### Task 4: Create GeneratingPlaceholder (7 min)

**File**: `src/components/placeholders/GeneratingPlaceholder.tsx`

- Spinner animation
- Progress bar (optional)
- Show prompt text
- Cancel button
- Shimmer effect

### Task 5: Update CanvasObject to Support States (5 min)

**File**: `src/components/CanvasObject.tsx`

- Render different components based on `state`
- Pass state handlers down
- Update styling based on state

### Task 6: Implement State Transitions in App (10 min)

**File**: `src/App.tsx`

- Handle "Add Object" → pre-placeholder state
- Handle "Generate" → generating state
- Simulate generation with setTimeout
- Handle success → idle state
- Handle error → error state

### Task 7: Create Frame Component (10 min)

**File**: `src/components/frames/Frame.tsx`

- Render children with layout
- HStack: flexbox row
- VStack: flexbox column
- Auto: absolute positioning
- Add frame/unframe actions

### Task 8: Add Frame Actions (5 min)

**File**: `src/App.tsx`

- Create frame from selection
- Unframe (remove frame, keep children)
- Change frame layout type

---

## Testing Checklist

After each phase, test:

- [ ] Can create new object (shows pre-placeholder)
- [ ] Can enter prompt and click Generate
- [ ] Shows generating state with spinner
- [ ] Transitions to idle state with content
- [ ] Can edit object name by clicking header
- [ ] Can drag object by header
- [ ] Can create frame from multiple objects
- [ ] Children reflow when frame layout changes
- [ ] Can unframe and keep children
- [ ] Error state shows and can retry

---

## Code Quality Guidelines

1. **Keep it simple**: Prototype quality, not production
2. **Reuse existing patterns**: Follow current component style
3. **Type safety**: Use TypeScript properly
4. **Visual consistency**: Match existing UI patterns
5. **Comment key decisions**: Leave notes for future work

---

## What We're NOT Building Today

- Frame nesting (frames in frames)
- VStack/Grid layouts (only Auto and HStack)
- Undo/Redo
- Persistence (localStorage)
- Export functionality
- Advanced error handling
- Document/Doodle/Shape object types (focus on Image/Video/Text)
- Animation polish
- Mobile responsiveness

We can add these later!

---

## Success Definition

By the end of 1 hour, we should have:

1. ✅ A working pre-placeholder → generating → ready flow
2. ✅ Editable object names via headers
3. ✅ Basic frame system with HStack layout
4. ✅ Error states with retry
5. ✅ Clean, understandable code structure

This gives us a strong foundation to build the rest incrementally.
