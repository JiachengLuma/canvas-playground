# Toolbar Animation Strategy

## Overview

This document describes the elegant animation strategy implemented for smooth toolbar transitions when object headings appear/disappear and when the toolbar switches between full and compact modes.

## Problem Statement

Previously, the toolbar would "jump" visually when:

1. **Metadata header appears/disappears** - At the 120px screen size threshold, the object heading would appear or disappear, causing the toolbar to suddenly shift position to accommodate it
2. **Toolbar size changes** - At the 30px threshold, the toolbar would switch from full mode to compact mode (ellipsis) without animation

These instant changes were jarring and didn't feel polished.

## Solution Requirements

The animation should ONLY occur when:

- ✅ Single object is selected (not multi-select)
- ✅ Zoom level changes (causing size classification transitions)
- ✅ Same object remains selected

The animation should NOT occur when:

- ❌ Clicking between different objects (selection changes)
- ❌ Dragging objects
- ❌ Resizing objects
- ❌ During multi-select operations

## Implementation Details

### 1. Position Animation with Motion Values

We use Framer Motion's `useMotionValue` and `animate` APIs to smoothly transition toolbar positions:

```typescript
// Motion values for smooth position animations
const animatedTop = useMotionValue(0);
const animatedTabTop = useMotionValue(0);
```

### 2. Intelligent Animation Detection

The system tracks:

- **Previous object ID** - To detect selection changes
- **Previous toolbar position** - To detect position changes due to zoom

```typescript
const prevObjectIdRef = useRef<string | null>(null);
const prevToolbarTopRef = useRef<number | null>(null);
```

### 3. Proper Hooks Usage

To satisfy React's Rules of Hooks, the animation logic uses `useLayoutEffect` which is called **before any early returns**:

```typescript
// Animation effect runs after render but before paint
// Must be called before early returns to satisfy Rules of Hooks
useLayoutEffect(() => {
  if (!latestPositionsRef.current) return;

  // Animation logic here...
});

// Early returns happen AFTER all hooks
if (mode === "single" && !object) return null;
```

The calculated positions are stored in a ref during render, and the `useLayoutEffect` reads from that ref to handle animations.

### 4. Animation Logic

The animation logic follows this decision tree:

```
Is this a single-object selection?
├─ NO  → Snap to position instantly (no animation)
└─ YES → Is it the same object as before?
    ├─ NO  → Snap to position instantly (selection changed)
    └─ YES → Did the position change?
        ├─ NO  → Snap to position instantly (no change needed)
        └─ YES → Animate smoothly (zoom level changed)
```

### 5. Spring Animation Parameters

The animation uses spring physics for natural, responsive motion:

```typescript
{
  type: "spring",
  stiffness: 400,  // Snappy response
  damping: 35,      // Smooth settling
  mass: 0.8,        // Light feel
}
```

These parameters were tuned to feel:

- **Responsive** - Quick to start moving
- **Smooth** - No jarring motion
- **Natural** - Settles like a real object
- **Not sluggish** - Doesn't delay user interactions

### 6. Layout Animation for Size Changes

The toolbar wrapper uses Framer Motion's `layout` prop to automatically animate size changes when switching between full and compact modes:

```typescript
<motion.div
  layout
  transition={{
    layout: {
      type: "spring",
      stiffness: 400,
      damping: 35,
      mass: 0.8,
    },
  }}
>
  <ContextToolbar forceCompact={shouldShowCompact} />
</motion.div>
```

This handles:

- Toolbar width changes when buttons appear/disappear
- Toolbar height changes in compact mode
- Smooth morphing between states

## Key Benefits

### 1. **Zoom Transitions Feel Natural**

When zooming in/out, the toolbar smoothly glides to its new position instead of jumping. The heading fade-in/out is now accompanied by a matching position animation.

### 2. **No Animation Interference**

Clicking between objects instantly shows the new toolbar position - no waiting for animations. Dragging is unaffected by toolbar animations.

### 3. **Size Changes Are Elegant**

When the toolbar shrinks to compact mode, it smoothly morphs instead of popping. The spring physics make it feel responsive, not sluggish.

### 4. **Performance Optimized**

- Motion values update without triggering React re-renders
- Animations only run when needed (same object, zoom change)
- No unnecessary calculations during object switching

## Technical Architecture

### Component Structure

```
UnifiedToolbarWrapper
├── Motion Values (animatedTop, animatedTabTop)
├── Tracking Refs (prevObjectIdRef, prevToolbarTopRef)
├── Animation Logic (useEffect)
└── Animated Elements
    ├── Toolbar Container (top position)
    │   └── Toolbar Wrapper (layout animation)
    │       └── ContextToolbar
    └── Tab Button Container (bottom position)
        └── Tab Button Wrapper (layout animation)
            └── Enter Button / Input
```

### Animation Flow

```
1. User zooms in/out
   ↓
2. Position calculations update
   ↓
3. Animation logic checks conditions
   ↓
4. Same object + position changed?
   ├─ YES → Animate smoothly with spring
   └─ NO  → Snap instantly
   ↓
5. Motion values update
   ↓
6. UI renders at new position
```

## Edge Cases Handled

### Case 1: Rapid Zoom Changes

If the user zooms rapidly, the animation smoothly transitions between positions without queuing up multiple animations.

### Case 2: Selection During Animation

If the user selects a different object while an animation is in progress, the animation is immediately cancelled and the new toolbar snaps to the correct position.

### Case 3: Dragging During Zoom

During object dragging, no toolbar is shown, so animations are skipped entirely.

### Case 4: Multi-Select

Multi-select toolbar doesn't use animated positions - it always snaps to the center of the selection bounds.

## Future Enhancements

Potential improvements for the future:

1. **Adaptive Spring Parameters** - Use different spring settings based on distance traveled (longer distances could use less damping)

2. **Stagger Animations** - Slightly stagger the top toolbar and bottom button animations for a more polished feel

3. **Fade During Animation** - Optionally fade the toolbar slightly during large position changes to make the motion feel even smoother

4. **Velocity Preservation** - If zooming continuously, use the velocity of the previous animation to make the next one feel more continuous

## Testing Recommendations

To verify the animation works correctly:

1. **Zoom Test** - Select an object and zoom in/out. Toolbar should smoothly slide up/down as heading appears/disappears.

2. **Selection Test** - Select one object, then quickly select another. New toolbar should appear instantly at correct position.

3. **Compact Mode Test** - Zoom out until toolbar becomes compact (< 30px). It should smoothly shrink in size.

4. **Drag Test** - Drag an object. Toolbar should disappear and not animate when reappearing.

5. **Rapid Zoom Test** - Rapidly zoom in and out. Animations should be smooth and not queue up.

## Conclusion

This animation strategy provides a polished, professional feel while maintaining snappy, responsive interactions. It demonstrates attention to detail and creates a more delightful user experience without sacrificing performance or usability.
