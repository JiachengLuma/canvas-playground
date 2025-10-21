# Label System Documentation

Comprehensive documentation for the colored label system implementation.

## Overview

The label system provides visual identification for canvas objects through colored background pills. Labels are independent of the standard metadata header system and have their own visibility and scaling rules.

## Features

### Colored Label Backgrounds

Objects can have colored label backgrounds to organize and identify content:

- **none**: Transparent background (default)
- **red**: Red (#ef4444) background
- **green**: Green (#22c55e) background
- **yellow**: Yellow (#eab308) background

### Inline Renaming

All objects with headings support double-click to rename:

1. Double-click on any label/heading
2. Text becomes editable with contentEditable
3. Press Enter to confirm, Escape to cancel
4. Keyboard shortcuts disabled during editing (Delete, Space, etc.)

### Toolbar Integration

Label background color is controlled through the toolbar:

- **Single Selection**: Click the color pill button to cycle through colors
- **Multi-Selection**: Click the color pill button to apply same color to all selected objects
- **Color Sequence**: none → red → green → yellow → none

## Visibility Rules

### Size-Based Visibility

Labels follow independent visibility rules from standard headings:

**Micro State (≤ 10px)**:

- All labels hidden (both colored and uncolored)

**Tiny State (10-30px)**:

- Colored labels visible (with scaling)
- Uncolored labels hidden

**Small State (30-120px)**:

- Colored labels visible at full scale
- Uncolored labels hidden

**Normal State (≥ 120px)**:

- All labels visible (colored and uncolored)

### Selection-Based Visibility

**Colored Labels**:

- Always visible at tiny/small/normal scales
- Visible even during multi-select
- Independent of selection state

**Uncolored Labels** (standard metadata):

- Only visible when object is selected
- Only visible in normal state (≥ 120px)
- Hidden during multi-select

## Scaling Behavior

### Per-Object Scaling

**Important**: Label scale is calculated per-object based on individual object size in screen space. This means labels on different objects may appear at different sizes simultaneously.

**Scale Calculation**:

```typescript
// Screen dimension in pixels
const screenWidth = objectWidth * zoomLevel;
const screenHeight = objectHeight * zoomLevel;
const smallerDimension = Math.min(screenWidth, screenHeight);

// Scale calculation for tiny state (10-30px)
if (sizeState === "tiny" && hasColoredLabel) {
  labelScale = 0.5 + ((smallerDimension - 10) / 20) * 0.5;
  // Maps 10px → 0.5 scale, 30px → 1.0 scale
}
```

**Scale Ranges**:

- **Micro (≤ 10px)**: Hidden
- **Tiny (10-30px)**: 0.5x → 1.0x (smooth transition)
- **Small (≥ 30px)**: 1.0x (full size)

**Example Scenario**:

- Object A: 50px canvas size at 0.5 zoom = 25px screen size = 0.75x label scale
- Object B: 100px canvas size at 0.5 zoom = 50px screen size = 1.0x label scale
- Result: Labels on screen appear at different scales

### Animation

Labels smoothly transition between scales:

- **Transition**: `transform 0.15s ease-out`
- **Transform Origin**: `left center`
- **GPU Accelerated**: Uses CSS transform property

## Visual Design

### Colored Labels

**Dimensions**:

- Height: 20px (in canvas space)
- Padding: 8px horizontal
- Border Radius: 6px
- Gap from object: 2px

**Typography**:

- Font Size: 12px (in canvas space)
- Font Weight: 500
- Font Family: Graphik, sans-serif
- Line Height: 16px
- Text Color: rgba(255, 255, 255, 0.9)

**Positioning**:

- Top: -22px / zoomLevel (20px height + 2px gap)
- Left: 0 (aligned with object left edge)
- Transform Origin: left center

### Uncolored Labels

**Dimensions**:

- Height: auto (text height)
- Padding: 4px horizontal
- No border radius
- Adaptive gap based on zoom

**Typography**:

- Font Size: 12px (in canvas space)
- Font Weight: 400
- Font Family: Graphik, sans-serif
- Text Color: rgba(0, 0, 0, 0.7)

## Object Types

### Supported Object Types

**Non-Frame Objects** (images, videos, audio, documents):

- Support colored and uncolored labels
- Labels shown above object
- Per-object scaling applies

**Frames** (regular frames):

- Support colored and uncolored labels
- Frame-specific styling
- Per-object scaling applies

**Agent Frames**:

- Support colored labels after creation completes
- Black pill with animation during creation
- Scale prop passed to component
- Per-object scaling applies

### Unsupported Object Types

Objects without headings do not support labels:

- Notes (sticky notes use their own title system)
- Links (have their own URL display)
- Raw shapes (no concept of heading)

## Multi-Select Behavior

### Visual Feedback

When multiple objects are selected:

- Colored labels remain visible on all objects
- Users can see which objects have which colors
- All labels update simultaneously when cycling

### Batch Operations

Clicking the label color button in multi-select toolbar:

1. Gets the label color of first selected object
2. Calculates next color in sequence
3. Applies same color to all selected objects
4. All labels update with smooth transition

### Independent Scaling

During multi-select:

- Each object's label scales based on its own size
- Labels may appear at different scales simultaneously
- This is expected behavior, not a bug

## Implementation Details

### Component Architecture

**CanvasObject.tsx**:

- Renders labels for non-frame objects
- Handles per-object scale calculation
- Manages inline editing state
- Applies transform with transition

**AgentFrameEffects.tsx**:

- Receives labelScale prop from parent
- Applies scale only when colored
- Maintains animation during creation

**ContextToolbar.tsx**:

- Provides label color button
- Displays current color state
- Handles click to cycle colors

**UnifiedToolbarWrapper.tsx**:

- Routes single vs multi-select handlers
- Passes labelBgColor for single select
- Passes onMultiLabelBgColorChange for multi-select

### Handler Functions

**handleLabelBgColorChange** (single object):

```typescript
const handleLabelBgColorChange = (id: string) => {
  const obj = objects.find((o) => o.id === id);
  const colors = ["none", "red", "green", "yellow"];
  const currentIndex = colors.indexOf(obj?.labelBgColor || "none");
  const nextColor = colors[(currentIndex + 1) % colors.length];
  updateObject(id, { labelBgColor: nextColor });
};
```

**handleMultiLabelBgColorChange** (multi-select):

```typescript
const handleMultiLabelBgColorChange = () => {
  const firstObj = objects.find((o) => o.id === selectedIds[0]);
  const colors = ["none", "red", "green", "yellow"];
  const currentIndex = colors.indexOf(firstObj?.labelBgColor || "none");
  const nextColor = colors[(currentIndex + 1) % colors.length];

  selectedIds.forEach((id) => {
    updateObject(id, { labelBgColor: nextColor });
  });
};
```

### Keyboard Shortcuts During Editing

When editing label names (contentEditable), keyboard shortcuts are disabled:

**Protected Keys**:

- Delete/Backspace: Used for deleting text, not objects
- Space: Used for adding spaces, not focus
- Escape: Cancels editing
- Enter: Confirms editing
- All modifier combinations (Cmd+Z, Cmd+D, etc.)

**Implementation**:

```typescript
// In useKeyboardShortcuts.ts
const handleKeyDown = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement;
  if (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  ) {
    return; // Skip all shortcuts
  }
  // ... rest of shortcuts
};
```

## Design Rationale

### Per-Object Scaling

**Why**: Ensures labels remain readable regardless of individual object size. A large frame and small image at the same zoom level will have labels scaled appropriately for their respective sizes.

**Trade-off**: Labels on screen may appear at different scales, but this provides better readability than uniform scaling.

### Independent Visibility

**Why**: Colored labels serve a different purpose than metadata headers. They are for organization and quick identification, not detailed information display.

**Benefit**: Users can see their color-coded organization even at small zoom levels where metadata would be unreadable.

### Smooth Scaling Transition

**Why**: Abrupt hiding/showing is jarring. Smooth scaling from 0.5x to 1.0x provides visual continuity.

**Performance**: CSS transform is GPU-accelerated, making the animation smooth and performant.

## Future Enhancements

### Potential Additions

1. **Custom Colors**: Allow users to define custom label colors
2. **Multiple Labels**: Support multiple labels per object
3. **Label Categories**: Organize labels into categories or tags
4. **Filter by Label**: Filter canvas view by label color
5. **Label Legend**: Show legend of all labels in use
6. **Keyboard Shortcuts**: Quick keys for applying specific colors
7. **Label Templates**: Save and apply label presets
8. **Label Search**: Search objects by label color

### Technical Improvements

1. **Unified Scaling**: Consider uniform label scale across all objects
2. **Performance**: Optimize scale calculation for many objects
3. **Accessibility**: Add ARIA labels for screen readers
4. **Persistence**: Save label preferences per user
5. **Animation Options**: Allow users to disable transitions
6. **Color Blindness**: Provide patterns in addition to colors
7. **High Contrast**: Adjust colors for high contrast mode
8. **Dark Mode**: Adapt label colors for dark theme

## Best Practices

### When to Use Colored Labels

**Good Use Cases**:

- Organizing objects by priority (red = high, yellow = medium, green = low)
- Categorizing content types (red = urgent, yellow = review, green = approved)
- Visual grouping without frames (objects with same color belong together)
- Status indication (red = error, yellow = warning, green = success)

**Avoid**:

- Using colors for purely aesthetic reasons (use frames or actual styling)
- Over-relying on color without text labels (accessibility concern)
- Using too many colors (limit to meaningful distinctions)

### Performance Considerations

**Optimizations**:

- Scale calculation is memoized per object
- Transform uses GPU acceleration
- Transitions only apply to colored labels
- Hidden labels don't render at all (not just opacity: 0)

**At Scale**:

- Tested with 100+ objects with colored labels
- Smooth performance maintained at all zoom levels
- No degradation with concurrent scaling animations

## Troubleshooting

### Label Not Appearing

**Check**:

1. Is object too small? (< 10px = micro state)
2. Is label colored? (uncolored labels only show when selected at normal size)
3. Is object selected during multi-select? (colored labels should still show)
4. Is zoomLevel causing object to be micro? (check actual screen size)

### Label at Wrong Scale

**Check**:

1. Calculate actual screen size: `width * zoomLevel`
2. Verify size classification: micro/tiny/small/normal
3. Check if scale calculation is correct for tiny state
4. Verify transform is being applied

### Renaming Not Working

**Check**:

1. Is object type supported? (not notes/links)
2. Is double-click being captured?
3. Is contentEditable being set to true?
4. Are keyboard shortcuts disabled during edit?
5. Is onNameChange handler connected?

### Multi-Select Label Change Issues

**Check**:

1. Is onMultiLabelBgColorChange handler connected?
2. Are all selected objects updating?
3. Is first object's color being used as baseline?
4. Are labels remaining visible during multi-select?

## Testing Checklist

### Visual Testing

- [ ] Labels appear at correct size in normal state
- [ ] Labels scale smoothly in tiny state (10-30px)
- [ ] Labels hide completely in micro state (≤10px)
- [ ] Colored labels visible during multi-select
- [ ] Uncolored labels hidden during multi-select
- [ ] Multiple objects can have different label scales simultaneously
- [ ] Transitions are smooth (60fps)

### Functional Testing

- [ ] Clicking toolbar button cycles colors correctly
- [ ] Double-clicking label enables editing
- [ ] Enter confirms name change
- [ ] Escape cancels name change
- [ ] Delete key works during editing (doesn't delete object)
- [ ] Space key works during editing (doesn't trigger zoom-to-fit)
- [ ] Multi-select applies same color to all objects
- [ ] Undo/redo works with label changes

### Edge Case Testing

- [ ] Very small objects (5px) hide labels
- [ ] Very large objects (1000px) show labels
- [ ] Rapid zoom in/out maintains correct scale
- [ ] Switching between objects during edit cancels editing
- [ ] Empty name is rejected
- [ ] Very long names are truncated with ellipsis
- [ ] Special characters in names display correctly
