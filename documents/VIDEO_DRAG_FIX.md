# Video Dragging Fix

## Problem

Video objects were difficult to drag because click events were being captured by the video player's play/pause functionality, preventing smooth drag detection for both selected and non-selected videos.

## Root Cause

1. **VideoPlayer.tsx** was stopping event propagation in ways that interfered with drag detection
2. **CanvasObject.tsx** had an early return when clicking on selected videos, which prevented drag initiation
3. No distinction between "click to play/pause" vs "click to drag" based on mouse movement

## Solution Strategy

### Movement-Based Detection

Implemented a threshold-based approach to distinguish between clicks and drags:

- Track mouse position on mousedown
- Monitor mouse movement
- If movement exceeds 3px threshold → treat as drag
- If movement stays below threshold → treat as click

### VideoPlayer.tsx Changes

1. **Added movement tracking:**

   - `mouseDownPos` ref: tracks initial click position
   - `hasMoved` ref: flag indicating if mouse has moved beyond threshold
   - `handleMouseMove`: detects mouse movement during mousedown

2. **Updated handleMouseDown:**

   - Always tracks initial position
   - For **non-selected videos**: doesn't stop propagation, allowing CanvasObject to handle drag
   - For **selected videos**: tracks position but lets event bubble up

3. **Updated handleVideoClick:**
   - Checks `hasMoved` flag first
   - If dragging detected (hasMoved=true): ignores the click
   - If genuine click: proceeds with play/pause or selection logic

### CanvasObject.tsx Changes

1. **Removed video-specific blocking:**
   - Deleted the check that prevented drag initiation on selected videos
   - Now all objects (including videos) follow the same drag detection logic
   - The VideoPlayer handles the distinction between clicks and drags internally

## Behavior Matrix

| Scenario                      | Action         | Result                           |
| ----------------------------- | -------------- | -------------------------------- |
| Click non-selected video      | No movement    | Selects video                    |
| Drag non-selected video       | Movement > 3px | Drags video, keeps playing state |
| Click selected video          | No movement    | Toggles play/pause               |
| Drag selected video           | Movement > 3px | Drags video, ignores click       |
| Click selected video controls | No movement    | Play/pause works                 |
| Drag from video seek area     | Movement > 3px | Drags video smoothly             |

## Key Benefits

1. ✅ **Smooth dragging** - both selected and non-selected videos drag smoothly
2. ✅ **No stolen clicks** - play/pause still works when intended
3. ✅ **Consistent behavior** - videos behave like other canvas objects for dragging
4. ✅ **Natural UX** - 3px threshold feels natural (same as existing CanvasObject threshold)
5. ✅ **Preserves playback state** - video continues playing during drag if it was playing before

## Technical Details

### Event Flow for Non-Selected Video Drag:

```
1. MouseDown on video
   → VideoPlayer: tracks position, isSelecting=true, NO stopPropagation
   → CanvasObject: receives event, prepares for drag

2. MouseMove (beyond 3px)
   → VideoPlayer: detects movement, hasMoved=true
   → CanvasObject: detects movement, calls onDragStart()

3. Click fires
   → VideoPlayer: sees hasMoved=true, ignores click
   → CanvasObject: handles as normal
```

### Event Flow for Selected Video Click (Play/Pause):

```
1. MouseDown on video
   → VideoPlayer: tracks position
   → CanvasObject: prepares for drag

2. MouseUp (minimal movement)
   → CanvasObject: doesn't trigger onDragStart (below threshold)

3. Click fires
   → VideoPlayer: hasMoved=false, isSelected=true, toggles play/pause
   → Stops propagation, CanvasObject doesn't need to handle
```

## Testing Checklist

- [ ] Drag non-selected video → should drag smoothly
- [ ] Click non-selected video → should select it
- [ ] Drag selected video → should drag smoothly
- [ ] Click selected video → should toggle play/pause
- [ ] Quick click-drag motion → should drag, not play/pause
- [ ] Video keeps playing during drag (if was playing)
- [ ] Video controls (seek bar, volume) still work when selected
- [ ] Multi-select drag including video → works smoothly

## Notes

- The 3px movement threshold matches the existing threshold in CanvasObject (line 192)
- Video player state (playing/paused) is preserved during drag operations
- The `isDragging` prop passed to VideoPlayer pauses the video during drag for performance
