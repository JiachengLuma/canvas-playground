import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  Music,
  Link as LinkIcon,
  File,
  Square,
  Image,
  Video,
  FileText,
} from "lucide-react";
import { CanvasObject as CanvasObjectType, ArtifactType } from "../types";
import { VideoPlayer } from "./VideoPlayer";
import { shouldShowMetadata } from "../config/behaviorConfig";
import { AgentFrameHeader } from "./AgentFrameEffects";
import {
  shouldShowObjectMetadata,
  shouldShowAllCornerHandles,
  getSelectionGap,
} from "../utils/canvasUtils";

interface CanvasObjectProps {
  object: CanvasObjectType;
  objects?: CanvasObjectType[]; // For rendering children in frames
  isSelected: boolean;
  isPartOfMultiSelect: boolean;
  isHoveredBySelection: boolean;
  isSelecting: boolean;
  isDraggingAny: boolean;
  hasSelection: boolean; // Whether any objects are currently selected
  zoomLevel: number;
  isActiveToolbar: boolean;
  toolbarSystemActivated: boolean;
  isResizing?: boolean; // Whether any resize operation is active
  // Additional props for determining child state when rendering autolayout frames
  selectedIds?: string[];
  hoveredBySelectionIds?: string[];
  activeToolbarId?: string | null;
  isMultiSelect?: boolean;
  selectionColor: string;
  hoverColor: string;
  videoPauseOnSelect?: boolean;
  onSetActiveToolbar: (id: string | null) => void;
  onActivateToolbarSystem: () => void;
  onObjectHoverEnter: (id: string) => void;
  onObjectHoverLeave: (id: string) => void;
  onSelect: (id: string, multi: boolean) => void;
  onDragStart: (id: string, optionKey: boolean) => void;
  onDrag: (x: number, y: number) => void;
  onDragEnd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRotate: (id: string) => void;
  onColorTagChange: (id: string) => void;
  onContentUpdate?: (id: string, content: string) => void;
  onResizeStart?: (corner: string, e: React.MouseEvent) => void;
}

