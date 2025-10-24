/**
 * Object Factory
 * Centralized functions for creating canvas objects
 */

import {
  CanvasObject,
  TextObject,
  ShapeObject,
  DoodleObject,
  StickyObject,
  LinkObject,
  PDFObject,
  ImageObject,
  VideoObject,
  AudioObject,
  DocumentObject,
  FrameObject,
  ArtifactType,
  CanvasNativeType,
} from "../types";
import { generateId } from "./canvasUtils";

/**
 * Base object properties
 */
function createBaseObject(
  type: string,
  x: number,
  y: number,
  width: number,
  height: number
): Partial<CanvasObject> {
  return {
    id: generateId(),
    x,
    y,
    width,
    height,
    state: "idle",
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  };
}

/**
 * Create a text object
 */
export function createText(x: number, y: number): TextObject {
  return {
    ...createBaseObject("text", x, y, 120, 60),
    type: "text",
    name: "Text",
    content: "Text",
  } as TextObject;
}

/**
 * Create a shape object
 */
export function createShape(
  x: number,
  y: number,
  shapeType: "circle" | "rectangle" = "circle"
): ShapeObject {
  // Randomly choose between circle and rectangle if not specified
  const finalShapeType =
    shapeType || (Math.random() > 0.5 ? "circle" : "rectangle");

  const colors = ["#ef4444", "#3b82f6", "#22c55e", "#f97316", "#a855f7"];
  const fillColor = colors[Math.floor(Math.random() * colors.length)];

  return {
    ...createBaseObject("shape", x, y, 140, 140),
    type: "shape",
    name: finalShapeType === "circle" ? "Circle" : "Rectangle",
    shapeType: finalShapeType,
    fillColor,
  } as ShapeObject;
}

/**
 * Create a doodle object
 */
export function createDoodle(x: number, y: number): DoodleObject {
  return {
    ...createBaseObject("doodle", x, y, 180, 120),
    type: "doodle",
    name: "Doodle",
    paths:
      "M 20 90 Q 40 20, 80 40 M 70 130 Q 100 80, 150 120 Q 120 100, 80 120 Z",
    strokeColor: "#000000",
    strokeWidth: 2.5,
  } as DoodleObject;
}

/**
 * Create a sticky note object
 */
export function createSticky(x: number, y: number): StickyObject {
  const colors = ["#fef08a", "#bfdbfe", "#fecaca", "#d9f99d", "#e9d5ff"];
  const noteColor = colors[Math.floor(Math.random() * colors.length)];

  return {
    ...createBaseObject("sticky", x, y, 250, 180),
    type: "sticky",
    name: "Sticky Note",
    content: "Note content here...",
    noteColor,
    noteTitle: "Note",
    noteAuthor: "@User",
  } as StickyObject;
}

/**
 * Create a link object
 */
export function createLink(x: number, y: number, url?: string): LinkObject {
  return {
    ...createBaseObject("link", x, y, 250, 100),
    type: "link",
    name: "Link",
    url: url || "https://example.com",
    title: "Example Link",
    description: "Link preview",
  } as LinkObject;
}

/**
 * Create a PDF object
 */
export function createPDF(x: number, y: number): PDFObject {
  return {
    ...createBaseObject("pdf", x, y, 200, 280),
    type: "pdf",
    name: "PDF Document",
    fileUrl: "",
    fileName: "document.pdf",
  } as PDFObject;
}

/**
 * Create an artifact (AI-generated object)
 * Starts in "pre-placeholder" state
 */
export function createArtifact(
  type: ArtifactType,
  x: number,
  y: number
): ImageObject | VideoObject | AudioObject | DocumentObject {
  const baseArtifact = {
    ...createBaseObject(type, x, y, 250, 200),
    state: "pre-placeholder",
    content: "",
  };

  switch (type) {
    case "image":
      return {
        ...baseArtifact,
        type: "image",
        name: "Image",
        width: 250,
        height: 200,
      } as ImageObject;

    case "video":
      return {
        ...baseArtifact,
        type: "video",
        name: "Video",
        width: 280,
        height: 160,
      } as VideoObject;

    case "audio":
      return {
        ...baseArtifact,
        type: "audio",
        name: "Audio",
        width: 250,
        height: 100,
      } as AudioObject;

    case "document":
      return {
        ...baseArtifact,
        type: "document",
        name: "Document",
        width: 280,
        height: 300,
      } as DocumentObject;

    default:
      throw new Error(`Unknown artifact type: ${type}`);
  }
}

/**
 * Create a placeholder that starts in "generating" state
 * Used for testing placeholder behaviors with automatic loading animation
 */
