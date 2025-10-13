# Vespa Autolayout Frame Implementation Guide

## Overview

The autolayout frame in Vespa is a container that automatically arranges its children in a row or column layout, similar to Figma's auto-layout frames. It uses TLDraw's binding system to connect child shapes to the container and automatically repositions/resizes children when they are added, removed, or reordered.

---

## Core Architecture

### Three Main Components

1. **GridShape** - The container frame itself
2. **LayoutBinding** - Connections between container and children
3. **BaseLayoutShapeUtil** - Drag/drop interaction handling

---

## 1. Grid Shape (Container)

### Shape Definition

```typescript
// GridConstants.ts
export type IGridShape = TLBaseShape<
	'grid',
	{
		w: number // Width of container
		h: number // Height of container
		name: string // Display name/title
	}
>

export const GRID_PADDING = 24 // Spacing between items
```

### Key Features

- **Axis Detection**: Layout direction is determined by parent
  - If parent is page → horizontal layout (`axis = 'x'`)
  - If parent is another grid → vertical layout (`axis = 'y'`)
- **Auto-sizing**: Container resizes based on children
- **Visual**: Rounded rectangle with blue border and heading label

### Shape Util (GridShapeUtil.tsx)

```typescript
export class GridShapeUtil extends BaseLayoutShapeUtil<IGridShape> {
	static override type = 'grid' as const

	getDefaultProps(): IGridShape['props'] {
		return {
			w: 100,
			h: 100,
			name: 'Frame',
		}
	}

	// Allow shapes to be dragged into/out of frame
	override onDragShapesIn(shape: IGridShape, draggingShapes: TLShape[]): void {
		const reparentingShapes = draggingShapes.filter(
			(s) =>
				s.parentId !== shape.id && (s.type === 'artifact' || s.type === 'grid')
		)
		if (reparentingShapes.length === 0) return
		editor.reparentShapes(reparentingShapes, shape.id)
	}

	override onDragShapesOut(
		shape: IGridShape,
		draggingShapes: TLShape[],
		info: TLDragShapesOutInfo
	): void {
		const reparentingShapes = draggingShapes.filter(
			(s) => s.parentId === shape.id
		)
		if (!info.nextDraggingOverShapeId) {
			editor.reparentShapes(reparentingShapes, editor.getCurrentPageId())
		}
	}
}
```

---

## 2. Layout Binding System

### Binding Definition

```typescript
// AutoLayoutBinding.tsx
export type ILayoutBinding = TLBaseBinding<
	'layout',
	{
		index: IndexKey // Fractional index for ordering
		placeholder: boolean // True during drag (don't update position)
	}
>
```

### How Bindings Work

- Each child shape has a binding to its container
- `fromId` = container shape ID
- `toId` = child shape ID
- `index` = determines order in layout (using fractional indexing)
- `placeholder` = prevents position updates during drag

### Layout Calculation Logic

