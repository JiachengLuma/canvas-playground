// ============================================================================
// OBJECT TYPES
// ============================================================================

// Canvas native things (no generation required)
export type CanvasNativeType = 
  | 'text'
  | 'shape'
  | 'doodle'
  | 'sticky'
  | 'link'
  | 'pdf';

// Artifacts (AI-generated, go through generation pipeline)
export type ArtifactType =
  | 'image'
  | 'video'
  | 'audio'
  | 'document';

// Organizational
export type ContainerType = 'frame';

export type ObjectType = CanvasNativeType | ArtifactType | ContainerType;

// Helper to check if an object type is an artifact
export const isArtifact = (type: ObjectType): type is ArtifactType => {
  return ['image', 'video', 'audio', 'document'].includes(type);
};

// ============================================================================
// OBJECT STATES
// ============================================================================

export type ObjectState = 
  | 'idle'              // Normal ready state
  | 'pre-placeholder'   // Waiting for prompt input
  | 'generating'        // Generation in progress
  | 'error';            // Generation failed

// ============================================================================
// METADATA
// ============================================================================

export interface ObjectMetadata {
  prompt?: string;              // For artifacts: the generation prompt
  progress?: number;            // 0-100 for generation progress
  error?: string;               // Error message if state is 'error'
  createdAt: number;           // Timestamp
  updatedAt: number;           // Timestamp
  generationParams?: Record<string, any>; // Additional generation parameters
  createdBy?: {
    type: 'model' | 'user' | 'uploaded';
    name?: string;              // Model name (e.g., "Ray3") or user name (e.g., "Jon")
  };
}

// ============================================================================
// BASE OBJECT
// ============================================================================

export interface BaseCanvasObject {
  id: string;
  type: ObjectType;
  name: string;                 // User-editable name
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  state: ObjectState;
  colorTag?: ColorTag;
  metadata?: ObjectMetadata;
  parentId?: string;            // If object is in a frame
}

// ============================================================================
// CANVAS NATIVE OBJECTS
// ============================================================================

export interface TextObject extends BaseCanvasObject {
  type: 'text';
  content: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
}

export interface ShapeObject extends BaseCanvasObject {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'star';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

export interface DoodleObject extends BaseCanvasObject {
  type: 'doodle';
  paths: string; // SVG path data
  strokeColor?: string;
  strokeWidth?: number;
}

export interface StickyObject extends BaseCanvasObject {
  type: 'sticky';
  noteColor: string; // Background color of the sticky note
  noteTitle?: string;
  noteAuthor?: string;
}

export interface LinkObject extends BaseCanvasObject {
  type: 'link';
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
}

export interface PDFObject extends BaseCanvasObject {
  type: 'pdf';
  fileUrl: string;
  fileName: string;
  pageCount?: number;
  currentPage?: number;
}

// ============================================================================
// ARTIFACT OBJECTS (AI-Generated)
// ============================================================================

export interface ImageObject extends BaseCanvasObject {
  type: 'image';
  content: string; // URL or data URI
  aspectRatio?: number;
}

export interface VideoObject extends BaseCanvasObject {
  type: 'video';
  content: string; // URL
  duration?: number;
  thumbnail?: string;
}

export interface AudioObject extends BaseCanvasObject {
  type: 'audio';
  content: string; // URL
  duration?: number;
  waveformData?: number[];
}

export interface DocumentObject extends BaseCanvasObject {
  type: 'document';
  content: string; // Rich text or markdown
  scrollPosition?: number;
}

// ============================================================================
// FRAME OBJECT
// ============================================================================

export type LayoutType = 'hstack' | 'vstack' | 'grid';

export interface FrameObject extends BaseCanvasObject {
  type: 'frame';
  createdBy: 'human' | 'agent';
  autoLayout: boolean;
  layout: LayoutType;           // Only applies when autoLayout = true
  padding: number;
  gap: number;
  children: string[];           // Child object IDs
  backgroundColor?: string;
  borderRadius?: number;
  gridColumns?: number | 'auto-fit';
}

// ============================================================================
// UNION TYPE
// ============================================================================

export type CanvasObject = 
  | TextObject
  | ShapeObject
  | DoodleObject
  | StickyObject
  | LinkObject
  | PDFObject
  | ImageObject
  | VideoObject
  | AudioObject
  | DocumentObject
  | FrameObject;

// ============================================================================
// COLOR TAGS
// ============================================================================

export type ColorTag = 'none' | 'green' | 'yellow' | 'red';