export function createPlaceholder(
  type: ArtifactType,
  x: number,
  y: number
): ImageObject | VideoObject | AudioObject | DocumentObject {
  const baseArtifact = {
    ...createBaseObject(type, x, y, 250, 200),
    state: "generating",
    content: "",
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      progress: 0,
      prompt: "Placeholder test",
    },
  };

  switch (type) {
    case "image":
      return {
        ...baseArtifact,
        type: "image",
        name: "Image",
        width: 250,
        height: 200,
      } as ImageObject;

    case "video":
      return {
        ...baseArtifact,
        type: "video",
        name: "Video",
        width: 280,
        height: 160,
        duration: 8, // Default duration for placeholder videos
      } as VideoObject;

    case "audio":
      return {
        ...baseArtifact,
        type: "audio",
        name: "Audio",
        width: 250,
        height: 100,
      } as AudioObject;

    case "document":
      return {
        ...baseArtifact,
        type: "document",
        name: "Document",
        width: 280,
        height: 300,
      } as DocumentObject;

    default:
      throw new Error(`Unknown artifact type: ${type}`);
  }
}

/**
 * Sample video URLs - randomly selected
 */
const VIDEO_URLS = [
  "https://cdn.midjourney.com/video/97a950f3-1ba8-4405-a27b-6b3ce19ba579/3.mp4",
  "https://cdn.midjourney.com/video/32f4b0f1-988c-4699-a94c-d46372789aae/0.mp4",
  "https://cdn.midjourney.com/video/28a49cfb-9957-4c9a-9e45-d2fd05594939/3.mp4",
  "https://cdn.midjourney.com/video/ef8ec7cf-6966-4fad-b6cc-8907f589e11a/3.mp4",
];

/**
 * Get a random video URL
 */
export function getRandomVideoUrl(): string {
  return VIDEO_URLS[Math.floor(Math.random() * VIDEO_URLS.length)];
}

/**
 * Sample content URLs for completed artifacts
 */
const SAMPLE_CONTENT = {
  image: "https://cdn.midjourney.com/c06a44a1-490a-4473-b458-3ff04e60fbba/0_0.png",
  video: "", // Not used - videos get random URL in completePlaceholder
  audio: "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav",
  document: "# Sample Document\n\nThis is a generated document with some content.\n\n## Features\n- Point 1\n- Point 2\n- Point 3",
};

/**
 * Complete a placeholder by transitioning to idle state with content
 */
export function completePlaceholder(
  object: ImageObject | VideoObject | AudioObject | DocumentObject
): ImageObject | VideoObject | AudioObject | DocumentObject {
  // Get content - for videos, get a NEW random URL each time
  const content = object.type === 'video' 
    ? getRandomVideoUrl() 
    : SAMPLE_CONTENT[object.type];

  const completed = {
    ...object,
    state: "idle" as const,
    content,
    metadata: {
      ...object.metadata,
      updatedAt: Date.now(),
      progress: 100,
    },
  };

  // Ensure video objects have a duration
  if (object.type === 'video') {
    return {
      ...completed,
      duration: (object as VideoObject).duration || 8,
    } as VideoObject;
  }

  return completed as ImageObject | VideoObject | AudioObject | DocumentObject;
}

/**
 * Create a canvas native object
 */
export function createCanvasNative(
  type: CanvasNativeType,
  x: number,
  y: number
): CanvasObject {
  switch (type) {
    case "text":
      return createText(x, y);
    case "shape":
      return createShape(x, y);
    case "doodle":
      return createDoodle(x, y);
    case "sticky":
      return createSticky(x, y);
    case "link":
      return createLink(x, y);
    case "pdf":
      return createPDF(x, y);
    default:
      throw new Error(`Unknown canvas native type: ${type}`);
  }
}

/**
 * Create a frame object
 */
export function createFrame(
  x: number,
  y: number,
  width: number,
  height: number,
  children: string[] = []
): FrameObject {
  return {
    ...createBaseObject("frame", x, y, width, height),
    type: "frame",
    name: "Frame",
    createdBy: "human",
    autoLayout: false,
    layout: "hstack",
    padding: 20,
    gap: 20,
    children,
    backgroundColor: "#f6f6f6",
    borderRadius: 15,
  } as FrameObject;
}

/**
 * Duplicate an existing object
 */
export function duplicateObject(
  object: CanvasObject,
  offsetX: number = 20,
  offsetY: number = 20
): CanvasObject {
  return {
    ...object,
    id: generateId(),
    x: object.x + offsetX,
    y: object.y + offsetY,
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  };
}