```typescript
export class LayoutBindingUtil extends BindingUtil<ILayoutBinding> {
	static override type = 'layout' as const

	// Called whenever binding changes
	private updateElementsForContainer(binding: ILayoutBinding) {
		const container = this.editor.getShape<IGridShape>(binding.fromId)
		if (!container) return

		// Determine layout direction
		const axis =
			container.parentId === this.editor.getCurrentPageId()
				? 'x' // Horizontal if on page
				: 'y' // Vertical if nested

		// Get all bindings sorted by index
		const bindings = this.editor
			.getBindingsFromShape<ILayoutBinding>(container, 'layout')
			.sort((a, b) => (a.props.index > b.props.index ? 1 : -1))

		if (bindings.length === 0) return

		// Calculate positions
		let width = GRID_PADDING
		let maxHeight = 0

		for (let i = 0; i < bindings.length; i++) {
			const binding = bindings[i]
			const shape = this.editor.getShape(binding.toId)
			if (!shape) continue

			// Calculate offset for this child
			const offset =
				axis === 'x'
					? new Vec(width, GRID_PADDING)
					: new Vec(GRID_PADDING, width)

			// Accumulate width/height
			width +=
				axis === 'x'
					? shape.props.w + GRID_PADDING
					: shape.props.h + GRID_PADDING

			maxHeight = Math.max(
				maxHeight,
				axis === 'x' ? shape.props.h : shape.props.w
			)

			// Skip position update if placeholder (dragging)
			if (binding.toId === binding.toId && binding.props.placeholder) continue

			// Convert offset to parent space and update shape position
			const point = this.editor.getPointInParentSpace(
				shape,
				this.editor.getShapePageTransform(container)!.applyToPoint(offset)
			)

			if (shape.x !== point.x || shape.y !== point.y) {
				this.editor.updateShape({
					id: binding.toId,
					type: shape.type,
					x: point.x,
					y: point.y,
				})
			}
		}

		// Calculate final container size
		let height = maxHeight + GRID_PADDING * 2

		// Swap dimensions for vertical layout
		if (axis === 'y') {
			const temp = width
			width = height
			height = temp
		}

		// Update container size if changed
		if (width !== container.props.w || height !== container.props.h) {
			this.editor.updateShape({
				id: container.id,
				type: container.type,
				props: { w: width, h: height },
			})
		}
	}

	// Hook into all binding lifecycle events
	override onAfterCreate({ binding }: BindingOnCreateOptions<ILayoutBinding>) {
		this.updateElementsForContainer(binding)
	}

	override onAfterChange({
		bindingAfter,
	}: BindingOnChangeOptions<ILayoutBinding>) {
		this.updateElementsForContainer(bindingAfter)
	}

	override onAfterChangeFromShape({
		binding,
	}: BindingOnShapeChangeOptions<ILayoutBinding>) {
		this.updateElementsForContainer(binding)
	}

	override onAfterDelete({ binding }: BindingOnDeleteOptions<ILayoutBinding>) {
		this.updateElementsForContainer(binding)
	}
}
```

---

## 3. Drag & Drop Interaction

### BaseLayoutShapeUtil.tsx

This handles the interaction when dragging shapes into/within/out of containers.

```typescript
export abstract class BaseLayoutShapeUtil<
	Shape extends TLBaseBoxShape,
> extends ShapeUtil<Shape> {
	// Define which shapes can be bound
	override canBind({ fromShapeType, toShapeType, bindingType }) {
		return (
			fromShapeType === 'grid' &&
			(toShapeType === 'artifact' || toShapeType === 'grid') &&
			bindingType === 'layout'
		)
	}

	// 1. Drag Start - Mark bindings as placeholders
	override onTranslateStart(shape: TLBaseBoxShape) {
		this.editor.updateBindings(
			this.editor
				.getBindingsToShape<ILayoutBinding>(shape, 'layout')
				.map((binding) => ({
					...binding,
					props: { ...binding.props, placeholder: true },
				}))
		)
	}

	// 2. During Drag - Update binding index
	override onTranslate(shape: TLBaseBoxShape) {
		// Find center of dragged shape
		const pageAnchor = this.editor.getShapePageTransform(shape).applyToPoint({
			x: shape.props.w / 2,
			y: shape.props.h / 2,
		})

		// Find container under cursor
		const targetContainer = this.getTargetContainer(shape, pageAnchor)

		if (!targetContainer) {
			// Not over a container - delete bindings
			const bindings = this.editor.getBindingsToShape<ILayoutBinding>(
				shape,
				'layout'
			)
			this.editor.deleteBindings(bindings)
			return
		}

		// Calculate index for insertion position
		const index = getBindingIndexForPosition(
			this.editor,
			shape,
			targetContainer,
			pageAnchor
		)

		// Update or create binding
		const existingBinding = this.editor
			.getBindingsFromShape<ILayoutBinding>(targetContainer, 'layout')
			.find((b) => b.toId === shape.id)

		if (existingBinding) {
			if (existingBinding.props.index === index) return
			this.editor.updateBinding<ILayoutBinding>({
				...existingBinding,
				props: {
					...existingBinding.props,
					placeholder: true,
					index,
				},
			})
		} else {
			this.editor.createBinding<ILayoutBinding>({
				id: createBindingId(),
				type: 'layout',
				fromId: targetContainer.id,
				toId: shape.id,
				props: { index, placeholder: true },
			})
		}
	}

	// 3. Drag End - Finalize binding
	override onTranslateEnd(initialShape: TLBaseBoxShape, shape: TLBaseBoxShape) {
		const pageAnchor = this.editor.getShapePageTransform(shape).applyToPoint({
			x: shape.props.w / 2,
			y: shape.props.h / 2,
		})

		const targetContainer = this.getTargetContainer(shape, pageAnchor)

		// Clean up empty containers
		if (!targetContainer) {
			if (
				initialShape.parentId !== shape.parentId &&
				initialShape.parentId !== this.editor.getCurrentPageId()
			) {
				const container = this.editor.getShape(initialShape.parentId)
				if (container && container.type === 'grid') {
					const descendants = this.editor.getSortedChildIdsForParent(
						container.id
					)
					if (descendants.length === 0) {
						this.editor.deleteShape(container.id)
					}
				}
			}
			return
		}

		// Calculate final index
		const index = getBindingIndexForPosition(
			this.editor,
			shape,
			targetContainer,
			pageAnchor
		)

		// Delete old bindings
		this.editor.deleteBindings(
			this.editor.getBindingsToShape<ILayoutBinding>(shape, 'layout')
		)

		// Create final binding (not placeholder)
		this.editor.createBinding<ILayoutBinding>({
			id: createBindingId(),
			type: 'layout',
			fromId: targetContainer.id,
			toId: shape.id,
			props: {
				index,
				placeholder: false,
			},
		})
	}

	private getTargetContainer(shape: TLBaseBoxShape, pageAnchor: Vec) {
		return this.editor.getShapeAtPoint(pageAnchor, {
			hitInside: true,
			filter: (otherShape) => {
				if (otherShape.id === shape.id) return false
				return this.editor.canBindShapes({
					fromShape: otherShape,
					toShape: shape,
					binding: 'layout',
				})
			},
		}) as IGridShape | undefined
	}
}
```

