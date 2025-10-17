# Canvas Playground

An infinite canvas system for creating, organizing, and manipulating various content types. Features a unified interaction model with sophisticated toolbar animations, custom video player, and frame-based organization.

## Quick Start

```bash
npm install
npm run dev
```

## Overview

Canvas Playground is a comprehensive canvas system that handles multiple content types with elegant interactions. The system includes sophisticated state management, smooth animations, and scale-aware UI components that adapt to zoom levels.

## Core Features

### Object Types

**Canvas Native Objects** (immediate creation, no generation):

- Text: Rich text content
- Shape: Geometric shapes (circle, rectangle, triangle)
- Doodle: Freehand drawings
- Sticky: Note cards with title and author
- Link: URL previews with metadata
- PDF: Document viewer

**Artifacts** (AI-generated content with generation pipeline):

- Image: AI-generated images
- Video: AI-generated videos with custom player
- Audio: AI-generated audio clips
- Document: AI-generated rich documents

**Organizational Concepts**:

- Frame: Container for grouping objects with layout options

### Video Player

Custom video player with scale-aware controls:

- Duration pill in bottom-left corner (play icon + duration)
- Hover to auto-play with custom progress bar
- Click-to-scrub on progress bar
- Smooth 60fps progress animation
- Scale-aware UI elements that adapt to zoom level
- Native controls when video is selected
- Cross-browser compatibility

### Toolbar System

Context-aware toolbar with smooth animations:

- Single selection toolbar with object-specific actions
- Multi-selection toolbar for batch operations
- Compact mode at small zoom levels (< 30px)
- Smooth spring-based position animations during zoom transitions
- Automatic layout animation for size changes
- Object metadata header appears/disappears based on size (> 120px)

### Frame System

Container system for organizing objects:

- Create frames from multi-selected objects
- Unframe to release children while preserving them
- Drag frames to move all children together
- Resize frames to scale children proportionally
- Cascade delete (deleting frame removes children)
- Parent-child relationship tracking
- Proper z-index management

### Interaction System

**Selection**:

- Single selection: click object
- Multi-selection: Shift+click or box selection
- Selection bounds with 8 resize handles
- Context-aware toolbars for selected objects

**Movement**:

- Drag objects by body or header
- Drag frames to move with children
- Pan canvas with spacebar+drag or middle mouse
- Arrow keys to nudge objects (Shift+arrow for 10px)

**Resizing**:

- 8 resize handles (4 corners, 4 edges)
- Corner handles maintain aspect ratio
- Edge handles resize in one dimension
- Frames scale children proportionally

**Zoom**:

- Mouse wheel to zoom in/out
- Pinch to zoom support
- Zoom controls in top-right corner
- Scale-aware UI elements (toolbar, video controls)
- UI size classification (tiny < 30px < small < 120px < large)

**Frame Drawing**:

- Press 'F' to enter frame drawing mode
- Click and drag to draw frame bounds
- Release to create frame at specified area

### Context Menu

Right-click context menu with actions:

- Object-specific actions based on type
- Color tagging system
- Duplicate, delete, and group operations
- Frame/unframe actions

### Keyboard Shortcuts

- `Delete` / `Backspace`: Delete selected objects
- `Cmd+D` / `Ctrl+D`: Duplicate selected objects
- `Cmd+Z` / `Ctrl+Z`: Undo
- `Cmd+Shift+Z` / `Ctrl+Shift+Z`: Redo
- `F`: Enter frame drawing mode
- `Escape`: Cancel editing/deselect/exit modes
- `Space+Drag`: Pan canvas
- Arrow keys: Nudge objects
- `Shift+Arrow`: Nudge objects by 10px

### Visual System

**Object Structure**:

- Header: Name, type icon, status indicator (editable on click)
- Content: Type-specific rendering
- Footer: Metadata (timestamps, created by info)
- Selection bounds: Blue outline when selected
- Resize handles: 8 handles for precise control

**Scale-Aware UI**:

- Object headers show/hide based on screen size (> 120px)
- Toolbar switches to compact mode at small sizes (< 30px)
- Video player controls scale with zoom level
- All UI elements maintain consistent visual size across zoom levels

### State Management

Object lifecycle states:

- `idle`: Normal ready state
- `pre-placeholder`: Awaiting user input
- `generating`: Content being created
- `error`: Generation failed with retry options

### History System

Full undo/redo support:

- Tracks all object modifications
- Keyboard shortcuts for quick access
- Preserves complete canvas state

## Project Structure

```
src/
├── components/
│   ├── canvas/           # Canvas layer and object rendering
│   ├── objects/          # Object-specific components
│   ├── placeholders/     # Generation state components
│   ├── toolbar/          # Toolbar variants
│   └── ui/               # Reusable UI components
├── config/               # Configuration and behavior definitions
├── handlers/             # Event handler logic
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## Technical Details

Built with:

- React + TypeScript
- Vite for build tooling
- Framer Motion for animations
- Tailwind CSS for styling
- Lucide React for icons

Key architectural patterns:

- Custom hooks for state management
- Handler factories for clean separation of concerns
- Scale-aware UI calculations
- Motion values for smooth animations without re-renders
- Context-aware component rendering

## Documentation

Detailed documentation available in `/documents`:

- `ARCHITECTURE.md`: System design and component structure
- `FEATURES.md`: Comprehensive feature documentation
- `TOOLBAR_ANIMATION_STRATEGY.md`: Animation implementation details
- `CUSTOM_VIDEO_PLAYER.md`: Video player specifications
- `FRAME_FEATURE_SUMMARY.md`: Frame system details

## Source

Original design: https://www.figma.com/design/I7pKtF30Q5SLI83TtHDFQl/Canvas-Playground-with-Toolbar
