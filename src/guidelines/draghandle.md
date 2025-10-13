# Drag-to-Duplicate Grid System

## System Definition

A drag handle appears when you select artifacts on an infinite canvas. Dragging this handle creates a grid of duplicate placeholders based on how far you drag. The system calculates grid dimensions (rows × columns) dynamically from the drag distance.

**Core Purpose:** Quickly create multiple variations by dragging in a direction - drag right for more columns, drag down for more rows, drag diagonally for a 2D grid.

---

## Core Concepts

### The Drag Handle

- Appears to the right of selected artifacts
- Visual: 8px wide × 60px tall rounded pill
- Positioned at vertical center of selection
- 5px offset from selection's right edge

### Grid Calculation

As you drag, the system calculates:

1. **Direction**: Which way you're dragging (right, left, down, up, diagonal)
2. **Distance**: How far from the original selection
3. **Grid Size**: Number of rows and columns to create
4. **Positions**: Where each duplicate should be placed

### Visual Feedback

While dragging:

- **Union outline**: Shows bounding box containing original + drag point
- **Duplicate placeholders**: Gray outlines showing where duplicates will appear
- **Spacing**: 10px padding between items

---

## Core Math

### Constants

```typescript
const PADDING = 10 // Pixels between grid items
const MAX_ROWS = 10 // Maximum rows in grid
const MAX_COLS = 10 // Maximum columns in grid
```

### Input Data

```typescript
type SelectionInfo = {
	x: number // Selection screen X position
	y: number // Selection screen Y position
	width: number // Selection width in screen pixels
	height: number // Selection height in screen pixels
	rotation: number // Selection rotation in radians
}

type DragState = {
	x: number // Current drag position in canvas coordinates
	y: number // Current drag position in canvas coordinates
}
```

### Grid Calculation Algorithm

```typescript
function calculateGrid(
	selection: SelectionInfo,
	dragPos: DragState,
	cameraZoom: number
) {
	// 1. Convert drag position to screen coordinates
	const screenPos = canvasToScreen(dragPos, cameraZoom)

	// 2. Find bounding box containing selection + drag point
	const unionRect = {
		left: Math.min(selection.x, screenPos.x),
		top: Math.min(selection.y, screenPos.y),
		width:
			Math.abs(screenPos.x - selection.x) +
			(screenPos.x >= selection.x ? selection.width : 0),
		height:
			Math.abs(screenPos.y - selection.y) +
			(screenPos.y >= selection.y ? selection.height : 0),
	}

	// 3. Calculate how many items fit in each direction
	// Item size in canvas units
	const itemWidth = selection.width / cameraZoom
	const itemHeight = selection.height / cameraZoom

	// Union rect in canvas units
	const unionWidth = unionRect.width / cameraZoom
	const unionHeight = unionRect.height / cameraZoom

	// Number of items that fit with padding
	const numCols = Math.min(
		MAX_COLS,
		Math.max(1, Math.ceil(unionWidth / (itemWidth + PADDING)))
	)

	const numRows = Math.min(
		MAX_ROWS,
		Math.max(1, Math.ceil(unionHeight / (itemHeight + PADDING)))
	)

	// 4. Determine direction
	const xDir = screenPos.x > selection.x ? 1 : -1 // Right = 1, Left = -1
	const yDir = screenPos.y > selection.y ? 1 : -1 // Down = 1, Up = -1

	return { numRows, numCols, xDir, yDir }
}
```

### Position Calculation

```typescript
function calculatePositions(
	selection: SelectionInfo,
	numRows: number,
	numCols: number,
	xDir: number,
	yDir: number,
	cameraZoom: number
) {
	const positions = []

	for (let row = 0; row < numRows; row++) {
		for (let col = 0; col < numCols; col++) {
			// Calculate screen position for this grid cell
			const screenX =
				selection.x + col * xDir * (selection.width + PADDING * cameraZoom)
			const screenY =
				selection.y + row * yDir * (selection.height + PADDING * cameraZoom)

			positions.push({ x: screenX, y: screenY })
		}
	}

	return positions
}
```

---

## Interaction Flow

### State Machine

```typescript
type State =
	| { type: 'idle' } // No drag happening
	| { type: 'drag'; x; y } // Currently dragging
	| { type: 'up'; x; y } // Just released, show composer
```

### Interaction Sequence

**1. Selection → Handle Appears**