### Index Calculation for Insertion

```typescript
export function getBindingIndexForPosition(
	editor: Editor,
	shape: TLBaseBoxShape,
	container: IGridShape,
	pageAnchor: Vec
) {
	// Get all bindings sorted by index
	const allBindings = editor
		.getBindingsFromShape<ILayoutBinding>(container, 'layout')
		.sort((a, b) => (a.props.index > b.props.index ? 1 : -1))

	// Exclude current shape
	const siblings = allBindings.filter((b) => b.toId !== shape.id)

	// Determine layout direction
	const axis = container.parentId === editor.getCurrentPageId() ? 'x' : 'y'

	// Calculate insertion order based on position
	const order = clamp(
		Math.round(
			axis === 'x'
				? (pageAnchor.x - container.x - GRID_PADDING) /
						(shape.props.w + GRID_PADDING)
				: (pageAnchor.y - container.y - GRID_PADDING) /
						(shape.props.h + GRID_PADDING)
		),
		0,
		siblings.length + 1
	)

	// Get fractional index between siblings
	const belowSib = allBindings[order - 1]
	const aboveSib = allBindings[order]
	let index: IndexKey

	if (belowSib?.toId === shape.id) {
		index = belowSib.props.index
	} else if (aboveSib?.toId === shape.id) {
		index = aboveSib.props.index
	} else {
		index = getIndexBetween(belowSib?.props.index, aboveSib?.props.index)
	}

	return index
}
```

---

## 4. Complete Flow Diagram

```
User Action                 System Response
-----------                 ---------------
Select shape
Drag starts                → onTranslateStart()
                             - Mark bindings as placeholder

Dragging...                → onTranslate() (every frame)
                             - Find container under cursor
                             - Calculate insertion index
                             - Update/create binding (placeholder=true)
                             - LayoutBinding.onAfterChange()
                               - Calculates positions but skips placeholder

Drag ends                  → onTranslateEnd()
                             - Delete old bindings
                             - Create final binding (placeholder=false)
                             - LayoutBinding.onAfterCreate()
                               - Recalculates ALL positions
                               - Updates child positions
                               - Resizes container
```

---

## 5. Key Algorithms

### Layout Calculation (Horizontal Example)

```
Container: x=0, w=?, h=?
Padding: 24px

Children: [A(w:100,h:80), B(w:120,h:60), C(w:80,h:100)]

Step 1: Calculate positions
  A: x = 0 + 24 = 24, y = 24
  B: x = 24 + 100 + 24 = 148, y = 24
  C: x = 148 + 120 + 24 = 292, y = 24

Step 2: Calculate container size
  width = 292 + 80 + 24 = 396
  maxHeight = max(80, 60, 100) = 100
  height = 100 + 24*2 = 148

Result: Container(w:396, h:148)
```

