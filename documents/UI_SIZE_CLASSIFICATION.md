# UI Size Classification System

## Overview

The UI adapts based on **4 size states** determined by the object's smaller screen dimension (min of width/height in pixels after zoom).

## The 4 States

### Micro (≤ 10px)

- **Corner Handles**: 1 only (top-right)
- **Drag Handle**: Hidden
- **Toolbar**: Hidden
- **Heading**: Hidden

### Tiny (10-30px)

- **Corner Handles**: 1 only (top-right)
- **Drag Handle**: Hidden
- **Toolbar**: Ellipsis (compact mode)
- **Heading**: Hidden

### Small (30-120px)

- **Corner Handles**: All 4
- **Drag Handle**: Visible
- **Toolbar**: Full buttons
- **Heading**: Hidden

### Normal (≥ 120px)

- **Corner Handles**: All 4
- **Drag Handle**: Visible
- **Toolbar**: Full buttons
- **Heading**: Visible (type, creator/dimensions)

## Visual Comparison

```
MICRO (≤10px)     TINY (10-30px)     SMALL (30-120px)     NORMAL (≥120px)

                                     ┌─────────────┐      Type    Creator
                                     │             │      ┌─────────────┐
                            ┐        │             │┐     │             │┐
     ┐                 ┌────┐       ┌┼─────────────┼┐    ┌┼─────────────┼┐
    ┌┐                 │  … │       │               │    │               │
    └┘                 └────┘       │    Object     │    │    Object     │
                                    │               │    │               │
     ○                     ○        └┼─────────────┼┘    └┼─────────────┼┘
                                     │             │      │             │
                                     └─────────────┘      └─────────────┘

  [No toolbar]      [Icon only]     [Full toolbar]       [Full toolbar]
  [No drag handle]  [No drag handle] [With drag handle]   [With drag handle]
  1 corner handle   1 corner handle  4 corner handles     4 corner handles
  No heading        No heading       No heading           With heading
```

## Implementation

All logic is centralized in `canvasUtils.ts`:

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

### Helper Functions

```typescript
// Check if heading should be shown
shouldShowObjectMetadata() → true only in 'normal' state

// Check if toolbar should be shown at all
shouldShowToolbarUI() → false only in 'micro' state (≤10px)

// Check if toolbar should be compact
shouldUseCompactToolbar() → true only in 'tiny' state (10-30px)

// Check if drag handle (right side) should be shown
shouldShowDragHandleUI() → false in 'micro' and 'tiny' states (≤30px)

// Check if all 4 corner handles should show
shouldShowAllCornerHandles() → true in 'small' and 'normal' (false in 'micro' and 'tiny')
```

## Usage Examples

### In UnifiedToolbarWrapper

```typescript
const shouldShowCompact = shouldUseCompactToolbar(
  widthInScreenPx / zoomLevel,
  heightInScreenPx / zoomLevel,
  zoomLevel
);
```

### In CanvasObject

```typescript
const showAllHandles = shouldShowAllCornerHandles(
  object.width,
  object.height,
  zoomLevel
);
```

## Benefits of This System

1. **Simple**: Only 4 states to understand and test
2. **Consistent**: All UI elements use the same classification
3. **Predictable**: Clear thresholds (10px, 30px, 120px)
4. **Maintainable**: Single source of truth in `canvasUtils.ts`
5. **Performant**: Minimal calculations, no redundant checks
6. **Graceful**: Progressively simplifies UI as objects get smaller

## Migration Notes

### Removed

- `getObjectSizeCategory()` - Was 5 categories (huge/large/medium/small/tiny)
- `shouldSimplifyUI()` - Replaced by `shouldShowToolbarUI()` and `shouldUseCompactToolbar()`
- `shouldMinimizeUI()` - Was duplicate of `shouldSimplifyUI()`
- Manual `showAllHandles` calculation in CanvasObject
- Manual `shouldShowCompact` calculation in UnifiedToolbarWrapper

### Added

- `getUISizeState()` - Returns 'micro' | 'tiny' | 'small' | 'normal'
- `shouldShowToolbarUI()` - Hides toolbar completely in 'micro' state
- `shouldUseCompactToolbar()` - For toolbar appearance in 'tiny' state
- `shouldShowDragHandleUI()` - Hides drag handle in 'micro' and 'tiny' states
- `shouldShowAllCornerHandles()` - For corner handle visibility
- Updated `shouldShowObjectMetadata()` - Now uses the 4-state system
