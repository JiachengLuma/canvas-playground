/**
 * Action System Types
 * Defines what actions are possible for objects and multi-selections
 */

export type ObjectAction =
  | "delete"
  | "duplicate"
  | "rotate"
  | "colorTag"
  | "download"
  | "aiPrompt"
  | "convertToVideo"
  | "rerun"
  | "reframe"
  | "more"
  | "unframe"
  | "tag"
  | "rename";

export interface ActionContext {
  objectId: string;
  objectType: string;
  isMultiSelect: boolean;
  selectedIds: string[];
}

export interface ActionHandler {
  action: ObjectAction;
  handler: (context: ActionContext) => void;
  label?: string;
  icon?: string;
  description?: string;
}