### Fractional Indexing

Uses TLDraw's `getIndexBetween()` which generates strings that sort alphabetically:

```
Initial: ['a1', 'a2', 'a3']
Insert between 'a1' and 'a2': 'a15'
Insert before 'a1': 'a0V'
Insert after 'a3': 'a4'

This allows infinite insertions without renumbering.
```

---

## 6. Registration

Register with TLDraw editor:

```typescript
import { LayoutBindingUtil } from './Shapes/AutoLayoutBinding'
import { GridShapeUtil } from './Shapes/GridShapeUtil'

const editor = new Editor({
	shapeUtils: [
		GridShapeUtil,
		// ... other shapes
	],
	bindingUtils: [LayoutBindingUtil],
	// ... other config
})
```

---

## 7. Creating a Grid Programmatically

```typescript
import { createShapeId } from 'tldraw'

function createGridWithChildren(editor: Editor) {
	const gridId = createShapeId()

	// 1. Create container
	editor.createShape({
		id: gridId,
		type: 'grid',
		x: 100,
		y: 100,
		props: {
			w: 100,
			h: 100,
			name: 'My Grid',
		},
	})

	// 2. Create children
	const childId1 = createShapeId()
	const childId2 = createShapeId()

	editor.createShapes([
		{
			id: childId1,
			type: 'artifact',
			x: 0,
			y: 0,
			props: { w: 100, h: 100 },
		},
		{
			id: childId2,
			type: 'artifact',
			x: 0,
			y: 0,
			props: { w: 100, h: 100 },
		},
	])

	// 3. Create bindings
	editor.createBindings([
		{
			type: 'layout',
			fromId: gridId,
			toId: childId1,
			props: { index: 'a1', placeholder: false },
		},
		{
			type: 'layout',
			fromId: gridId,
			toId: childId2,
			props: { index: 'a2', placeholder: false },
		},
	])

	// Bindings will automatically position children and resize container
}
```

---

## 8. Edge Cases Handled

### Empty Container Deletion

```typescript
if (descendants.length === 0) {
	this.editor.deleteShape(container.id)
}
```

### Nested Grids

- Direction switches: horizontal on page, vertical when nested
- Works recursively

### Rotation

- Container heading rotates with frame
- Child positioning accounts for container rotation using transforms

### Resize Prevention During Drag

- `placeholder: true` flag prevents layout recalculation
- Only final drop triggers full layout update

---

## 9. Implementation Checklist

- [ ] Define container shape type (IGridShape)
- [ ] Implement GridShapeUtil with drag handlers
- [ ] Define binding type (ILayoutBinding)
- [ ] Implement LayoutBindingUtil with layout logic
- [ ] Create BaseLayoutShapeUtil for child shapes
- [ ] Register shape utils and binding utils with editor
- [ ] Add visual styling (border, heading, etc.)
- [ ] Handle fractional indexing for ordering
- [ ] Implement axis detection (horizontal/vertical)
- [ ] Add padding constants
- [ ] Test drag into/out of/within containers
- [ ] Test nested containers
- [ ] Test empty container cleanup

---

## 10. Key Differences from Figma

| Feature   | Figma             | Vespa Implementation  |
| --------- | ----------------- | --------------------- |
| Direction | Explicit property | Determined by nesting |
| Spacing   | Per-item spacing  | Global GRID_PADDING   |
| Alignment | Multiple options  | Top-aligned only      |
| Wrapping  | Supported         | Not supported         |
| Padding   | Individual sides  | Uniform padding       |

---

## Summary

The autolayout frame system consists of:

1. **Container (Grid)** - Frame that holds children
2. **Bindings** - Connect children to container with ordering
3. **Layout Engine** - Automatically positions children and resizes container
4. **Drag Handler** - Creates/updates bindings during interaction

The magic happens in `LayoutBindingUtil.updateElementsForContainer()` which:

- Sorts children by index
- Calculates positions based on axis
- Updates child positions
- Resizes container to fit

The system is reactive - any change to bindings triggers automatic layout recalculation.