- User selects one or more artifacts
- Handle button appears at `(selectionX + selectionWidth + 5, selectionY + selectionHeight/2)`
- Button rotates with selection rotation

**2. Drag Start**

- User presses on handle button
- State changes to `drag`
- Start tracking pointer position

**3. During Drag**

- Track pointer position in canvas coordinates
- Calculate grid dimensions using algorithm above
- Show visual feedback:
  - Union rectangle outline (blue)
  - Placeholder rectangles for duplicates (light blue)
  - All positioned based on calculated grid

**4. Drag End**

- User releases pointer
- If grid is 1×1 (didn't drag far enough), return to idle
- Otherwise, state changes to `up`
- Show prompt input for user to describe variations

**5. Prompt Submit**

- User enters prompt (or leaves empty for exact duplicates)
- Create placeholder shapes at calculated positions
- Trigger generation/duplication for each position
- Select all new shapes
- Return to idle state

---

## Key Calculations Explained

### Why Union Rectangle?

The union rectangle is the bounding box that contains both:

- The original selection
- The current drag point

This gives us the total area we're working with to calculate grid size.

```
Original:  [   A   ]
                        ↓ Dragged here

Union:     [   A   ········]
```

### Grid Size Formula

```
numItems = ceil(totalDistance / (itemSize + padding))
```

**Example:**

- Selection width: 200px
- Drag distance: 450px
- Padding: 10px
- Union width: 200 + 450 = 650px

```
numCols = ceil(650 / (200 + 10))
        = ceil(650 / 210)
        = ceil(3.095)
        = 4 columns
```

This means dragging 450px to the right creates 4 columns (original + 3 duplicates).

### Direction Handling

```typescript
xDir = dragX > selectionX ? 1 : -1
yDir = dragY > selectionY ? 1 : -1
```

**Drag Right:** `xDir = 1`, positions increment: `x, x+w+p, x+2(w+p), ...`  
**Drag Left:** `xDir = -1`, positions decrement: `x, x-w-p, x-2(w+p), ...`  
**Drag Down:** `yDir = 1`, positions increment downward  
**Drag Up:** `yDir = -1`, positions increment upward

### Zoom Scaling

Screen pixels vs canvas pixels:

- Screen: What you see on screen (affected by zoom)
- Canvas: Actual positions in canvas space

```typescript
canvasSize = screenSize / cameraZoom

// Example:
// Camera zoom: 0.5 (zoomed out)
// Screen width: 200px
// Canvas width: 200 / 0.5 = 400 canvas units
```

The padding must be scaled by zoom when calculating screen positions:

```typescript
screenPadding = PADDING * cameraZoom
```

---

## Complete Implementation

```typescript
import { useDrag } from '@use-gesture/react'

type SelectionInfo = {
	x: number
	y: number
	width: number
	height: number
	rotation: number
}

type State =
	| { type: 'idle' }
	| { type: 'drag'; x: number; y: number }
	| { type: 'up'; x: number; y: number }

const PADDING = 10
const MAX_ROWS = 10
const MAX_COLS = 10

function DragToDuplicateHandle({ selection, cameraZoom, onCreateGrid }) {
	const [state, setState] = useState<State>({ type: 'idle' })

	// Drag gesture handler
	const bind = useDrag(({ down, xy: [screenX, screenY] }) => {
		// Convert screen to canvas coordinates
		const canvasPos = screenToCanvas({ x: screenX, y: screenY }, cameraZoom)

		// Update state
		setState({
			type: down ? 'drag' : 'up',
			x: canvasPos.x,
			y: canvasPos.y,
		})

		// On release, check if we should create grid
		if (!down) {
			const gridInfo = calculateGrid(selection, canvasPos, cameraZoom)
			if (gridInfo.numRows <= 1 && gridInfo.numCols <= 1) {
				// Didn't drag far enough, cancel
				setState({ type: 'idle' })
			}
		}
	})

	// Calculate grid info for current state
	const gridInfo =
		state.type !== 'idle'
			? calculateGrid(selection, { x: state.x, y: state.y }, cameraZoom)
			: null

	return (
		<>
			{/* The drag handle button */}
			<button
				{...bind()}
				style={{
					position: 'absolute',
					top: selection.y,
					left: selection.x + selection.width + 5,
					width: 8,
					height: 60,
					cursor: state.type === 'drag' ? 'grabbing' : 'grab',
					transform: `rotate(${selection.rotation}rad) translateY(-50%)`,
				}}
			/>

			{/* Visual feedback during drag */}
			{gridInfo && <GridPlaceholders gridInfo={gridInfo} selection={selection} cameraZoom={cameraZoom} />}

			{/* Prompt input after drag */}
			{state.type === 'up' && gridInfo && (
				<PromptInput
					onSubmit={(prompt) => {
						const positions = calculatePositions(
							selection,
							gridInfo.numRows,
							gridInfo.numCols,
							gridInfo.xDir,
							gridInfo.yDir,
							cameraZoom
						)
						onCreateGrid(positions, prompt)
						setState({ type: 'idle' })
					}}
				/>
			)}
		</>
	)
}

function calculateGrid(selection: SelectionInfo, dragPos: { x; y }, cameraZoom: number) {
	// Convert drag position to screen
	const screenPos = canvasToScreen(dragPos, cameraZoom)

	// Union rectangle
	const unionRect = {
		left: Math.min(selection.x, screenPos.x),
		top: Math.min(selection.y, screenPos.y),
		width:
			Math.max(selection.x + selection.width, screenPos.x) -
			Math.min(selection.x, screenPos.x),
		height:
			Math.max(selection.y + selection.height, screenPos.y) -
			Math.min(selection.y, screenPos.y),
	}

	// Calculate grid dimensions
	const numRows = Math.min(
		MAX_ROWS,
		Math.max(
			1,
			Math.ceil(unionRect.height / cameraZoom / (selection.height / cameraZoom + PADDING))
		)
	)

	const numCols = Math.min(
		MAX_COLS,
		Math.max(
			1,
			Math.ceil(unionRect.width / cameraZoom / (selection.width / cameraZoom + PADDING))
		)
	)

	// Determine direction
	const xDir = screenPos.x > selection.x ? 1 : -1
	const yDir = screenPos.y > selection.y ? 1 : -1

	return { unionRect, numRows, numCols, xDir, yDir }
}

function calculatePositions(
	selection: SelectionInfo,
	numRows: number,
	numCols: number,
	xDir: number,
	yDir: number,
	cameraZoom: number
) {
	const positions = []

	for (let row = 0; row < numRows; row++) {
		for (let col = 0; col < numCols; col++) {
			positions.push({
				x: selection.x + col * xDir * (selection.width + PADDING * cameraZoom),
				y: selection.y + row * yDir * (selection.height + PADDING * cameraZoom),
			})
		}
	}

	return positions
}

function canvasToScreen(canvasPos: { x; y }, zoom: number) {
	return {
		x: canvasPos.x * zoom,
		y: canvasPos.y * zoom,
	}
}

function screenToCanvas(screenPos: { x; y }, zoom: number) {
	return {
		x: screenPos.x / zoom,
		y: screenPos.y / zoom,
	}
}
```

---

## Visual Feedback Implementation

```typescript
function GridPlaceholders({ gridInfo, selection, cameraZoom }) {
	const positions = calculatePositions(
		selection,
		gridInfo.numRows,
		gridInfo.numCols,
		gridInfo.xDir,
		gridInfo.yDir,
		cameraZoom
	)

	return (
		<>
			{/* Union bounding box */}
			<div
				style={{
					position: 'absolute',
					outline: '2px solid blue',
					borderRadius: 12,
					backgroundColor: 'rgba(0, 115, 255, 0.1)',
					...gridInfo.unionRect,
				}}
			/>

			{/* Individual placeholders (skip first, it's the original) */}
			{positions.slice(1).map((pos, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: pos.x,
						top: pos.y,
						width: selection.width,
						height: selection.height,
						outline: '2px solid rgba(0, 115, 255, 0.5)',
						borderRadius: 12,
					}}
				/>
			))}
		</>
	)
}
```

---

## Edge Cases

### Minimum Grid Size

```typescript
Math.max(1, calculatedSize)
```

Always at least 1 row and 1 column (the original selection).

### Maximum Grid Size

```typescript
Math.min(10, calculatedSize)
```

Cap at 10×10 = 100 duplicates to prevent overwhelming the system.

### Single Cell Detection

```typescript
if (numRows <= 1 && numCols <= 1) {
	// User didn't drag far enough, cancel operation
	return null
}
```

### Direction Changes

User can drag in any direction. The `xDir` and `yDir` determine whether to add or subtract from base position:

- Drag right & down: `xDir=1, yDir=1` → Grid extends right and down
- Drag left & up: `xDir=-1, yDir=-1` → Grid extends left and up
- Drag right & up: `xDir=1, yDir=-1` → Grid extends right and up

---

## Multi-Selection Handling

When multiple artifacts are selected:

```typescript
function duplicateMultipleArtifacts(
	selectedArtifacts,
	gridPositions,
	originalPosition
) {
	const duplicates = []

	// For each grid position (skip first, it's the original)
	for (const gridPos of gridPositions.slice(1)) {
		// For each selected artifact
		for (const artifact of selectedArtifacts) {
			// Calculate offset from original selection center
			const offset = {
				x: artifact.x - originalPosition.x,
				y: artifact.y - originalPosition.y,
			}

			// Place duplicate at grid position + offset
			duplicates.push({
				x: gridPos.x + offset.x,
				y: gridPos.y + offset.y,
				width: artifact.width,
				height: artifact.height,
			})
		}
	}

	return duplicates
}
```

This preserves the relative layout of selected items in each grid cell.

---

## Key Insights

### 1. Distance-Based Grid

The grid size is determined by **how far** you drag, not **how long** you drag. Drag twice as far = twice as many items.

### 2. Bidirectional

Works in all directions. Drag any direction to extend the grid that way.

### 3. Immediate Feedback

Grid placeholders appear immediately during drag, not after. User sees exactly what they'll get before releasing.

### 4. Zoom Independent

The grid calculation works at any zoom level because it converts between screen and canvas coordinates.

### 5. Fractional Cells

`Math.ceil()` ensures partial cells count as a full cell. Drag 1.5 items' worth of distance = 2 items.

---

## Testing Scenarios

### Test 1: Drag Right

```
Input:
- Selection: 100×100 at (0, 0)
- Drag to: (350, 0)
- Padding: 10
- Zoom: 1.0

Expected:
- numCols: ceil(350 / 110) = 4
- numRows: 1
- Positions: [(0,0), (110,0), (220,0), (330,0)]
```

### Test 2: Drag Diagonal

```
Input:
- Selection: 100×100 at (0, 0)
- Drag to: (250, 250)
- Padding: 10
- Zoom: 1.0

Expected:
- numCols: ceil(250 / 110) = 3
- numRows: ceil(250 / 110) = 3
- Grid: 3×3 = 9 total items
```

### Test 3: Drag Left

```
Input:
- Selection: 100×100 at (500, 0)
- Drag to: (200, 0)
- Padding: 10
- Zoom: 1.0

Expected:
- xDir: -1 (going left)
- numCols: ceil(300 / 110) = 3
- Positions: [(500,0), (390,0), (280,0)]
```

### Test 4: Zoomed Out

```
Input:
- Selection: 100×100 screen pixels at (0, 0)
- Drag to: (350, 0) screen pixels
- Padding: 10
- Zoom: 0.5 (zoomed out)

Canvas units:
- Selection: 200×200
- Drag distance: 700
- Padding: 10

Expected:
- numCols: ceil(700 / 210) = 4
- Screen padding: 10 * 0.5 = 5px
```

---

## Implementation Checklist

- [ ] Detect selection and show handle
- [ ] Bind drag gesture to handle
- [ ] Track drag position in canvas coordinates
- [ ] Calculate union rectangle
- [ ] Calculate grid dimensions (rows × cols)
- [ ] Determine drag direction (xDir, yDir)
- [ ] Calculate positions for all grid cells
- [ ] Show union outline during drag
- [ ] Show placeholder rectangles during drag
- [ ] Show prompt input on release
- [ ] Create duplicate shapes at calculated positions
- [ ] Handle multi-selection (preserve relative layout)
- [ ] Handle zoom levels correctly
- [ ] Cap at maximum grid size (10×10)
- [ ] Cancel if grid is 1×1

---

## Summary

This drag-to-duplicate system turns a simple drag gesture into a grid creation tool:

1. **Input**: Drag distance and direction
2. **Processing**: Calculate how many items fit in that space
3. **Output**: Grid of positioned duplicates

The key innovation is the **distance-to-quantity** mapping: dragging twice as far creates twice as many items. Combined with bidirectional support, this creates an intuitive way to quickly generate variations in any layout.
