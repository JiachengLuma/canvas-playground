import {
  Circle,
  Video,
  RotateCcw,
  Maximize2,
  MoreHorizontal,
  Download,
  Square,
  LayoutGrid,
  Ungroup,
} from "lucide-react";
import { motion } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { ObjectType, ColorTag, CanvasObject } from "../types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface ContextToolbarProps {
  objectTypes: ObjectType[];
  isMultiSelect: boolean;
  objectWidth?: number; // Object width in screen pixels
  activeObject?: CanvasObject;
  onZoomToFit?: () => void; // Callback to zoom artifact to fit toolbar
  colorTag?: ColorTag;
  onColorTagChange?: () => void;
  onAIPrompt?: (prompt: string) => void;
  onConvertToVideo?: () => void;
  onRerun?: () => void;
  onReframe?: () => void; // For frame, this becomes unframe
  onToggleAutolayout?: () => void;
  onFrameWithAutolayout?: () => void; // For multi-select, create frame with autolayout
  onMore?: () => void;
  onDownload?: () => void;
  hideTabButton?: boolean; // Hide the Tab button from the main toolbar
  isVertical?: boolean; // Whether to display toolbar vertically
  forceCompact?: boolean; // Force compact mode based on zoom level
}

export function ContextToolbar({
  objectTypes,
  isMultiSelect,
  objectWidth,
  activeObject,
  onZoomToFit,
  colorTag = "none",
  onColorTagChange,
  onAIPrompt,
  onConvertToVideo,
  onRerun,
  onReframe,
  onToggleAutolayout,
  onFrameWithAutolayout,
  onMore,
  onDownload,
  hideTabButton = false,
  isVertical = false,
  forceCompact = false,
}: ContextToolbarProps) {
  const [isPromptMode, setIsPromptMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const wasCompactBeforePrompt = useRef(false);

  const getColorTagColor = () => {
    switch (colorTag) {
      case "green":
        return "#22c55e";
      case "yellow":
        return "#eab308";
      case "red":
        return "#ef4444";
      default:
        return "transparent";
    }
  };

  const getColorTagLabel = () => {
    switch (colorTag) {
      case "none":
        return "Tag";
      case "green":
        return "Tag";
      case "yellow":
        return "Tag";
      case "red":
        return "Tag";
      default:
        return "Tag";
    }
  };

  const handleTabToTalkClick = () => {
    // Remember if we were in compact mode before entering prompt
    wasCompactBeforePrompt.current = shouldShowCompact;
    setIsPromptMode(true);
  };

  // Focus input when entering prompt mode
  useEffect(() => {
    if (isPromptMode && inputRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated and input is rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      });
    }
  }, [isPromptMode]);

  // Handle global Tab key to activate prompt mode
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" && !isPromptMode) {
        e.preventDefault();
        setIsPromptMode(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isPromptMode]);

  const type = objectTypes[0];
  const showConvertToVideo = type === "image" && !isMultiSelect;
  const isFrame = type === "frame" && !isMultiSelect;

  // Determine if we should show compact mode
  // Force compact mode if forceCompact is true (based on zoom level)
  // Otherwise, show compact if object is less than 60% of toolbar width
  const shouldShowCompact = forceCompact;

  // Calculate shrink factor based on available space
  // 0 = full size, 1 = fully compact (ellipsis only)
  const getShrinkFactor = () => {
    if (!objectWidth) return 0;

    const minSize = 48; // Size when we show ellipsis only
    const fullSize = 240; // Approximate full toolbar size in vertical mode

    if (isVertical) {
      // For vertical toolbar, shrink based on object height
      if (objectWidth < minSize) return 1; // Fully compact
      if (objectWidth >= fullSize) return 0; // Full size
      // Linear interpolation between minSize and fullSize
      return 1 - (objectWidth - minSize) / (fullSize - minSize);
    } else {
      // For horizontal toolbar, shrink based on object width
      if (objectWidth < minSize) return 1;
      if (objectWidth >= fullSize) return 0;
      return 1 - (objectWidth - minSize) / (fullSize - minSize);
    }
  };

  const shrinkFactor = forceCompact ? 1 : getShrinkFactor();
  const isFullyCompact = shrinkFactor >= 0.95; // Show ellipsis when almost fully shrunk

  // Calculate the actual size based on shrink factor for smooth animation
  const minToolbarSize = 24; // Ellipsis only size
  const maxToolbarSize = 240; // Full toolbar size
  const currentSize =
    minToolbarSize + (maxToolbarSize - minToolbarSize) * (1 - shrinkFactor);

  return (
    <TooltipProvider delayDuration={500}>
      <motion.div
        ref={toolbarRef}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          [isVertical ? "maxHeight" : "maxWidth"]: `${currentSize}px`,
        }}
        exit={{ opacity: 0 }}
        transition={{
          opacity: { duration: 0.1 },
          maxHeight: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
          maxWidth: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
        }}
        className={`flex items-center ${isVertical ? "flex-col" : ""} ${
          isVertical ? "gap-1" : "gap-2"
        } overflow-hidden rounded-full`}
        style={{ pointerEvents: "auto" }}
      >
        {!isPromptMode &&
          (isFullyCompact ? (
            // Show only ellipsis when fully compact
            <motion.button
              onMouseDown={(e) => {
                e.stopPropagation();
                if (onZoomToFit) {
                  onZoomToFit();
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="bg-white/95 backdrop-blur-md text-gray-900 rounded-full shadow-lg border border-black/5 hover:bg-gray-50 transition-colors flex items-center justify-center w-6 h-6 flex-shrink-0"
              style={{ cursor: "pointer" }}
            >
              <MoreHorizontal
                className="w-3 h-3 text-gray-700"
                strokeWidth={2}
              />
            </motion.button>
          ) : (
            // Normal mode - All buttons rendered, clipped by overflow
            <div
              className={`flex items-center ${isVertical ? "flex-col" : ""} ${
                isVertical ? "gap-1" : "gap-2"
              } flex-shrink-0`}
            >
              {/* Tab button - perfect circle */}
              {onAIPrompt && !hideTabButton && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTabToTalkClick();
                      }}
                      className="bg-white/95 backdrop-blur-md text-gray-700 rounded-full shadow-lg border border-black/5 hover:bg-gray-50 transition-colors w-10 h-10 flex items-center justify-center text-xs flex-shrink-0"
                    >
                      Tab
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side={isVertical ? "left" : "top"}
                    className="text-xs"
                  >
                    <p>Type...</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Icon buttons container */}
              <div
                className={`bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-black/5 flex items-center ${
                  isVertical ? "flex-col" : ""
                } gap-0.5 px-1 py-1 flex-shrink-0`}
              >
                {/* Rerun */}
                {onRerun && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRerun();
                        }}
                        className="flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors p-1"
                      >
                        <RotateCcw
                          className="w-3 h-3 text-gray-700"
                          strokeWidth={2}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side={isVertical ? "left" : "top"}
                      className="text-xs"
                    >
                      <p>Rerun</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Convert to video - only for images */}
                {showConvertToVideo && onConvertToVideo && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onConvertToVideo();
                        }}
                        className="flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors p-1"
                      >
                        <Video
                          className="w-3 h-3 text-gray-700"
                          strokeWidth={2}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side={isVertical ? "left" : "top"}
                      className="text-xs"
                    >
                      <p>Video</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Reframe / Unframe / Frame */}
                {onReframe && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onReframe();
                        }}
                        className="flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors p-1"
                      >
                        {isFrame ? (
                          <Ungroup
                            className="w-3 h-3 text-gray-700"
                            strokeWidth={2}
                          />
                        ) : isMultiSelect ? (
                          <Square
                            className="w-3 h-3 text-gray-700"
                            strokeWidth={2}
                          />
                        ) : (
                          <Maximize2
                            className="w-3 h-3 text-gray-700"
                            strokeWidth={2}
                          />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side={isVertical ? "left" : "top"}
                      className="text-xs"
                    >
                      <p>
                        {isFrame
                          ? "Unframe"
                          : isMultiSelect
                          ? "Frame"
                          : "Reframe"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Auto Layout (Frame only) */}
                {isFrame && onToggleAutolayout && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onToggleAutolayout();
                        }}
                        className={`flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors p-1 ${
                          activeObject && (activeObject as any).autoLayout
                            ? "bg-blue-50"
                            : ""
                        }`}
                      >
                        <LayoutGrid
                          className={`w-3.5 h-3.5 ${
                            activeObject && (activeObject as any).autoLayout
                              ? "text-blue-600"
                              : "text-gray-700"
                          }`}
                          strokeWidth={2}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side={isVertical ? "left" : "top"}
                      className="text-xs"
                    >
                      <p>Autolayout</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Auto Layout (Multi-select) */}
                {isMultiSelect && onFrameWithAutolayout && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onFrameWithAutolayout();
                        }}
                        className="flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors p-1"
                      >
                        <LayoutGrid
                          className="w-3 h-3 text-gray-700"
                          strokeWidth={2}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side={isVertical ? "left" : "top"}
                      className="text-xs"
                    >
                      <p>Autolayout</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Download */}
                {onDownload && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownload();
                        }}
                        className="flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors p-1"
                      >
                        <Download
                          className="w-3 h-3 text-gray-700"
                          strokeWidth={2}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side={isVertical ? "left" : "top"}
                      className="text-xs"
                    >
                      <p>Download</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* More options */}
                {onMore && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMore();
                        }}
                        className="flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors p-1"
                      >
                        <MoreHorizontal
                          className="w-3 h-3 text-gray-700"
                          strokeWidth={2}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side={isVertical ? "left" : "top"}
                      className="text-xs"
                    >
                      <p>More</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Color tag */}
                {onColorTagChange && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onColorTagChange();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                        }}
                        onMouseLeave={(e) => {
                          e.stopPropagation();
                        }}
                        className="flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors p-1"
                      >
                        {colorTag !== "none" ? (
                          <div
                            className="w-3 h-3 rounded-full border-2 border-gray-300"
                            style={{
                              backgroundColor: getColorTagColor(),
                            }}
                          />
                        ) : (
                          <Circle
                            className="w-3 h-3 text-gray-700"
                            strokeWidth={2}
                          />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side={isVertical ? "left" : "top"}
                      className="text-xs"
                    >
                      <p>{getColorTagLabel()}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          ))}
      </motion.div>
    </TooltipProvider>
  );
}
