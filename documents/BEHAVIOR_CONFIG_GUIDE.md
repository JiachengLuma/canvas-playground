# Object Behaviors Configuration Guide

## Overview

The canvas system uses a **centralized JSON configuration** (`src/config/objectBehaviors.json`) to control UI behaviors and available actions for each object type. This makes it easy to customize behaviors without changing code.

---

## 📁 File Structure

```
src/config/
├── objectBehaviors.json    # Main configuration file (JSON)
└── behaviorConfig.ts        # TypeScript loader and utilities
```

---

## 🎯 Configuration Sections

### 1. **Object Behaviors** (`behaviors`)

Defines UI behaviors for each object type:

```json
{
  "behaviors": {
    "text": {
      "showToolbar": false, // Hide hover toolbar
      "showDragHandle": false, // Hide blue drag handle
      "showColorTag": true, // Show color tag dot
      "showMetadataOnSelect": true, // Show name/type header
      "allowDrag": true, // Enable dragging
      "allowRotate": false, // Disable rotation
      "allowResize": false, // Disable resizing
      "actions": [] // No menu actions
    }
  }
}
```

**Current Settings (as of 2025-01-12):**

| Object Type | Toolbar | Drag Handle | Header | Actions                                 |
| ----------- | ------- | ----------- | ------ | --------------------------------------- |
| Text        | ❌ No   | ❌ No       | ✅ Yes | None                                    |
| Shape       | ❌ No   | ❌ No       | ❌ No  | None                                    |
| Doodle      | ❌ No   | ❌ No       | ❌ No  | None                                    |
| Sticky      | ❌ No   | ❌ No       | ❌ No  | None                                    |
| Link        | ❌ No   | ❌ No       | ✅ Yes | None                                    |
| PDF         | ✅ Yes  | ✅ Yes      | ❌ No  | download, tag                           |
| Image       | ✅ Yes  | ✅ Yes      | ✅ Yes | download, aiPrompt, convertToVideo, tag |
| Video       | ✅ Yes  | ✅ Yes      | ✅ Yes | download, rerun, tag                    |
| Audio       | ✅ Yes  | ✅ Yes      | ✅ Yes | download, rerun, tag                    |
| Document    | ✅ Yes  | ✅ Yes      | ✅ Yes | download, rerun, tag                    |
| Frame       | ✅ Yes  | ✅ Yes      | ✅ Yes | unframe, download, tag                  |

**Note:** "Header" refers to the metadata shown on select (e.g., "Shape • 140 × 140")

---

### 2. **Multi-Select Behaviors** (`multiSelect`)

Defines behavior when multiple objects are selected:

```json
{
  "multiSelect": {
    "showToolbar": true,
    "showDragHandle": false,
    "actions": ["delete", "duplicate", "tag", "aiPrompt"]
  }
}
```

---

### 3. **Hover Behaviors** (`hoverBehaviors`)

Controls hover interaction timing:

```json
{
  "hoverBehaviors": {
    "delayMs": 300, // 300ms delay on first hover
    "gracePeriodMs": 150, // 150ms to move cursor to toolbar
    "systemResetMs": 1000, // Reset to slow hover after 1s outside
    "minZoomLevel": 0.2, // Don't show toolbar below 20% zoom
    "description": "First hover: 300ms delay. Subsequent hovers: instant. After 1s outside hover: reset to 300ms delay."
  }
}
```

---

### 4. **Color Tags** (`colorTags`)

Defines available color tags:

```json
{
  "colorTags": {
    "enabled": true,
    "options": ["none", "red", "yellow", "green"],
    "defaultTag": "none",
    "alwaysVisible": true,
    "description": "Color tags cycle through: none → red → yellow → green → none"
  }
}
```

---

### 5. **Drag Behaviors** (`dragBehaviors`)

Controls drag interactions:

```json
{
  "dragBehaviors": {
    "thresholdPx": 3, // Move 3px before drag starts
    "optionKeyToDuplicate": true, // Option+drag to duplicate
    "hideDecorationsOnDrag": true, // Hide UI during drag
    "description": "..."
  }
}
```

---

### 6. **Action Definitions** (`actionDefinitions`)

Defines available actions with their metadata:

```json
{
  "actionDefinitions": {
    "download": {
      "label": "Download",
      "icon": "Download",
      "tooltip": "Download this item",
      "keyboardShortcut": null
    },
    "aiPrompt": {
      "label": "AI Prompt",
      "icon": "Sparkles",
      "tooltip": "Create with AI",
      "keyboardShortcut": null
    }
    // ... more actions
  }
}
```

