# Canvas Playground Features

Comprehensive documentation of all implemented features in Canvas Playground.

## Table of Contents

1. [Object Types](#object-types)
2. [Video Player](#video-player)
3. [Toolbar System](#toolbar-system)
4. [Frame System](#frame-system)
5. [Selection System](#selection-system)
6. [Canvas Interactions](#canvas-interactions)
7. [Context Menu](#context-menu)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [History System](#history-system)
10. [Scale-Aware UI](#scale-aware-ui)
11. [MiniCanvas Component](#minicanvas-component)

## Object Types

### Canvas Native Objects

Objects that are created immediately without generation pipeline.

**Text**

- Rich text content
- Editable inline
- Font size and color customization
- Alignment options

**Shape**

- Geometric shapes: circle, rectangle, triangle
- Fill color and stroke customization
- Corner radius adjustments
- Rotation support

**Doodle**

- Freehand drawing paths
- Stroke color and width customization
- Path editing capabilities

**Sticky**

- Note card with title and author
- Color customization
- Inline editing

**Link**

- URL preview with metadata
- Open link action
- Edit and refresh URL

**PDF**

- Document viewer
- Page navigation
- Download capability

### Artifacts

Objects that go through generation pipeline: pre-placeholder > generating > ready/error.

**Image**

- AI-generated images
- Prompt-based creation
- Download and rerun capabilities
- Edit prompt option

**Video**

- AI-generated videos
- Custom video player with hover controls
- Progress bar with scrubbing
- Play/pause on selection
- Download capability

**Audio**

- AI-generated audio clips
- Playback controls
- Duration display
- Download capability

**Document**

- AI-generated rich documents
- Editable content
- Export options

### Frames

Container objects for organizing multiple objects.

**Properties**:

- Background color
- Border radius
- Padding and gap settings
- Children tracking

**Capabilities**:

- Group multiple objects
- Drag with all children
- Resize and scale children proportionally
- Unframe to release children
- Created by human or agent

## Video Player

Custom video player implementation with sophisticated controls.

### Visual Components

**Duration Pill** (bottom-left corner):

- Play icon indicator
- Duration text (formatted as "5s", "1m 30s", etc.)
- Translucent background with backdrop blur
- Automatically hidden when video is selected

**Progress Bar** (bottom edge):

- Rounded pill shape
- Dark background (rgba(0, 0, 0, 0.56))
- White progress indicator
- Interactive hover state (grows from 2px to 6px)
- Click-to-scrub functionality

### Behavior

**Non-Hover State**:

- Duration pill visible with background
- Progress bar hidden
- Video paused

**Hover State**:

- Duration pill background disappears (text remains)
- Custom progress bar appears
- Video auto-plays (muted, loops)
- Smooth 60fps progress animation

**Selected State**:

- Native browser controls shown
- Custom controls hidden
- Full video player capabilities

### Scale-Aware Design

All video player UI elements scale inversely with zoom level:

- Pill inset: 8px base
- Icon size: 12px
- Font size: 10px
- Progress bar height: 2px (6px on hover)
- Border radius: 12px (pill), 23px (progress bar)

Controls automatically hide when video is too small (< 40px min dimension).

### Technical Features

- Cross-browser compatibility (Chrome, Safari, Firefox, Edge)
- Native controls fully hidden in custom mode
- RequestAnimationFrame for smooth progress updates
- Click-to-scrub with precise seeking
- Hover state management
- Auto-play on hover with proper cleanup
- Graceful error handling

## Toolbar System

Context-aware toolbar with click-based activation and adaptive sizing.

### Activation

**Click-Based System**:

- Click on object to show toolbar
- Toolbar remains visible while object selected
- Click elsewhere or press Escape to hide
- Predictable and reliable visibility

**Previous hover-based system removed** for better UX and performance.

### Toolbar Modes

**Single Selection Toolbar**:

- Object-specific actions based on type
- Label background coloring
- Delete, duplicate, reframe actions
- Download options for media
- Edit options for content

**Multi-Selection Toolbar**:

- Batch operations
- Frame creation
- Group delete
- Batch label coloring
- Alignment tools

**Compact Mode** (< 30px screen size):

- Ellipsis menu with condensed actions
- Space-efficient layout
- Same functionality, reduced footprint

### Animation Strategy

**Position Animation**:

- Smooth spring-based transitions
- Only animates on zoom level changes
- Instant snap when changing selection
- Uses Framer Motion useMotionValue for performance

**Layout Animation**:

- Automatic size changes when switching compact mode
- Smooth morphing between states
- Spring physics for natural feel

**Animation Conditions**:

Animates when:

- Single object selected
- Zoom level changes
- Same object remains selected

Does not animate when:

- Switching between objects
- During drag operations
- During resize operations
- Multi-select operations

**Spring Parameters**:

- Stiffness: 400 (snappy response)
- Damping: 35 (smooth settling)
- Mass: 0.8 (light feel)

### Object Metadata Header

**Visibility Rules**:

- Shows when object screen size > 120px
- Hides when object screen size < 120px
- Smooth fade in/out transitions
- Toolbar position adjusts with smooth animation

**Content**:

- Object type icon
- Object name (editable)
- Creation attribution
- Timestamp information

## Frame System

Container system for organizing and managing groups of objects.

### Creation

**From Selection**:

1. Select multiple objects (Shift+click or box selection)
2. Click "Frame" button in multi-select toolbar
3. Frame wraps around objects with padding
4. New frame automatically selected

**From Drawing**:

1. Press 'F' to enter frame drawing mode
2. Click and drag to draw frame bounds
3. Release to create frame

### Properties

- Background color: #f6f6f6 (default)
- Border: 1px solid rgba(0, 0, 0, 0.1)
- Border radius: 10px
- Padding: 10px default
- Gap: 10px between children
- Always-visible label

### Interactions

**Dragging**:

- Drag frame to move all children together
- Children maintain relative positions
- Works with multi-select

**Resizing**:

- Resize handles on all 8 points
- Children scale proportionally
- Positions adjust to maintain relative layout

**Unframing**:

- Select frame and click "Unframe"
- Frame removed, children preserved
- All children automatically selected

**Deletion**:

- Deleting frame also deletes all children
- Cascade delete for clean removal

### Technical Details

**Parent-Child Relationships**:

- Children store `parentId` field
- Frame stores `children` array of IDs
- Z-index ensures proper layering

**Layout System**:

- Manual positioning (auto-layout off by default)
- Future: HStack, VStack, Grid layouts

## Selection System

Multi-mode selection system with visual feedback.

### Selection Methods

**Single Selection**:

- Click object to select
- Shows blue outline (2px)
- Displays 8 resize handles
- Shows object-specific toolbar

**Multi-Selection**:

- Shift+click to add/remove from selection
- Box selection by dragging on canvas
- Shows combined selection bounds
- Displays multi-select toolbar

**Frame Selection**:

- Click frame to select container
- Click children to select individually
- Children can be selected while in frame

### Visual Feedback

**States**:

- Unselected: Default appearance
- Hover: Subtle highlight
- Selected: Blue outline (2px), resize handles visible
- Multi-select: Blue outline, combined bounds shown

**Handles**:

- 8 resize handles: 4 corners, 4 edges
- Corner handles: diagonal resize
- Edge handles: single-axis resize
- Visible only when selected

## Canvas Interactions

Comprehensive interaction system for manipulating objects and navigating canvas.

### Movement

**Object Dragging**:

- Click and drag object body
- Drag object header for guaranteed movement
- Multi-select drag moves all selected objects
- Snap-to-grid option (configurable)

**Canvas Panning**:

- Spacebar + drag to pan
- Middle mouse button drag
- Works at any zoom level
- Smooth performance with many objects

**Nudging**:

- Arrow keys: Move 1px
- Shift + arrow keys: Move 10px
- Works with multi-selection

### Resizing

**8-Point Resize System**:

- Top-left, top, top-right
- Left, right
- Bottom-left, bottom, bottom-right

**Behaviors**:

- Corner handles: Diagonal resize
- Edge handles: Single-axis resize
- Shift: Maintain aspect ratio (corners)
- Frame resize: Scale children proportionally

### Zoom

**Controls**:

- Mouse wheel: Zoom in/out
- Pinch gesture: Zoom on trackpad
- Zoom buttons: Top-right UI controls
- Zoom to fit: Reset view

**Effects**:

- UI elements scale inversely
- Toolbar adapts to screen size
- Video controls maintain visibility
- Performance optimized for any zoom level

### Frame Drawing

**Activation**:

- Press 'F' key to enter mode
- Cursor changes to crosshair
- Canvas indicates frame drawing mode

**Creation**:

- Click and drag to define bounds
- Visual preview while dragging
- Release to create frame
- Escape to cancel

## Context Menu

Right-click menu with context-aware actions.

### General Actions

- Duplicate object
- Delete object
- Change color tag
- Download (for media objects)
- Edit properties

### Object-Specific Actions

**Images**:

- Download image
- Rerun generation
- Edit prompt

**Videos**:

- Download video
- Rerun generation
- Edit prompt

**Links**:

- Open link in new tab
- Edit URL
- Refresh preview

**Frames**:

- Unframe
- Download all contents
- Change layout (future)

### Color Tagging

- Red, orange, yellow, green, blue, purple tags
- Visual indicator on object
- Filter by tag (future enhancement)

## Keyboard Shortcuts

### General

- `Delete` / `Backspace`: Delete selected objects
- `Escape`: Deselect / cancel operation
- `Cmd/Ctrl + Z`: Undo
- `Cmd/Ctrl + Shift + Z`: Redo
- `Cmd/Ctrl + D`: Duplicate selected

### Navigation

- `Space + Drag`: Pan canvas
- Arrow keys: Nudge 1px
- `Shift + Arrow`: Nudge 10px
- Mouse wheel: Zoom in/out

### Modes

- `F`: Enter frame drawing mode
- `Escape`: Exit frame drawing mode

### Future Shortcuts

- `Cmd/Ctrl + G`: Group into frame
- `Cmd/Ctrl + Shift + G`: Unframe
- `Cmd/Ctrl + Enter`: Confirm prompt
- `Cmd/Ctrl + A`: Select all

## History System

Complete undo/redo system for all canvas operations.

### Tracked Operations

- Object creation
- Object deletion
- Object modification (position, size, properties)
- Selection changes
- Frame creation/deletion
- Property updates

### Implementation

- Immutable state snapshots
- Efficient memory management
- Keyboard shortcut support
- Preserves complete canvas state

### Limitations

- History cleared on page refresh
- No persistence to storage (future enhancement)

## Label System

Visual organization system using colored background pills on object headings.

### Colored Label Backgrounds

**Colors Available**:

- None: Transparent (default)
- Red: #ef4444
- Green: #22c55e
- Yellow: #eab308

**Features**:

- Click toolbar button to cycle colors
- Multi-select batch operations
- Independent visibility from standard headers
- Smooth scaling transitions

### Inline Renaming

**Double-Click to Edit**:

- Double-click any label to rename
- Text becomes editable inline
- Press Enter to confirm, Escape to cancel
- Keyboard shortcuts disabled during editing

### Per-Object Scaling

**Important Behavior**:

Labels scale individually based on each object's screen size. Multiple objects at the same zoom level may have labels at different scales.

**Scaling Rules**:

- Micro (≤ 10px): Hidden
- Tiny (10-30px): 0.5x → 1.0x smooth transition
- Small (30-120px): 1.0x full scale
- Normal (≥ 120px): 1.0x full scale

**Example**: A large frame and small image at 50% zoom will have labels at different scales - this is expected behavior ensuring readability.

### Visibility Rules

**Colored Labels**:

- Visible at tiny/small/normal scales
- Visible even during multi-select
- Independent of selection state

**Uncolored Labels** (standard metadata):

- Only visible when selected
- Only visible at normal scale (≥ 120px)
- Hidden during multi-select

### Technical Details

- GPU-accelerated scaling with CSS transforms
- Smooth 0.15s transitions
- Per-object scale calculation
- 2px gap between label and object
- Transform origin: left center

See [LABEL_SYSTEM.md](LABEL_SYSTEM.md) for comprehensive documentation.

## Scale-Aware UI

Sophisticated system for maintaining UI element visibility and sizing across zoom levels.

### Size Classification

Objects classified into 4 states by screen dimensions:

- Micro: ≤ 10px minimum dimension
- Tiny: 10-30px minimum dimension
- Small: 30-120px minimum dimension
- Normal: ≥ 120px minimum dimension

### Adaptive Behaviors

**Toolbar**:

- Normal (≥ 120px): Full toolbar with all buttons
- Small (30-120px): Full toolbar with all buttons
- Tiny (10-30px): Compact mode with ellipsis menu
- Micro (≤ 10px): Hidden

**Object Header** (standard metadata):

- Normal (≥ 120px): Full header visible when selected
- Small/Tiny/Micro: Hidden

**Colored Labels**:

- Normal (≥ 120px): Full scale (1.0x)
- Small (30-120px): Full scale (1.0x)
- Tiny (10-30px): Scaling (0.5x → 1.0x)
- Micro (≤ 10px): Hidden

**Video Controls**:

- Large (> 40px): Full custom controls
- Tiny (< 40px): Controls hidden
- All sizes: Elements scale inversely with zoom

**Corner Handles**:

- Normal/Small (≥ 30px): All 4 handles
- Tiny/Micro (< 30px): Single top-right handle

**Drag Handle**:

- Normal/Small (≥ 30px): Visible
- Tiny/Micro (< 30px): Hidden

### Calculation Method

Screen size = Object dimension × zoom level

Example:

- Object width: 200px
- Zoom: 0.5
- Screen width: 100px
- Classification: Large (shows full UI)

### Benefits

- Consistent visual size across zoom levels
- No UI clutter at small sizes
- Readable controls at all zoom levels
- Smooth transitions between states
- Optimized performance by hiding unnecessary elements

## MiniCanvas Component

Interactive demo canvas for documentation and examples.

### Purpose

**Documentation Integration**:

- Embedded interactive examples
- Visual demonstrations of features
- Real-time playground for experimentation
- Section-specific example objects

**Functionality**:

- Full canvas implementation reused
- All interactions available (drag, resize, select)
- Zoom and pan controls
- Context-aware examples per documentation section

### Auto-Centering

**Smart Viewport Management**:

- Automatically centers content on load
- Calculates bounds of all example objects
- Fits content to 85% of viewport (15% padding)
- Optimized zoom level for visibility

**Algorithm**:

1. Calculate bounding box of all objects (minX, minY, maxX, maxY)
2. Determine content center point
3. Calculate optimal zoom level to fit content
4. Adjust pan offset to center content in viewport
5. Clamp zoom between 0.3x and 1.5x

### Example Object Sets

**Predefined Scenarios**:

Each documentation section has tailored example objects:

- `overview`: Basic image and text objects
- `navigation`: Pan demonstration
- `selection-modes`: Multiple shapes for selection
- `hover-behavior`: Objects with toolbars
- `drag-behavior`: Drag handle examples
- `artifacts`: AI-generated content types
- `canvas-natives`: Native object types
- `color-tags`: Color tagging demonstration
- `keyboard-shortcuts`: Keyboard interaction examples
- `zoom-behavior`: Zoom feature demonstration
- `resize-behavior`: Resizable vs non-resizable objects
- `frames`: Frame container examples

### User Experience

**Interactive Elements**:

- Click and drag to move objects
- Select objects to see toolbars
- Multi-select with Shift+click
- Alt+drag to pan
- Cmd+scroll to zoom at cursor
- Zoom controls in bottom-right
- Instructions overlay in bottom-left

**Responsive Design**:

- Adapts to container size
- Maintains aspect ratio
- Scales UI elements appropriately
- Smooth transitions between sections

### Technical Implementation

**Reuses Core Systems**:

- `useCanvasState`: Object state management
- `useSelection`: Selection system
- `useDrag`: Drag and resize handlers
- `useToolbar`: Toolbar visibility
- `usePan`: Pan interactions
- `useKeyboardShortcuts`: Keyboard support

**Performance Optimizations**:

- Efficient re-rendering
- Lazy loading of section data
- Minimal re-calculations
- Smooth 60fps interactions

## Future Enhancements

### Planned Features

**Auto Layout**:

- HStack: Horizontal arrangement
- VStack: Vertical arrangement
- Grid: Automatic grid layout
- Configurable gaps and padding

**Enhanced Video Player**:

- Volume controls
- Fullscreen support
- Keyboard shortcuts
- Preview thumbnails on scrub

**Collaboration**:

- Multi-user cursors
- Real-time synchronization
- Comment system
- Version history

**Export/Import**:

- Export to various formats (PNG, SVG, PDF)
- Import existing designs
- Save/load canvas state
- Cloud storage integration

**Advanced Selection**:

- Select by type
- Select by tag
- Select by parent frame
- Selection history

**Performance**:

- Virtual canvas rendering
- Object culling outside viewport
- Lazy loading for media
- Optimized rendering pipeline
