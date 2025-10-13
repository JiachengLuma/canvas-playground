# Autolayout Grid Frame - Flexbox Reflow Implementation

## Overview

Implemented flexbox reflow for autolayout frames with grid layout, featuring:

- Default max of 5 items per row
- Flexible resizing that maintains item sizes
- Minimum width/height constraints to prevent clipping

## Key Features

### 1. Flexbox Reflow

- Grid layout frames use `flexWrap: wrap` to automatically reflow items when resized
- Items maintain their original dimensions (`flexShrink: 0`)
- The frame's width determines how many items fit per row

### 2. Default 5 Items Per Row

- When switching to grid layout, the frame automatically sizes to fit 5 items per row
- This is calculated as: `(maxChildWidth × 5) + (gap × 4) + (padding × 2)`
- Can be customized via the `gridColumns` property (defaults to 5)

### 3. Minimum Size Constraints

- **Min Width**: At least 1 item width + padding (prevents horizontal clipping)
- **Min Height**: At least 1 item height + padding (prevents vertical clipping)
- These constraints are enforced during:
  - Rendering (CSS `minWidth` and `minHeight`)
  - Resizing (resize handler validation)

### 4. Intelligent Frame Sizing

The frame automatically calculates appropriate dimensions when:

- **Toggling to grid layout** (while autolayout is already on)
- **Enabling autolayout** (when grid layout is already selected)
- **Resizing manually** (respects min constraints but allows free sizing)

## Implementation Details

### Files Modified

#### 1. `src/components/CanvasObject.tsx` (lines 758-804)

```typescript
// Calculate min dimensions for grid layout
if (autoLayout && layout === "grid" && children.length > 0) {
  const maxChildWidth = Math.max(...children.map(c => c.width));
  const maxChildHeight = Math.max(...children.map(c => c.height));

  minWidth = maxChildWidth + padding * 2;
  minHeight = maxChildHeight + padding * 2;
}

// Apply constraints to frame styling
style={{
  display: "flex",
  flexWrap: "wrap",
  minWidth: minWidth ? `${minWidth}px` : undefined,
  minHeight: minHeight ? `${minHeight}px` : undefined,
  width: `${object.width}px`,
  height: `${object.height}px`,
}}
```

#### 2. `src/hooks/useDrag.ts` (lines 303-335)

```typescript
// Calculate minimum size based on children for grid frames
if (isAutolayoutFrame && layout === "grid") {
  const children = objects.filter((obj) => childrenIds.includes(obj.id));
  if (children.length > 0) {
    const maxChildWidth = Math.max(...children.map((c) => c.width));
    const maxChildHeight = Math.max(...children.map((c) => c.height));

    minWidth = maxChildWidth + padding * 2;
    minHeight = maxChildHeight + padding * 2;
  }
}

// Enforce minimum size during resize
if (newWidth < minWidth || newHeight < minHeight) return;
```

#### 3. `src/App.tsx` (lines 541-710)

Two handlers updated:

**handleToggleAutolayout**: Calculates frame size when enabling autolayout on grid frames
**handleToggleLayoutType**: Resizes frame to 5-items-per-row when switching to grid layout

#### 4. `src/config/initialObjects.ts`

Added test frame with 8 images in grid layout to demonstrate the feature

## Usage

### Creating a Grid Frame

1. **Create objects** you want to arrange
2. **Select them** and press `F` (or use Frame Selection)
3. **Enable autolayout** using the toolbar button
4. **Switch to grid layout** using the layout toggle button
   - Frame will automatically resize to show 5 items per row

### Resizing a Grid Frame

1. **Select the grid frame**
2. **Drag a corner handle** to resize
3. **Observe reflow**: Items automatically wrap to new rows as width changes
4. **Minimum size**: Frame cannot be resized smaller than 1 item + padding

### Testing the Implementation

The initial canvas now includes a demo grid frame at the bottom (y: 800) with 8 nature images:

- Default width accommodates 5 items
- Displays in 2 rows (5 items first row, 3 items second row)
- Try resizing to see reflow in action!

## Technical Behavior

### Width Calculation for 5 Items

```
width = (itemWidth × 5) + (gap × 4) + (padding × 2)

Example with 250px items, 10px gap, 10px padding:
= (250 × 5) + (10 × 4) + (10 × 2)
= 1250 + 40 + 20
= 1310px
```

### Resize Behavior

- **Dragging wider**: Items stay in current row until there's space for one more
- **Dragging narrower**: Items wrap to next row when they no longer fit
- **Cannot resize below**: 1 item width + padding (e.g., 270px for 250px items)

### Height Behavior

- Height automatically adjusts based on the number of rows
- Rows are created based on how many items fit in the current width
- Height calculation: `(maxItemHeight × numRows) + (gap × (numRows - 1)) + (padding × 2)`

## Customization Options

### Changing Items Per Row

Modify the `gridColumns` property on the frame:

```typescript
{
  type: "frame",
  autoLayout: true,
  layout: "grid",
  gridColumns: 3, // Change to 3 items per row
  // or
  gridColumns: "auto-fit", // Defaults to 5
}
```

### Adjusting Padding and Gap

```typescript
{
  type: "frame",
  autoLayout: true,
  layout: "grid",
  padding: 20,  // Space around items
  gap: 15,      // Space between items
}
```

## Known Behaviors

1. **Item sizes are preserved**: Children do not resize when frame is resized
2. **Flexbox-based positioning**: Child x/y coordinates are managed by CSS flexbox
3. **Non-autolayout frames**: Regular frames without autolayout still support manual positioning
4. **Mixed-size items**: If items have different sizes, the grid uses the largest width/height for calculations

## Future Enhancements

Possible improvements:

- Dynamic grid columns based on frame width (CSS Grid approach)
- Alignment options (center, space-between, etc.)
- Variable-sized grid items (masonry layout)
- Responsive breakpoints for different column counts
