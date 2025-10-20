/**
 * Unified Toolbar Wrapper
 * Handles toolbar and tab positioning for single objects, multi-select, and frames
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CornerDownLeft, ArrowUp } from "lucide-react";
import { ContextToolbar } from "../ContextToolbar";
import { CanvasObject as CanvasObjectType } from "../../types";
import {
  getToolbarGap,
  getAdaptiveToolbarGap,
  getMetadataHeaderHeight,
  shouldShowObjectMetadata,
  shouldUseCompactToolbar,
  shouldShowToolbarUI,
  getSelectionGap,
} from "../../utils/canvasUtils";
import {
  shouldShowToolbar,
  shouldShowMetadata,
} from "../../config/behaviorConfig";

type ToolbarMode = "single" | "multi" | "frame";

interface UnifiedToolbarWrapperProps {
  mode: ToolbarMode;
  // For single/frame mode
  object?: CanvasObjectType;
  objects?: CanvasObjectType[]; // Needed for autolayout calculations
  // For multi mode
  bounds?: { minX: number; minY: number; maxX: number; maxY: number };
  selectedObjectTypes?: string[];
  // Common props
  zoomLevel: number;
  panOffset: { x: number; y: number };
  isMultiSelect: boolean;
  isDragging: boolean;
  isResizing: boolean;
  // Toolbar callbacks
  onToolbarHoverEnter?: () => void;
  onToolbarHoverLeave?: () => void;
  onZoomToFit?: (id: string) => void;
  onColorTagChange?: (id: string) => void;
  onLabelBgColorChange?: (id: string) => void;
  onAIPrompt?: (id: string, prompt: string) => void;
  onConvertToVideo?: (id: string) => void;
  onRerun?: (id: string) => void;
  onReframe?: (id: string) => void;
  onUnframe?: (id: string) => void;
  onToggleAutolayout?: (id: string) => void;
  onMore?: (id: string) => void;
  onDownload?: (id: string) => void;
  // Multi-select specific
  onMultiColorTagChange?: () => void;
  onMultiLabelBgColorChange?: () => void;
  onMultiAIPrompt?: (prompt: string) => void;
  onFrameSelection?: () => void;
  onFrameSelectionWithAutolayout?: () => void;
  multiColorTag?: string;
}

// Helper to calculate actual rendered dimensions for autolayout frames
function getActualDimensions(
  obj: CanvasObjectType,
  allObjects: CanvasObjectType[]
): { width: number; height: number } {
  if (obj.type !== "frame" || !(obj as any).autoLayout) {
    return { width: obj.width, height: obj.height };
  }

  const frameObj = obj as any;
  const padding = frameObj.padding || 10;
  const gap = frameObj.gap || 10;
  const layout = frameObj.layout || "hstack";
  const children = allObjects.filter((o) => o.parentId === obj.id);

  if (children.length === 0) {
    return { width: padding * 2, height: padding * 2 };
  }

  if (layout === "hstack") {
    const totalWidth =
      children.reduce((sum, child) => sum + child.width, 0) +
      gap * (children.length - 1) +
      padding * 2;
    const maxHeight =
      Math.max(...children.map((child) => child.height)) + padding * 2;
    return { width: totalWidth, height: maxHeight };
  } else if (layout === "vstack") {
    const maxWidth =
      Math.max(...children.map((child) => child.width)) + padding * 2;
    const totalHeight =
      children.reduce((sum, child) => sum + child.height, 0) +
      gap * (children.length - 1) +
      padding * 2;
    return { width: maxWidth, height: totalHeight };
  } else {
    // grid
    const frameWidth = obj.width;
    const borderWidth = 2;
    const availableWidth = frameWidth - padding * 2 - borderWidth;

    let currentRowWidth = 0;
    let currentRowHeight = 0;
    let totalHeight = 0;
    let rowCount = 0;

    children.forEach((child, index) => {
      const childWidth = child.width;
      const childHeight = child.height;

      const widthNeeded =
        currentRowWidth === 0 ? childWidth : currentRowWidth + gap + childWidth;

      if (widthNeeded > availableWidth && currentRowWidth > 0) {
        if (rowCount > 0) totalHeight += gap;
        totalHeight += currentRowHeight;
        rowCount++;

        currentRowWidth = childWidth;
        currentRowHeight = childHeight;
      } else {
        currentRowWidth = widthNeeded;
        currentRowHeight = Math.max(currentRowHeight, childHeight);
      }

      if (index === children.length - 1 && currentRowHeight > 0) {
        if (rowCount > 0) totalHeight += gap;
        totalHeight += currentRowHeight;
        rowCount++;
      }
    });

    const calculatedHeight = totalHeight + padding * 2 + borderWidth;
    return { width: frameWidth, height: calculatedHeight };
  }
}

export function UnifiedToolbarWrapper({
  mode,
  object,
  objects = [],
  bounds,
  selectedObjectTypes = [],
  zoomLevel,
  panOffset,
  isMultiSelect,
  isDragging,
  isResizing,
  onToolbarHoverEnter,
  onToolbarHoverLeave,
  onZoomToFit,
  onColorTagChange,
  onLabelBgColorChange,
  onAIPrompt,
  onConvertToVideo,
  onRerun,
  onReframe,
  onUnframe,
  onToggleAutolayout,
  onMore,
  onDownload,
  onMultiColorTagChange,
  onMultiLabelBgColorChange,
  onMultiAIPrompt,
  onFrameSelection,
  onFrameSelectionWithAutolayout,
  multiColorTag,
}: UnifiedToolbarWrapperProps) {
  const [isPromptMode, setIsPromptMode] = useState(false);
  const [promptText, setPromptText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Handle Enter key to activate prompt mode
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isPromptMode) {
        e.preventDefault();
        setIsPromptMode(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isPromptMode]);

  // Focus input when entering prompt mode
  useEffect(() => {
    if (isPromptMode && inputRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      });
    }
  }, [isPromptMode]);

  // Handle ESC key globally when typing bar is open
  useEffect(() => {
    if (!isPromptMode) return;

    const handleGlobalEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setIsPromptMode(false);
        setPromptText("");
      }
    };

    // Add listeners in BOTH capture and bubble phases to ensure we catch ESC
    // before the keyboard shortcuts handler (which runs in bubble phase)
    window.addEventListener("keydown", handleGlobalEscape, true); // Capture phase
    window.addEventListener("keydown", handleGlobalEscape, false); // Bubble phase

    return () => {
      window.removeEventListener("keydown", handleGlobalEscape, true);
      window.removeEventListener("keydown", handleGlobalEscape, false);
    };
  }, [isPromptMode]);

  // Handle click outside to close prompt mode
  useEffect(() => {
    if (!isPromptMode) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // Check if click is outside the input container
      // Don't check buttonContainerRef because it won't be in DOM when isPromptMode is true
      if (
        inputContainerRef.current &&
        !inputContainerRef.current.contains(target)
      ) {
        // Reset to previous state
        setIsPromptMode(false);
        setPromptText("");
      }
    };

    // Use a small delay to prevent the opening click from immediately closing
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside, true);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [isPromptMode]);

  const handlePromptSubmit = () => {
    if (!promptText.trim()) return;

    if (mode === "multi" && onMultiAIPrompt) {
      onMultiAIPrompt(promptText);
    } else if (mode === "single" && object && onAIPrompt) {
      onAIPrompt(object.id, promptText);
    }

    setPromptText("");
    setIsPromptMode(false);
  };

  const handlePromptKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handlePromptSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation(); // Prevent global Escape handler from interfering
      setIsPromptMode(false);
      setPromptText("");
    }
  };

  // Early returns for invalid states
  if (mode === "single" && !object) return null;
  if (mode === "single" && isMultiSelect) return null; // Don't show single toolbar in multi-select mode
  if (mode === "single" && object && !shouldShowToolbar(object.type as any))
    return null; // Check if this object type should show toolbar
  if (mode === "multi" && !bounds) return null;
  if (mode === "multi" && !isMultiSelect) return null; // Don't show multi toolbar in single-select mode
  if (isDragging || isResizing) return null;
  if (mode === "single" && object?.state === "generating") return null;
  // Don't show toolbar during agent frame creation
  if (mode === "single" && object?.type === "frame") {
    const frameObj = object as any;
    if (frameObj.isAgentCreating) return null;
  }

  // Calculate dimensions and positions based on mode
  let objectTypes: string[];
  let colorTag: string | undefined;
  let labelBgColor: string | undefined;
  let toolbarLeftScreen: number, toolbarTopScreen: number;
  let tabButtonLeftScreen: number, tabButtonTopScreen: number;
  let heightInScreenPx: number, widthInScreenPx: number;
  let shouldShowToolbarBasedOnSize = true; // Track if toolbar should be shown at all (micro state hides it)

  if (mode === "multi" && bounds) {
    // Multi-select mode: bounds are in canvas coordinates, need conversion
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const centerX = (bounds.minX + bounds.maxX) / 2;

    objectTypes = selectedObjectTypes;
    colorTag = multiColorTag;
    // For multi-select, labelBgColor is not applicable (we'll pass the callback though)
    labelBgColor = undefined;

    // Use consistent gap with single objects (no metadata)
    const toolbarGap = getToolbarGap(zoomLevel);
    const bottomButtonGap = getToolbarGap(zoomLevel);

    // Account for selection gap to position toolbar above the selection border
    const selectionGap = getSelectionGap(width, height, zoomLevel);

    // Convert to screen coordinates and position toolbar
    const centerXScreen = centerX * zoomLevel + panOffset.x;
    const boundsMinYScreen = bounds.minY * zoomLevel + panOffset.y;
    const boundsMaxYScreen = bounds.maxY * zoomLevel + panOffset.y;

    // Position toolbar ABOVE, centered horizontally (account for selection gap)
    toolbarLeftScreen = centerXScreen;
    toolbarTopScreen = boundsMinYScreen - selectionGap - toolbarGap * zoomLevel;

    // Position Enter button BELOW, centered horizontally (account for selection gap)
    tabButtonLeftScreen = centerXScreen;
    tabButtonTopScreen =
      boundsMaxYScreen + selectionGap + bottomButtonGap * zoomLevel;

    // Dimensions for compact mode check (convert to screen space)
    heightInScreenPx = height * zoomLevel;
    widthInScreenPx = width * zoomLevel;

    // Check if toolbar should be shown at all (micro state hides it)
    shouldShowToolbarBasedOnSize =
      heightInScreenPx > 10 || widthInScreenPx > 10;
  } else if (mode === "single" && object) {
    // Single/frame mode: object coordinates are in canvas space, need conversion
    const actualDims = getActualDimensions(object, objects);
    const width = actualDims.width;
    const height = actualDims.height;
    const centerX = object.x + width / 2;

    objectTypes = [object.type];
    colorTag = object.colorTag || "none";
    labelBgColor = object.labelBgColor || "none";

    // Check if metadata header should be shown using generalized size system
    const shouldShowMetadataHeader =
      !isMultiSelect &&
      !isDragging &&
      object.type !== "frame" &&
      object.state !== "generating" &&
      !object.parentId &&
      shouldShowMetadata(object.type as any) &&
      shouldShowObjectMetadata(width, height, zoomLevel);

    // Check if frame header should be shown
    const hasFrameHeader = object.type === "frame";

    // Calculate gap based on whether metadata is shown
    let toolbarGapFromObject: number;
    let metadataOffset = 0;

    if (shouldShowMetadataHeader) {
      // Metadata is shown: use adaptive gap + metadata offset
      // This pushes toolbar up to give heading room
      toolbarGapFromObject = getAdaptiveToolbarGap(width, height, zoomLevel);
      metadataOffset = getMetadataHeaderHeight(zoomLevel);
    } else if (hasFrameHeader) {
      // Frame header is shown: use adaptive gap + frame header offset
      toolbarGapFromObject = getAdaptiveToolbarGap(width, height, zoomLevel);
      metadataOffset = 20 / zoomLevel;
    } else {
      // No metadata: use same distance as Type button (close to object)
      toolbarGapFromObject = getToolbarGap(zoomLevel);
      metadataOffset = 0;
    }

    // Position toolbar ABOVE, centered horizontally (convert canvas to screen)
    // Gap changes based on metadata visibility for smooth behavior
    // Account for selection gap to position toolbar above the selection border
    const selectionGap = getSelectionGap(width, height, zoomLevel) / zoomLevel; // Convert to canvas pixels
    const toolbarLeftCanvas = centerX;
    const toolbarTopCanvas =
      object.y - selectionGap - toolbarGapFromObject - metadataOffset;
    toolbarLeftScreen = toolbarLeftCanvas * zoomLevel + panOffset.x;
    toolbarTopScreen = toolbarTopCanvas * zoomLevel + panOffset.y;

    // Position Enter button BELOW, centered horizontally (convert canvas to screen)
    // Use standard gap for bottom button + account for selection gap
    const bottomButtonGap = getToolbarGap(zoomLevel);
    const tabButtonLeftCanvas = centerX;
    const tabButtonTopCanvas =
      object.y + height + selectionGap + bottomButtonGap;
    tabButtonLeftScreen = tabButtonLeftCanvas * zoomLevel + panOffset.x;
    tabButtonTopScreen = tabButtonTopCanvas * zoomLevel + panOffset.y;

    // Dimensions for compact mode check (convert to screen space)
    heightInScreenPx = height * zoomLevel;
    widthInScreenPx = width * zoomLevel;

    // Check if toolbar should be shown at all using unified classification
    shouldShowToolbarBasedOnSize = shouldShowToolbarUI(
      width,
      height,
      zoomLevel
    );
  } else {
    return null;
  }

  // Early return if object is too small (micro state)
  if (!shouldShowToolbarBasedOnSize) return null;

  // Determine compact mode using unified size classification
  // Multi-select: never show compact mode
  const shouldShowCompact =
    mode === "multi"
      ? false
      : object
      ? shouldUseCompactToolbar(
          widthInScreenPx / zoomLevel,
          heightInScreenPx / zoomLevel,
          zoomLevel
        )
      : false;

  // Toolbar scale should always be 1 (no zoom scaling) for both single and multi-select
  const toolbarScale = 1;

  return (
    <>
      {/* Main toolbar - positioned ABOVE the object */}
      <AnimatePresence>
        {!isPromptMode && (
          <motion.div
            key="toolbar"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.08, ease: "easeOut" },
            }}
            style={{
              position: "absolute",
              left: toolbarLeftScreen,
              top: toolbarTopScreen,
              pointerEvents: "none",
              zIndex: 10000,
            }}
            onMouseEnter={onToolbarHoverEnter}
            onMouseLeave={onToolbarHoverLeave}
          >
            <div
              ref={toolbarRef}
              style={{
                pointerEvents: "auto",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                transform: `translate(-50%, -100%) scale(${toolbarScale})`,
              }}
            >
              <ContextToolbar
                objectTypes={objectTypes as any}
                isMultiSelect={mode === "multi"}
                objectWidth={widthInScreenPx}
                activeObject={mode === "single" ? object : undefined}
                onZoomToFit={
                  mode === "single" && object
                    ? () => onZoomToFit?.(object.id)
                    : undefined
                }
                colorTag={colorTag as any}
                // onColorTagChange={
                //   mode === "multi"
                //     ? onMultiColorTagChange
                //     : mode === "single" && object
                //     ? () => onColorTagChange?.(object.id)
                //     : undefined
                // } // COMMENTED OUT: Now using labelBgColor
                labelBgColor={labelBgColor as any}
                onLabelBgColorChange={
                  mode === "multi"
                    ? onMultiLabelBgColorChange
                    : mode === "single" && object
                    ? () => onLabelBgColorChange?.(object.id)
                    : undefined
                }
                onAIPrompt={
                  mode === "single" && object
                    ? (prompt) => onAIPrompt?.(object.id, prompt)
                    : undefined
                }
                onConvertToVideo={
                  mode === "single" && object
                    ? () => onConvertToVideo?.(object.id)
                    : undefined
                }
                onRerun={
                  mode === "single" && object && object.type !== "frame"
                    ? () => onRerun?.(object.id)
                    : undefined
                }
                onReframe={
                  mode === "multi"
                    ? onFrameSelection
                    : mode === "single" && object
                    ? () =>
                        object.type === "frame"
                          ? onUnframe?.(object.id)
                          : onReframe?.(object.id)
                    : undefined
                }
                onToggleAutolayout={
                  mode === "single" && object && object.type === "frame"
                    ? () => onToggleAutolayout?.(object.id)
                    : undefined
                }
                onFrameWithAutolayout={
                  mode === "multi" ? onFrameSelectionWithAutolayout : undefined
                }
                onMore={
                  mode === "single" && object
                    ? () => onMore?.(object.id)
                    : undefined
                }
                onDownload={
                  mode === "single" && object
                    ? () => onDownload?.(object.id)
                    : undefined
                }
                hideTabButton={true}
                isVertical={false}
                forceCompact={shouldShowCompact}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enter button / Input field - positioned BELOW the object */}
      <motion.div
        key="enter-button-container"
        style={{
          position: "absolute",
          left: tabButtonLeftScreen,
          top: tabButtonTopScreen,
          transform: `translateX(-50%) scale(${toolbarScale})`,
          pointerEvents: "none",
          zIndex: 10000,
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <AnimatePresence mode="wait">
            {!isPromptMode ? (
              // Enter button - "Type..." with icon, or just icon when compact
              shouldShowCompact ? (
                // Compact mode: just icon in circle (smaller 20px height to match toolbar)
                <motion.button
                  key="type-button-compact"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsPromptMode(true);
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ opacity: { duration: 0.08 } }}
                  className="backdrop-blur-[12px] bg-[#f6f6f6] rounded-full shadow-sm border border-black/[0.1] hover:bg-[#ebebeb] transition-colors w-5 h-5 flex items-center justify-center"
                  style={{
                    fontFamily: "Graphik, sans-serif",
                    cursor: "pointer",
                  }}
                >
                  <CornerDownLeft
                    className="w-3 h-3"
                    strokeWidth={2}
                    style={{
                      color: "rgba(0, 0, 0, 0.6)",
                    }}
                  />
                </motion.button>
              ) : (
                // Full mode: text only (no icon)
                <motion.button
                  key="type-button-full"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsPromptMode(true);
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ opacity: { duration: 0.08 } }}
                  className="backdrop-blur-[12px] bg-[#f6f6f6] rounded-full shadow-sm border border-black/[0.1] hover:bg-[#ebebeb] transition-colors px-4 h-10 flex items-center justify-center"
                  style={{
                    fontFamily: "Graphik, sans-serif",
                    cursor: "pointer",
                  }}
                >
                  <span
                    className="text-[13px] leading-[13px] font-medium whitespace-nowrap"
                    style={{
                      color: "rgba(0, 0, 0, 0.7)",
                    }}
                  >
                    Type...
                  </span>
                </motion.button>
              )
            ) : (
              // Expanded input field with scale animation
              <motion.div
                key="prompt-input"
                ref={inputContainerRef}
                initial={{
                  scale: 0.3,
                  opacity: 0,
                }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{
                  scale: 0.3,
                  opacity: 0,
                }}
                transition={{
                  scale: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
                  opacity: { duration: 0.12 },
                }}
                className="backdrop-blur-[12px] bg-[#f6f6f6] rounded-full shadow-sm border border-black/[0.1] flex items-center gap-2 h-10"
                style={{
                  fontFamily: "Graphik, sans-serif",
                  width: "240px",
                  paddingLeft: "16px",
                  paddingRight: "8px",
                  paddingTop: "8px",
                  paddingBottom: "8px",
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  onKeyDown={handlePromptKeyDown}
                  placeholder="Type to direct next move..."
                  className="flex-1 bg-transparent border-none outline-none text-[15px]"
                  style={{
                    color: "rgba(0, 0, 0, 0.9)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePromptSubmit();
                  }}
                  disabled={!promptText.trim()}
                  className="flex items-center justify-center rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors w-7 h-7 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="w-4 h-4" strokeWidth={2} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
