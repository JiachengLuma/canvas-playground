/**
 * Object Actions Configuration
 * Defines what actions are available for each object type
 */

import { ObjectType } from "../types";
import { ObjectAction } from "../types/actions";

/**
 * Actions available for each object type
 */
export const OBJECT_ACTIONS: Record<ObjectType, ObjectAction[]> = {
  // Canvas Native Objects (Human-created)
  text: ["delete", "duplicate", "rotate", "colorTag"],
  shape: ["delete", "duplicate", "rotate", "colorTag"],
  doodle: ["delete", "duplicate", "rotate", "colorTag"],
  sticky: ["delete", "duplicate", "colorTag", "rename"],
  link: ["delete", "duplicate", "colorTag"],
  pdf: ["delete", "duplicate", "colorTag", "download"],

  // AI Artifacts (Generated)
  image: [
    "delete",
    "duplicate",
    "colorTag",
    "download",
    "aiPrompt",
    "convertToVideo",
    "rerun",
  ],
  video: ["delete", "duplicate", "colorTag", "download", "rerun", "reframe"],
  audio: ["delete", "duplicate", "colorTag", "download", "rerun"],
  document: ["delete", "duplicate", "colorTag", "download", "rerun", "rename"],

  // Organizational
  frame: [
    "delete",
    "duplicate",
    "colorTag",
    "unframe",
    "download",
    "rename",
    "tag",
  ],
};

/**
 * Actions available for multi-select
 */
export const MULTI_SELECT_ACTIONS: ObjectAction[] = [
  "delete",
  "duplicate",
  "colorTag",
  "aiPrompt", // For mixed selections including artifacts
];

/**
 * Check if an action is available for a given object type
 */
export function isActionAvailable(
  objectType: ObjectType,
  action: ObjectAction
): boolean {
  return OBJECT_ACTIONS[objectType]?.includes(action) ?? false;
}

/**
 * Get all available actions for a given object type
 */
export function getAvailableActions(objectType: ObjectType): ObjectAction[] {
  return OBJECT_ACTIONS[objectType] ?? [];
}

/**
 * Get common actions available for all selected objects
 * Used for multi-select toolbars
 */
export function getCommonActions(objectTypes: ObjectType[]): ObjectAction[] {
  if (objectTypes.length === 0) return [];
  if (objectTypes.length === 1) return getAvailableActions(objectTypes[0]);

  // Find intersection of all actions
  const firstActions = new Set(getAvailableActions(objectTypes[0]));
  for (let i = 1; i < objectTypes.length; i++) {
    const currentActions = getAvailableActions(objectTypes[i]);
    // Keep only actions that exist in both sets
    for (const action of firstActions) {
      if (!currentActions.includes(action)) {
        firstActions.delete(action);
      }
    }
  }

  return Array.from(firstActions);
}

/**
 * Action metadata for UI display
 */
export const ACTION_METADATA: Record<
  ObjectAction,
  { label: string; description?: string }
> = {
  delete: { label: "Delete", description: "Remove from canvas" },
  duplicate: { label: "Duplicate", description: "Create a copy" },
  rotate: { label: "Rotate", description: "Rotate object" },
  colorTag: { label: "Color Tag", description: "Add color tag" },
  download: { label: "Download", description: "Download file" },
  aiPrompt: { label: "AI Prompt", description: "Generate with AI" },
  convertToVideo: {
    label: "Convert to Video",
    description: "Animate this image",
  },
  rerun: { label: "Rerun", description: "Generate again" },
  reframe: { label: "Reframe", description: "Adjust video framing" },
  more: { label: "More", description: "More options" },
  unframe: { label: "Unframe", description: "Remove from frame" },
  tag: { label: "Tag", description: "Add tags" },
  rename: { label: "Rename", description: "Change name" },
};

