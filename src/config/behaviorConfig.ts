/**
 * Object Behaviors Configuration Loader
 * 
 * This module loads and provides typed access to the objectBehaviors.json
 * configuration file, which defines UI behaviors for each canvas object type.
 */

import objectBehaviorsJson from './objectBehaviors.json';
import { ObjectType } from '../types';

// Type definitions for the configuration
export interface ObjectBehavior {
  showToolbar: boolean;
  showDragHandle: boolean;
  showColorTag: boolean;
  showMetadataOnSelect: boolean;
  allowDrag: boolean;
  allowRotate: boolean;
  allowResize: boolean;
  actions: string[];
}

export interface MultiSelectBehavior {
  showToolbar: boolean;
  showDragHandle: boolean;
  actions: string[];
}

export interface HoverBehavior {
  delayMs: number;
  gracePeriodMs: number;
  systemResetMs: number;
  minZoomLevel: number;
  description: string;
}

export interface ColorTagConfig {
  enabled: boolean;
  options: string[];
  defaultTag: string;
  alwaysVisible: boolean;
  description: string;
}

export interface DragBehavior {
  thresholdPx: number;
  optionKeyToDuplicate: boolean;
  hideDecorationsOnDrag: boolean;
  description: string;
}

export interface ActionDefinition {
  label: string;
  icon: string;
  tooltip: string;
  keyboardShortcut: string | null;
}

export interface BehaviorConfig {
  behaviors: Record<string, ObjectBehavior>;
  multiSelect: MultiSelectBehavior;
  hoverBehaviors: HoverBehavior;
  colorTags: ColorTagConfig;
  dragBehaviors: DragBehavior;
  actionDefinitions: Record<string, ActionDefinition>;
}

// Load the configuration
const config: BehaviorConfig = objectBehaviorsJson as BehaviorConfig;

/**
 * Get behavior configuration for a specific object type
 */
export function getBehaviorForType(type: ObjectType): ObjectBehavior {
  return config.behaviors[type] || {
    showToolbar: false,
    showDragHandle: false,
    showColorTag: true,
    showMetadataOnSelect: true,
    allowDrag: true,
    allowRotate: false,
    allowResize: false,
    actions: [],
  };
}

/**
 * Check if an object type should show the toolbar
 */
export function shouldShowToolbar(type: ObjectType): boolean {
  return getBehaviorForType(type).showToolbar;
}

/**
 * Check if an object type should show the drag handle
 */
export function shouldShowDragHandle(type: ObjectType): boolean {
  return getBehaviorForType(type).showDragHandle;
}

/**
 * Check if an object type should show color tags
 */
export function shouldShowColorTag(type: ObjectType): boolean {
  return getBehaviorForType(type).showColorTag;
}

/**
 * Check if an object type should show metadata header on select
 */
export function shouldShowMetadata(type: ObjectType): boolean {
  return getBehaviorForType(type).showMetadataOnSelect;
}

/**
 * Get available actions for an object type
 */
export function getActionsForType(type: ObjectType): string[] {
  return getBehaviorForType(type).actions;
}

/**
 * Get multi-select behavior configuration
 */
export function getMultiSelectBehavior(): MultiSelectBehavior {
  return config.multiSelect;
}

/**
 * Get hover behavior configuration
 */
export function getHoverBehavior(): HoverBehavior {
  return config.hoverBehaviors;
}

/**
 * Get color tag configuration
 */
export function getColorTagConfig(): ColorTagConfig {
  return config.colorTags;
}

/**
 * Get drag behavior configuration
 */
export function getDragBehavior(): DragBehavior {
  return config.dragBehaviors;
}

/**
 * Get action definition
 */
export function getActionDefinition(actionName: string): ActionDefinition | null {
  return config.actionDefinitions[actionName] || null;
}

/**
 * Get all action definitions for a specific object type
 */
export function getActionDefinitionsForType(type: ObjectType): ActionDefinition[] {
  const actions = getActionsForType(type);
  return actions
    .map(actionName => getActionDefinition(actionName))
    .filter(Boolean) as ActionDefinition[];
}

/**
 * Export the full config for advanced use cases
 */
export const behaviorConfig = config;