export function CanvasObject({
  object,
  objects,
  isSelected,
  isPartOfMultiSelect,
  isHoveredBySelection,
  isSelecting,
  isDraggingAny,
  hasSelection,
  zoomLevel,
  isActiveToolbar,
  toolbarSystemActivated,
  isResizing,
  selectedIds,
  hoveredBySelectionIds,
  activeToolbarId,
  isMultiSelect,
  selectionColor,
  hoverColor,
  videoPauseOnSelect = false,
  onSetActiveToolbar,
  onActivateToolbarSystem,
  onObjectHoverEnter,
  onObjectHoverLeave,
  onSelect,
  onDragStart,
  onDrag,
  onDragEnd,
  onDelete,
  onDuplicate,
  onRotate,
  onColorTagChange,
  onContentUpdate,
  onResizeStart,
}: CanvasObjectProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const hasMovedDuringDrag = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0, altKey: false });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);

  // Listen for Shift key to show proportional scale mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click

    // Disable dragging for objects inside autolayout frames
    // Autolayout manages positioning, so individual dragging doesn't make sense
    if (isChildOfAutolayoutFrame) {
      e.stopPropagation();
      // Still allow selection
      if (!isSelected) {
        onSelect(object.id, e.shiftKey || e.metaKey);
      }
      return;
    }

    e.stopPropagation();

    // Check if clicking on video controls - if so, don't start drag
    const target = e.target as HTMLElement;
    const isClickingVideo =
      target.tagName === "VIDEO" || target.closest("video");
    const isVideoSelected = object.type === "video" && isSelected;

    if (isClickingVideo && isVideoSelected) {
      // Allow video controls to work, don't start drag
      return;
    }

    // Clear any pending hover timeout to prevent toolbar from appearing during drag
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // If clicking on an already-selected object in a multi-selection without modifier keys,
    // don't change selection - just prepare to drag all selected objects
    const shouldChangeSelection = !isSelected || e.shiftKey || e.metaKey;

    if (shouldChangeSelection) {
      onSelect(object.id, e.shiftKey || e.metaKey);
    }

    // Activate toolbar on click (for single selection only)
    if (!e.shiftKey && !e.metaKey) {
      onSetActiveToolbar(object.id);
      onActivateToolbarSystem();
    }

    // Prepare for drag but don't start yet - wait for mouse movement
    setIsDragging(true);
    hasMovedDuringDrag.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY, altKey: e.altKey };
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click from bubbling to canvas which would clear selection
    e.stopPropagation();
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const dx = (e.clientX - dragStartPos.current.x) / zoomLevel;
      const dy = (e.clientY - dragStartPos.current.y) / zoomLevel;

      // Only start actual drag if moved more than 3px (prevents accidental drags on clicks)
      if (
        !hasMovedDuringDrag.current &&
        (Math.abs(dx) > 3 || Math.abs(dy) > 3)
      ) {
        hasMovedDuringDrag.current = true;

        // Hide toolbar immediately when drag starts
        onSetActiveToolbar(null);

        // Clear any pending hover timeout
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }

        // Now actually start the drag operation
        onDragStart(object.id, dragStartPos.current.altKey);
      }

      // Only call onDrag if we've started moving
      if (hasMovedDuringDrag.current || Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        onDrag(dx, dy);
        dragStartPos.current = {
          ...dragStartPos.current,
          x: e.clientX,
          y: e.clientY,
        };
      }
    },
    [isDragging, zoomLevel, onDragStart, object.id, onDrag, onSetActiveToolbar]
  );

  const handleMouseUp = useCallback(() => {
    // Only call onDragEnd if we actually dragged (moved)
    if (hasMovedDuringDrag.current) {
      onDragEnd();
    }
    setIsDragging(false);
    hasMovedDuringDrag.current = false;
  }, [onDragEnd]);

  // Add global mouse listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onObjectHoverEnter(object.id); // Notify parent that we're hovering an object

    // Toolbar activation removed - toolbar only shows on click/selection
    // Video auto-play is now handled in VideoPlayer component
  };

  const handleMouseLeave = () => {
    setIsHovered(false);

    // Clear the timeout if mouse leaves before the hover delay completes
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Video pause is now handled in VideoPlayer component

    // Only hide toolbar if object is NOT selected
    // Selected objects should keep their toolbar visible
    if (!isSelected) {
      onObjectHoverLeave(object.id); // Notify parent that we left an object
    }
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const renderContent = () => {
    // Helper to render loading state for artifacts
    const renderLoadingState = (Icon: any) => {
      const progress = object.metadata?.progress || 0;
      return (
        <div className="relative w-full h-full bg-[#b2b2b2] flex items-center justify-center overflow-hidden">
          {/* Loading bar overlay */}
          <div
            className="absolute inset-0 bg-[#8a8a8a] origin-left transition-transform duration-100 ease-linear"
            style={{
              transform: `scaleX(${progress / 100})`,
              transformOrigin: "left",
            }}
          />
          {/* Icon in center */}
          <div className="relative z-10 flex items-center justify-center">
            <Icon
              className="w-12 h-12 text-white opacity-70"
              strokeWidth={1.5}
            />
          </div>
        </div>
      );
    };

    switch (object.type) {
      // AI Artifacts
      case "image":
        // Show loading state if generating
        if (object.state === "generating") {
          return renderLoadingState(Image);
        }
        return (
          <img
            src={object.content}
            alt="Canvas object"
            className="w-full h-full object-cover pointer-events-none select-none"
            draggable={false}
            style={{
              pointerEvents: "none",
            }}
            onError={(e) => {
              console.error("Image failed to load:", object.content);
            }}
          />
        );
      case "video":
        // Show loading state if generating
        if (object.state === "generating") {
          return renderLoadingState(Video);
        }

        const videoObj = object as any;
        const duration = videoObj.duration || 0;
        const hasAudio = videoObj.hasAudio || false;

        return (
          <VideoPlayer
            src={object.content}
            isSelected={isSelected}
            isHovered={isHovered}
            zoomLevel={zoomLevel}
            width={object.width}
            height={object.height}
            duration={duration}
            pauseOnSelect={videoPauseOnSelect}
            isDragging={isDraggingAny}
            hasAudio={hasAudio}
          />
        );
      case "audio":
        // Show loading state if generating
        if (object.state === "generating") {
          return renderLoadingState(Music);
        }
        return (
          <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
            <Music className="w-12 h-12 text-purple-600 mb-2" />
            {object.content && (
              <audio src={object.content} controls className="w-full mt-2" />
            )}
          </div>
        );
      case "document":
        // Show loading state if generating
        if (object.state === "generating") {
          return renderLoadingState(FileText);
        }
        return (
          <div className="w-full h-full p-4 bg-white overflow-auto">
            <div className="prose prose-sm">
              <p className="text-gray-700">
                {object.content || "AI-generated document will appear here..."}
              </p>
            </div>
          </div>
        );

      // Canvas Natives
      case "text":
        return (
          <div
            className="w-full h-full p-2 flex items-start bg-transparent"
            onDoubleClick={(e) => {
              if (isSelected && onContentUpdate) {
                e.stopPropagation();
                setIsEditingText(true);
                // Focus after state updates
                setTimeout(() => {
                  if (textRef.current) {
                    textRef.current.focus();
                    // Select all text
                    const range = document.createRange();
                    range.selectNodeContents(textRef.current);
                    const sel = window.getSelection();
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                  }
                }, 0);
              }
            }}
            onMouseDown={(e) => {
              if (isEditingText) {
                e.stopPropagation();
                return;
              }
              if (!isSelected) return;
              e.stopPropagation();
            }}
          >
            <div
              ref={textRef}
              contentEditable={isEditingText}
              suppressContentEditableWarning
              onBlur={(e) => {
                if (isEditingText && onContentUpdate) {
                  const newContent = e.currentTarget.textContent || "";
                  onContentUpdate(object.id, newContent);
                  setIsEditingText(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  textRef.current?.blur();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  if (textRef.current) {
                    textRef.current.textContent = object.content;
                  }
                  setIsEditingText(false);
                }
              }}
              className={`text-lg break-words text-gray-900 outline-none ${
                isEditingText ? "cursor-text" : "cursor-move"
              }`}
              style={{
                minHeight: "1.5em",
                whiteSpace: "pre-wrap",
              }}
            >
              {object.content}
            </div>
          </div>
        );
      case "shape":
        const shapeObj = object as any;
        const shapeType = shapeObj.shapeType || "rectangle";

        if (shapeType === "circle") {
          return (
            <div className="w-full h-full flex items-center justify-center">
              <div
                className="rounded-full"
                style={{
                  backgroundColor: shapeObj.fillColor || "#ef4444",
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>
          );
        }

        // Rectangle (default)
        return (
          <div
            className="w-full h-full"
            style={{ backgroundColor: shapeObj.fillColor || "#3b82f6" }}
          />
        );
      case "doodle":
        return (
          <div className="w-full h-full bg-transparent">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <path
                d={(object as any).paths}
                fill="none"
                stroke={(object as any).strokeColor || "#000"}
                strokeWidth={(object as any).strokeWidth || 2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      case "sticky":
        const stickyObj = object as any;
        const noteColor = stickyObj.noteColor || "#fef08a";
        return (
          <div
            className="w-full h-full p-4 flex flex-col rounded-lg shadow-md"
            style={{ backgroundColor: noteColor }}
          >
            {stickyObj.noteTitle && (
              <h3 className="font-semibold text-gray-900 mb-1">
                {stickyObj.noteTitle}
              </h3>
            )}
            {stickyObj.noteAuthor && (
              <p className="text-xs text-gray-600 mb-3">
                {new Date(
                  object.metadata?.createdAt || Date.now()
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {stickyObj.noteAuthor}
              </p>
            )}
          </div>
        );
      case "link":
        const linkObj = object as any;
        // Extract domain from URL for display
        const getDomain = (url: string) => {
          try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace("www.", "");
          } catch {
            return url;
          }
        };

        return (
          <div
            className="w-full h-full bg-white rounded-lg overflow-hidden flex flex-col cursor-pointer"
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (linkObj.url) {
                window.open(linkObj.url, "_blank", "noopener,noreferrer");
              }
            }}
          >
            {/* Thumbnail image - iMessage style */}
            {linkObj.thumbnail && (
              <div
                className="w-full flex-shrink-0 bg-gray-100 overflow-hidden"
                style={{ height: "65%" }}
              >
                <img
                  src={linkObj.thumbnail}
                  alt={linkObj.title || "Link preview"}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            )}

            {/* Content section - iMessage style */}
            <div className="flex-1 p-3 flex flex-col justify-center bg-white">
              {/* Domain/URL - small gray text at top */}
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 truncate">
                {getDomain(linkObj.url)}
              </p>

              {/* Title - medium weight */}
              <h3 className="font-medium text-sm text-gray-900 mb-0.5 line-clamp-2 leading-tight">
                {linkObj.title || "Link"}
              </h3>

              {/* Description - lighter text */}
              {linkObj.description && (
                <p className="text-xs text-gray-600 line-clamp-2 leading-snug">
                  {linkObj.description}
                </p>
              )}
            </div>
          </div>
        );
      case "pdf":
        const pdfObj = object as any;
        return (
          <div className="w-full h-full p-4 bg-gray-100 flex flex-col items-center justify-center">
            <File className="w-16 h-16 text-red-600 mb-2" />
            <p className="text-sm font-medium text-gray-700">
              {pdfObj.fileName}
            </p>
            <p className="text-xs text-gray-500 mt-1">PDF Document</p>
          </div>
        );
      case "frame":
        const frameObj = object as any;
        const frameBorderWidth = viewportBorderWidth; // Match selection border width
        const autoLayout = frameObj.autoLayout || false;
        const padding = frameObj.padding || 10;
        const gap = frameObj.gap || 10;
        const layout = frameObj.layout || "hstack";

        // Get children if autolayout is enabled
        const children =
          autoLayout && objects
            ? objects.filter((obj) => obj.parentId === object.id)
            : [];

        // Calculate min dimensions for grid layout to prevent clipping
        let minWidth: number | undefined;
        let minHeight: number | undefined;

        if (autoLayout && layout === "grid" && children.length > 0) {
          // Find the widest and tallest child
          const maxChildWidth = Math.max(...children.map((c) => c.width));
          const maxChildHeight = Math.max(...children.map((c) => c.height));

          // Calculate min width: at least 1 item + padding
          minWidth = maxChildWidth + padding * 2;

          // Calculate min height: at least 1 item + padding
          minHeight = maxChildHeight + padding * 2;
        }

        return (
          <div
            style={{
              backgroundColor: frameObj.backgroundColor || "#f6f6f6",
              border:
                frameObj.isAgentCreating &&
                frameObj.backgroundColor === "transparent"
                  ? "none"
                  : "1px solid rgba(0, 0, 0, 0.1)",
              borderRadius: `${frameObj.borderRadius || 10}px`,
              boxSizing: "border-box",
              // During ANY resize operation, disable pointer events on ALL autolayout frame content
              ...(isResizing && {
                pointerEvents: "none" as const,
                cursor: "inherit", // Inherit cursor from body during resize
              }),
              // For autolayout, don't constrain size - let flexbox determine it
              ...(autoLayout
                ? {
                    display: "flex",
                    flexDirection: layout === "vstack" ? "column" : "row",
                    flexWrap: layout === "grid" ? "wrap" : "nowrap",
                    padding: `${padding}px`,
                    gap: `${gap}px`,
                    alignItems: "flex-start",
                    alignContent: "flex-start", // Pack wrapped rows tightly together
                    position: "relative",
                    minWidth: minWidth ? `${minWidth}px` : undefined,
                    minHeight: minHeight ? `${minHeight}px` : undefined,
                    width: `${object.width}px`,
                    // For grid layout, height should fit content
                    height: layout === "grid" ? "auto" : `${object.height}px`,
                  }
                : {
                    // Non-autolayout: fill parent and inset for selection bounds
                    width:
                      isSelected && !isPartOfMultiSelect
                        ? `calc(100% - ${frameBorderWidth * 2}px)`
                        : "100%",
                    height:
                      isSelected && !isPartOfMultiSelect
                        ? `calc(100% - ${frameBorderWidth * 2}px)`
                        : "100%",
                    margin:
                      isSelected && !isPartOfMultiSelect
                        ? `${frameBorderWidth}px`
                        : 0,
                    position: "relative",
                    overflow: "hidden", // Clip content that extends beyond frame boundaries
                  }),
            }}
          >
            {/* Render children inside frame when autolayout is enabled */}
            {autoLayout &&
              children.map((child) => (
                <CanvasObject
                  key={child.id}
                  object={child}
                  objects={objects}
                  isSelected={
                    selectedIds ? selectedIds.includes(child.id) : false
                  }
                  isPartOfMultiSelect={
                    isMultiSelect && selectedIds
                      ? selectedIds.includes(child.id)
                      : false
                  }
                  isHoveredBySelection={
                    hoveredBySelectionIds
                      ? hoveredBySelectionIds.includes(child.id)
                      : false
                  }
                  isSelecting={isSelecting}
                  isDraggingAny={isDraggingAny}
                  hasSelection={hasSelection}
                  zoomLevel={zoomLevel}
                  isActiveToolbar={activeToolbarId === child.id}
                  toolbarSystemActivated={toolbarSystemActivated}
                  isResizing={isResizing}
                  selectedIds={selectedIds}
                  hoveredBySelectionIds={hoveredBySelectionIds}
                  activeToolbarId={activeToolbarId}
                  isMultiSelect={isMultiSelect}
                  selectionColor={selectionColor}
                  hoverColor={hoverColor}
                  onSetActiveToolbar={onSetActiveToolbar}
                  onActivateToolbarSystem={onActivateToolbarSystem}
                  onObjectHoverEnter={onObjectHoverEnter}
                  onObjectHoverLeave={onObjectHoverLeave}
                  onSelect={onSelect}
                  onResizeStart={onResizeStart}
                  onDragStart={onDragStart}
                  onDrag={onDrag}
                  onDragEnd={onDragEnd}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onRotate={onRotate}
                  onColorTagChange={onColorTagChange}
                  onContentUpdate={onContentUpdate}
                />
              ))}
          </div>
        );
      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <p className="text-gray-500">
              Unknown type: {(object as any).type}
            </p>
          </div>
        );
    }
  };

  // Show toolbar if this object is the active toolbar (either selected or hovered)
  // But not during multi-select or dragging
  const showToolbarUI =
    isActiveToolbar && !hasMovedDuringDrag && !isPartOfMultiSelect;

  // Constant viewport sizes (inverse of zoom to maintain screen size)
  // Elements inside transform need /zoomLevel to compensate for scaling
  const viewportBorderWidth = 2 / zoomLevel; // Will appear as 2px on screen after transform
  const viewportHandleSize = 12 / zoomLevel; // Slightly larger handles for better UX
  const viewportHandleBorderWidth = 2 / zoomLevel; // Will appear as 2px on screen after transform
  const viewportColorTagSize = 16 / zoomLevel;
  const viewportBorderRadius = 5 / zoomLevel;
  // Dynamic selection gap based on object size: 2px (normal), 1px (small/tiny), 0.5px (micro)
  const selectionGapInScreenPx = getSelectionGap(
    object.width,
    object.height,
    zoomLevel
  );
  const viewportSelectionGap = selectionGapInScreenPx / zoomLevel;

  // Show all 4 corner handles using unified size classification
  // Tiny objects (< 60px) show only 1 handle, others show all 4
  const showAllHandles = shouldShowAllCornerHandles(
    object.width,
    object.height,
    zoomLevel
  );

  // Dynamic toolbar gap: closer when zoomed out (2-6px range)
  const toolbarGap = 2 + 4 * Math.min(1, zoomLevel);

  const getColorTagColor = () => {
    switch (object.colorTag) {
      case "red":
        return "#ef4444";
      case "yellow":
        return "#eab308";
      case "green":
        return "#22c55e";
      default:
        return null;
    }
  };

  const colorTagColor = getColorTagColor();

  // Check if this is an autolayout frame
  const isAutolayoutFrame =
    object.type === "frame" && (object as any).autoLayout;

  // Calculate clip path if this object is a child of a non-autolayout frame
  let clipPath: string | undefined;
  if (object.parentId && objects) {
    const parent = objects.find((o) => o.id === object.parentId);
    if (parent && parent.type === "frame" && !(parent as any).autoLayout) {
      // Calculate the visible area relative to this object's position
      const clipLeft = Math.max(0, parent.x - object.x);
      const clipTop = Math.max(0, parent.y - object.y);
      const clipRight = Math.min(
        object.width,
        parent.x + parent.width - object.x
      );
      const clipBottom = Math.min(
        object.height,
        parent.y + parent.height - object.y
      );

      // Only apply clip if object extends beyond parent bounds
      if (
        clipLeft > 0 ||
        clipTop > 0 ||
        clipRight < object.width ||
        clipBottom < object.height
      ) {
        clipPath = `inset(${clipTop}px ${object.width - clipRight}px ${
          object.height - clipBottom
        }px ${clipLeft}px)`;
      }
    }
  }

  // Check if this object is a child of an autolayout frame
  const isChildOfAutolayoutFrame =
    object.parentId && objects
      ? (() => {
          const parent = objects.find((o) => o.id === object.parentId);
          return (
            parent && parent.type === "frame" && (parent as any).autoLayout
          );
        })()
      : false;

  return (
    <motion.div
      data-canvas-object
      style={{
        // Children of autolayout frames use relative positioning (flexbox handles layout)
        // All other objects use absolute positioning on canvas
        position: isChildOfAutolayoutFrame ? "relative" : "absolute",
        ...(!isChildOfAutolayoutFrame && {
          left: object.x,
          top: object.y,
        }),
        // Children of autolayout frames should not shrink
        ...(isChildOfAutolayoutFrame && {
          flexShrink: 0,
        }),
        // For autolayout frames: constrain width but let height grow with content
        // For other objects: use fixed dimensions
        ...(isAutolayoutFrame
          ? {
              width: `${object.width}px`,
              height: "fit-content",
            }
          : {
              width: `${object.width}px`,
              height: `${object.height}px`,
            }),
        // Clip this object if it's a child of a non-autolayout frame
        clipPath: clipPath,
        zIndex: object.type === "frame" ? 100 : 200, // Frames below other objects, which are below selection bounds
        // NUCLEAR OPTION: During ANY resize, disable pointer events on ALL objects
        // The only things that should work during resize are:
        // 1. Canvas itself (for mouse move events)
        // 2. Resize handles (they have pointerEvents: "auto")
        ...(isResizing && {
          pointerEvents: "none" as const,
        }),
      }}
      className={`group ${
        // During resize, don't apply any cursor class so global body cursor shows through
        isResizing && object.parentId
          ? ""
          : isChildOfAutolayoutFrame
          ? "cursor-default"
          : "cursor-move"
      }`}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseEnter={
        isResizing && object.parentId ? undefined : handleMouseEnter
      }
      onMouseLeave={
        isResizing && object.parentId ? undefined : handleMouseLeave
      }
    >
      {/* Selection border - only show for single selection */}
      {isSelected && !isPartOfMultiSelect && (
        <div
          className="absolute pointer-events-none"
          style={{
            // Position at object bounds
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            // Use outline instead of border so it renders outside the box
            outline: `${viewportBorderWidth}px solid ${selectionColor}`,
            outlineOffset: viewportSelectionGap, // Dynamic gap based on object size
            borderRadius: viewportBorderRadius,
            zIndex: 10, // Above content to be visible
          }}
        >
          {/* Corner handles - progressive visibility based on screen size */}
          {onResizeStart && (
            <>
              {/* Top-left - only show when object is large enough on screen */}
              {showAllHandles && (
                <motion.div
                  className="absolute bg-white cursor-nwse-resize hover:bg-gray-50"
                  initial={false}
                  animate={{
                    borderRadius: isShiftPressed ? "20%" : "50%", // Round by default, square when Shift
                  }}
                  transition={{
                    duration: 0.15,
                    ease: "easeInOut",
                  }}
                  style={{
                    top: -(viewportHandleSize / 2 + viewportSelectionGap),
                    left: -(viewportHandleSize / 2 + viewportSelectionGap),
                    width: viewportHandleSize,
                    height: viewportHandleSize,
                    borderWidth: viewportHandleBorderWidth,
                    borderColor: selectionColor,
                    borderStyle: "solid",
                    pointerEvents: "auto",
                    boxSizing: "border-box",
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onResizeStart("top-left", e);
                  }}
                />
              )}
              {/* Top-right - ALWAYS show (even at small zoom), but hide if color tag exists */}
              {!colorTagColor && (
                <motion.div
                  className="absolute bg-white cursor-nesw-resize hover:bg-gray-50"
                  initial={false}
                  animate={{
                    borderRadius: isShiftPressed ? "20%" : "50%", // Round by default, square when Shift
                  }}
                  transition={{
                    duration: 0.15,
                    ease: "easeInOut",
                  }}
                  style={{
                    top: -(viewportHandleSize / 2 + viewportSelectionGap),
                    right: -(viewportHandleSize / 2 + viewportSelectionGap),
                    width: viewportHandleSize,
                    height: viewportHandleSize,
                    borderWidth: viewportHandleBorderWidth,
                    borderColor: selectionColor,
                    borderStyle: "solid",
                    pointerEvents: "auto",
                    boxSizing: "border-box",
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onResizeStart("top-right", e);
                  }}
                />
              )}
              {/* Bottom-left - only show when object is large enough on screen */}
              {showAllHandles && (
                <motion.div
                  className="absolute bg-white cursor-nesw-resize hover:bg-gray-50"
                  initial={false}
                  animate={{
                    borderRadius: isShiftPressed ? "20%" : "50%", // Round by default, square when Shift
                  }}
                  transition={{
                    duration: 0.15,
                    ease: "easeInOut",
                  }}
                  style={{
                    bottom: -(viewportHandleSize / 2 + viewportSelectionGap),
                    left: -(viewportHandleSize / 2 + viewportSelectionGap),
                    width: viewportHandleSize,
                    height: viewportHandleSize,
                    borderWidth: viewportHandleBorderWidth,
                    borderColor: selectionColor,
                    borderStyle: "solid",
                    pointerEvents: "auto",
                    boxSizing: "border-box",
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onResizeStart("bottom-left", e);
                  }}
                />
              )}
              {/* Bottom-right - only show when object is large enough on screen */}
              {showAllHandles && (
                <motion.div
                  className="absolute bg-white cursor-nwse-resize hover:bg-gray-50"
                  initial={false}
                  animate={{
                    borderRadius: isShiftPressed ? "20%" : "50%", // Round by default, square when Shift
                  }}
                  transition={{
                    duration: 0.15,
                    ease: "easeInOut",
                  }}
                  style={{
                    bottom: -(viewportHandleSize / 2 + viewportSelectionGap),
                    right: -(viewportHandleSize / 2 + viewportSelectionGap),
                    width: viewportHandleSize,
                    height: viewportHandleSize,
                    borderWidth: viewportHandleBorderWidth,
                    borderColor: selectionColor,
                    borderStyle: "solid",
                    pointerEvents: "auto",
                    boxSizing: "border-box",
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onResizeStart("bottom-right", e);
                  }}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Hover border - hide during drag but not during resize */}
      {(isHovered || isHoveredBySelection) &&
        !isSelected &&
        !isDraggingAny &&
        !isResizing && (
          <div
            className="absolute pointer-events-none"
            style={{
              // Position at object bounds
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              // Use outline instead of border so it renders outside the box
              outline: `${viewportBorderWidth}px solid ${hoverColor}`,
              outlineOffset: 0,
              borderRadius: viewportBorderRadius,
              zIndex: 10, // Above content to be visible
            }}
          />
        )}

      {/* Content */}
      <div
        className={`relative w-full h-full ${
          // Don't clip overflow for frames (especially during autolayout)
          object.type !== "frame" ? "overflow-hidden" : ""
        } ${
          // Only apply white background to certain types
          ["document"].includes(object.type) ? "bg-white" : ""
        }`}
        style={{
          borderRadius: viewportBorderRadius,
          zIndex: 1, // Below borders but still positioned
          // Disable pointer events on content during resize for ALL children
          ...(isResizing &&
            object.parentId && {
              pointerEvents: "none" as const,
            }),
        }}
      >
        {renderContent()}
      </div>

      {/* Color tag dot - shown when tag is set, always visible except when THIS object is being dragged */}
      {/* Now positioned at top-right and functions as a resize handle */}
      {colorTagColor && !(isDraggingAny && isSelected) && onResizeStart && (
        <motion.div
          className="absolute cursor-nesw-resize hover:scale-110 transition-transform duration-100"
          initial={false}
          animate={{
            borderRadius: isShiftPressed ? "20%" : "50%", // Round by default, square when Shift pressed
          }}
          transition={{
            duration: 0.15,
            ease: "easeInOut",
          }}
          style={{
            // Position to match the center of where the top-right corner handle would be
            top: -(viewportColorTagSize / 2 + viewportSelectionGap),
            right: -(viewportColorTagSize / 2 + viewportSelectionGap),
            width: viewportColorTagSize,
            height: viewportColorTagSize,
            backgroundColor: colorTagColor,
            border: `${2 / zoomLevel}px solid white`,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
            zIndex: 300, // Above everything else
            pointerEvents: "auto",
            boxSizing: "border-box",
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onResizeStart("top-right", e); // Function as resize handle
          }}
        />
      )}

      {/* Metadata header - shown when selected (but not for frames or objects inside frames) */}
      {/* Metadata header - TYPE (left side) shown above object */}
      {isSelected &&
        !isPartOfMultiSelect &&
        !isDraggingAny &&
        object.type !== "frame" &&
        object.state !== "generating" &&
        !object.parentId &&
        shouldShowMetadata(object.type) &&
        shouldShowObjectMetadata(object.width, object.height, zoomLevel) && (
          <div
            style={{
              position: "absolute",
              left: 0,
              // Adaptive gap: closer at small zoom (same as right side)
              top: -(
                (2 + 6 * Math.min(1, zoomLevel)) / zoomLevel +
                12 / zoomLevel
              ),
              pointerEvents: "auto",
              zIndex: 1000,
              fontSize: `${12 / zoomLevel}px`,
              paddingLeft: `${4 / zoomLevel}px`,
            }}
            className="text-muted-foreground cursor-move"
            onMouseDown={handleMouseDown}
          >
            <span
              className="capitalize"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
                maxWidth: `${object.width - 8 / zoomLevel}px`,
                display: "inline-block",
              }}
            >
              {object.type === "sticky" ? "Note" : object.type}
            </span>
          </div>
        )}

      {/* Metadata header - CREATOR/DIMENSIONS (right side) also shown above object */}
      {isSelected &&
        !isPartOfMultiSelect &&
        !isDraggingAny &&
        object.type !== "frame" &&
        object.state !== "generating" &&
        !object.parentId &&
        zoomLevel > 0.3 &&
        shouldShowMetadata(object.type) &&
        shouldShowObjectMetadata(object.width, object.height, zoomLevel) && (
          <div
            style={{
              position: "absolute",
              right: 0,
              // Adaptive gap: closer at small zoom for better visual proximity
              // Added 1px extra spacing (changed from 2 to 3)
              top: -(
                (3 + 6 * Math.min(1, zoomLevel)) / zoomLevel +
                12 / zoomLevel
              ),
              pointerEvents: "auto",
              zIndex: 1000,
              fontSize: `${12 / zoomLevel}px`,
              paddingRight: `${4 / zoomLevel}px`,
            }}
            className="text-muted-foreground cursor-move"
            onMouseDown={handleMouseDown}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "right",
              }}
            >
              {object.metadata?.createdBy
                ? (() => {
                    const { type, name } = object.metadata.createdBy;
                    if (type === "model") {
                      return name || "AI";
                    } else if (type === "uploaded") {
                      return "Uploaded";
                    } else if (type === "user" && name) {
                      return `@${name}`;
                    }
                    return null;
                  })()
                : `${Math.round(object.width)} × ${Math.round(object.height)}`}
            </span>
          </div>
        )}

      {/* Generating state header - TYPE (left side) shown above object */}
      {object.state === "generating" &&
        object.type !== "frame" &&
        !object.parentId &&
        shouldShowMetadata(object.type) &&
        shouldShowObjectMetadata(object.width, object.height, zoomLevel) && (
          <div
            style={{
              position: "absolute",
              left: 0,
              // Adaptive gap: closer at small zoom
              top: -(
                (2 + 6 * Math.min(1, zoomLevel)) / zoomLevel +
                12 / zoomLevel
              ),
              pointerEvents: "auto",
              zIndex: 1000,
              fontSize: `${12 / zoomLevel}px`,
              paddingLeft: `${4 / zoomLevel}px`,
            }}
            className="text-muted-foreground cursor-move"
            onMouseDown={handleMouseDown}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
                maxWidth: `${object.width - 8 / zoomLevel}px`,
                display: "inline-block",
              }}
            >
              Generating
            </span>
          </div>
        )}

      {/* Generating state header - CREATOR (right side) also shown above object */}
      {object.state === "generating" &&
        object.type !== "frame" &&
        !object.parentId &&
        zoomLevel > 0.3 &&
        shouldShowMetadata(object.type) &&
        shouldShowObjectMetadata(object.width, object.height, zoomLevel) && (
          <div
            style={{
              position: "absolute",
              right: 0,
              // Adaptive gap: closer at small zoom
              top: -(
                (2 + 6 * Math.min(1, zoomLevel)) / zoomLevel +
                12 / zoomLevel
              ),
              pointerEvents: "auto",
              zIndex: 1000,
              fontSize: `${12 / zoomLevel}px`,
              paddingRight: `${4 / zoomLevel}px`,
            }}
            className="text-muted-foreground cursor-move"
            onMouseDown={handleMouseDown}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "right",
              }}
            >
              {object.metadata?.createdBy?.name || "AI"}
            </span>
          </div>
        )}

      {/* Frame label - always shown for frames */}
      {object.type === "frame" &&
        (() => {
          const frameObj = object as any;
          const isAgentFrame = frameObj.createdBy === "agent";
          const isAgentCreating = frameObj.isAgentCreating || false;

          // Use agent frame header if it's an agent frame
          if (isAgentFrame) {
            return (
              <AgentFrameHeader
                isCreating={isAgentCreating}
                frameName={object.name}
                zoomLevel={zoomLevel}
                frameWidth={object.width}
                onMouseDown={handleMouseDown}
              />
            );
          }

          // Regular frame label
          return (
            <div
              className="absolute text-xs font-normal cursor-move"
              style={{
                top: -20 / zoomLevel,
                left: 4 / zoomLevel,
                fontSize: `${12 / zoomLevel}px`,
                color: "rgba(0, 0, 0, 0.7)",
                lineHeight: `${16 / zoomLevel}px`,
                fontFamily: "Graphik, sans-serif",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: `${object.width - 8 / zoomLevel}px`,
                zIndex: 50,
                pointerEvents: "auto",
              }}
              onMouseDown={handleMouseDown}
            >
              {isAutolayoutFrame ? "Autolayout Frame" : "Frame"}
            </div>
          );
        })()}

      {/* Toolbar is now rendered at App level */}
    </motion.div>
  );
}
