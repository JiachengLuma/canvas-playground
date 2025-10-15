# UI Classification System Update - Summary

## What Changed

The UI classification system has been updated from 3 states to **4 states** to better handle ultra-small objects.

## New 4-State System

| State         | Threshold | Corner Handles     | Drag Handle | Toolbar            | Heading     |
| ------------- | --------- | ------------------ | ----------- | ------------------ | ----------- |
| **🔴 Micro**  | ≤ 10px    | 1 (top-right only) | Hidden      | **Hidden**         | Hidden      |
| **🟠 Tiny**   | 10-30px   | 1 (top-right only) | Hidden      | Ellipsis (compact) | Hidden      |
| **🟡 Small**  | 30-120px  | All 4              | Visible     | Full buttons       | Hidden      |
| **🟢 Normal** | ≥ 120px   | All 4              | Visible     | Full buttons       | **Visible** |

## Key Changes from Previous Version

### Boundaries Updated

- **Tiny boundary**: Changed from `< 60px` → `< 30px`
- **New Micro state**: Added for objects `≤ 10px`

### New Behavior

- **Micro state (≤ 10px)**: Toolbar and drag handle are completely hidden, only the top-right corner handle remains visible
- **Tiny state (10-30px)**: Drag handle is hidden (along with compact toolbar), only the top-right corner handle remains visible
- This prevents UI clutter when objects are zoomed out to very small sizes

## Implementation Details

### Core Function

```typescript
export function getUISizeState(
  objectWidth: number,
  objectHeight: number,
  zoomLevel: number
): UISizeState {
  const screenHeight = objectHeight * zoomLevel;
  const screenWidth = objectWidth * zoomLevel;
  const smallerDimension = Math.min(screenHeight, screenWidth);

  if (smallerDimension <= 10) return "micro";
  if (smallerDimension < 30) return "tiny";
  if (smallerDimension < 120) return "small";
  return "normal";
}
```

### New Helper Functions

```typescript
shouldShowToolbarUI() → false when state is 'micro' (≤10px)
shouldShowDragHandleUI() → false in 'micro' and 'tiny' states (≤30px)
```

### Updated Helper Functions

```typescript
shouldUseCompactToolbar() → true only in 'tiny' state (10-30px)
shouldShowAllCornerHandles() → false in both 'micro' and 'tiny' states
```

## Files Modified

1. **src/utils/canvasUtils.ts**

   - Updated `getUISizeState()` with new thresholds
   - Added `shouldShowToolbarUI()` function
   - Added `shouldShowDragHandleUI()` function
   - Updated `shouldUseCompactToolbar()` and `shouldShowAllCornerHandles()`

2. **src/components/canvas/UnifiedToolbarWrapper.tsx**

   - Added early return when `shouldShowToolbarUI()` is false
   - Updated compact toolbar logic to use new 30px threshold

3. **src/components/canvas/CanvasLayer.tsx**

   - Added drag handle visibility check using `shouldShowDragHandleUI()`
   - Drag handle now hidden in micro and tiny states

4. **documents/UI_SIZE_CLASSIFICATION.md**

   - Updated documentation to reflect 4-state system with drag handle visibility

## Testing

✅ **Build Status**: Successful
✅ **Linter**: No errors
✅ **TypeScript**: All types valid

## Use Cases

### When to Use Each State

- **Micro (≤10px)**: Extremely zoomed-out canvas views where you only need basic selection/resize capability
- **Tiny (10-30px)**: Small objects that need interaction but space is limited
- **Small (30-120px)**: Medium-sized objects with full controls but no metadata clutter
- **Normal (≥120px)**: Large objects with complete UI including heading information

## Rationale

The micro and tiny states provide progressive UI simplification because:

1. **Micro (≤10px)**: At this size, toolbar and drag handle are unusable and would overwhelm the object
2. **Tiny (10-30px)**: Object is still very small, so drag handle is hidden to reduce clutter while keeping compact toolbar
3. Users still maintain core functionality (selection, resize via corner handle)
4. Provides a cleaner, less cluttered experience at zoom-out levels

This creates a progressive degradation of UI complexity as objects get smaller:
**Normal** (full UI + heading) → **Small** (full UI, no heading) → **Tiny** (compact toolbar, no drag handle) → **Micro** (corner handle only)