---

## 💻 Usage in Code

### Import the Configuration

```typescript
import {
  shouldShowToolbar,
  shouldShowDragHandle,
  shouldShowMetadata,
  getActionsForType,
  getBehaviorForType,
  getColorTagConfig,
} from "../config/behaviorConfig";
```

### Check if Toolbar Should Show

```typescript
const objectType = object.type; // e.g., "image", "text", "shape"

if (shouldShowToolbar(objectType)) {
  // Render toolbar
}
```

### Check if Drag Handle Should Show

```typescript
if (shouldShowDragHandle(objectType)) {
  // Render drag handle
}
```

### Check if Metadata Header Should Show

```typescript
if (shouldShowMetadata(objectType)) {
  // Render metadata header (e.g., "Shape • 140 × 140")
}
```

### Get Available Actions

```typescript
const actions = getActionsForType("image");
// Returns: ["download", "aiPrompt", "convertToVideo", "tag"]
```

### Get Full Behavior Object

```typescript
const behavior = getBehaviorForType("text");
// Returns: { showToolbar: false, showDragHandle: false, ... }

if (behavior.allowResize) {
  // Enable resize handles
}
```

---

## 🔧 How to Modify Behaviors

### Example 1: Enable Toolbar for Text Objects

**Edit `objectBehaviors.json`:**

```json
{
  "behaviors": {
    "text": {
      "showToolbar": true, // Changed from false
      "actions": ["tag"] // Added tag action
    }
  }
}
```

### Example 2: Add a New Action

**Step 1:** Define the action in `actionDefinitions`:

```json
{
  "actionDefinitions": {
    "export": {
      "label": "Export",
      "icon": "FileExport",
      "tooltip": "Export to file",
      "keyboardShortcut": "Cmd+E"
    }
  }
}
```

**Step 2:** Add it to object's `actions` array:

```json
{
  "behaviors": {
    "pdf": {
      "actions": ["download", "tag", "export"] // Added "export"
    }
  }
}
```

### Example 3: Change Color Tag Options

```json
{
  "colorTags": {
    "options": ["none", "red", "yellow", "green", "blue"] // Added blue
  }
}
```

---

## 📋 Integration Checklist for Developers

### Current Status

- ✅ JSON configuration file created
- ✅ TypeScript loader with utilities created
- ✅ Integrated with `App.tsx` to use `shouldShowToolbar()` and `shouldShowDragHandle()`
- ✅ Integrated with `CanvasObject.tsx` to use `shouldShowMetadata()`
- ⏳ **TODO**: Update `ContextToolbar.tsx` to dynamically render actions
- ⏳ **TODO**: Update color tag logic to use `getColorTagConfig()`
- ⏳ **TODO**: Add unit tests for behavior configuration

### Integration Points

1. **App.tsx** ✅

   - ✅ Toolbar visibility uses `shouldShowToolbar(activeObject.type)`
   - ✅ Drag handle visibility uses `shouldShowDragHandle(activeObject.type)`
   - ⏳ **TODO**: Use `getColorTagConfig().options` for tag cycling

2. **CanvasObject.tsx** ✅

   - ✅ Metadata header visibility uses `shouldShowMetadata(object.type)`
   - ⏳ **TODO**: Use `shouldShowColorTag(object.type)` for color tag visibility

3. **ContextToolbar.tsx** ⏳
   - ⏳ **TODO**: Dynamically render action buttons based on `getActionsForType(objectType)`
   - ⏳ **TODO**: Use `getActionDefinition(actionName)` to get icon, label, tooltip

---

## 🎯 Benefits

1. **Centralized Control**: All UI behaviors in one place
2. **Easy Handoff**: Non-developers can modify behaviors via JSON
3. **Type Safety**: TypeScript utilities provide autocomplete and type checking
4. **Consistency**: Enforces consistent behavior across the app
5. **Documentation**: Self-documenting with descriptions and examples
6. **Version Control**: Changes tracked in git with clear diffs

---

## 📝 Notes for Future Development

- Consider adding object-specific keyboard shortcuts
- Consider adding animation configurations
- Consider adding theme/styling configurations per object type
- Consider adding per-object default dimensions
- Consider adding per-object z-index rules

---

**Last Updated:** 2025-01-12  
**Version:** 1.0  
**Owner:** Canvas System Team
