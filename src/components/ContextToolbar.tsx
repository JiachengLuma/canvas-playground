import {
  Circle,
  Video,
  RotateCcw,
  Maximize2,
  MoreHorizontal,
  Download,
  ArrowUp,
  Square,
  LayoutGrid,
  Ungroup,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
  onMore?: () => void;
  onDownload?: () => void;
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
  onMore,
  onDownload,
}: ContextToolbarProps) {
  const [promptText, setPromptText] = useState("");
  const [isPromptMode, setIsPromptMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarWidth, setToolbarWidth] = useState(0);
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

  const handlePromptSubmit = () => {
    if (promptText.trim() && onAIPrompt) {
      onAIPrompt(promptText);
      setPromptText("");
      setIsPromptMode(false);
    }
  };

  const handlePromptKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePromptSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsPromptMode(false);
      setPromptText("");
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

  // Measure toolbar width (only when showing full toolbar)
  useEffect(() => {
    if (toolbarRef.current && !isPromptMode) {
      // Wait a tick for render to complete
      requestAnimationFrame(() => {
        if (toolbarRef.current) {
          const width = toolbarRef.current.offsetWidth;
          // Only update if we got a reasonable width (not prompt mode width)
          if (width > 200) {
            setToolbarWidth(width);
          }
        }
      });
    }
  }, [isPromptMode]); // Re-measure when mode changes

  const type = objectTypes[0];
  const showConvertToVideo = type === "image" && !isMultiSelect;
  const isFrame = type === "frame" && !isMultiSelect;

  // Determine if we should show compact mode
  // Show compact if object is less than 60% of toolbar width (less aggressive)
  const shouldShowCompact =
    objectWidth !== undefined &&
    toolbarWidth > 0 &&
    objectWidth < toolbarWidth * 0.6;

  return (
    <TooltipProvider delayDuration={500}>
      <motion.div
        ref={toolbarRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1, ease: "easeOut" }}
        className="flex items-center gap-2"
        style={{ pointerEvents: "auto" }}
      >
        {shouldShowCompact && !isPromptMode ? (
          // Compact mode - show "Tab | ..." button without tooltip
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onZoomToFit) onZoomToFit();
            }}
            className="bg-white/95 backdrop-blur-md text-gray-900 rounded-full shadow-lg border border-black/5 hover:bg-gray-50 transition-colors px-3 py-1.5 flex items-center gap-2"
          >
            <span className="text-xs font-medium text-gray-600">Tab</span>
            <div className="w-px h-3 bg-gray-300" />
            <MoreHorizontal
              className="w-3.5 h-3.5 text-gray-700"
              strokeWidth={2}
            />
          </button>
        ) : (
          <AnimatePresence mode="wait">
            {isPromptMode ? (
              // Prompt input mode - only show input
              <motion.div
                key="prompt-mode"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white/95 backdrop-blur-md text-gray-900 rounded-full shadow-lg border border-black/5 flex items-center gap-2 overflow-hidden px-4 py-1.5"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  onKeyDown={handlePromptKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="Ask AI anything... (ESC to exit)"
                  className="bg-transparent text-gray-900 placeholder:text-gray-400 outline-none text-xs w-64"
                  style={{ caretColor: "#000" }}
                  autoFocus
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePromptSubmit();
                  }}
                  disabled={!promptText.trim()}
                  className="flex items-center justify-center rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors p-1.5 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <ArrowUp className="w-3 h-3" strokeWidth={2.5} />
                </button>
              </motion.div>
            ) : (
              // Normal mode - Tab button + main toolbar
              <motion.div
                key="normal-mode"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-2"
              >
                {/* Tab button - perfect circle */}
                {onAIPrompt && (
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
                    <TooltipContent side="top" className="text-xs">
                      <p>Type...</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Icon buttons container */}
                <div className="bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-black/5 flex items-center gap-0.5 px-1.5 py-1.5">
                  {/* Rerun */}
                  {onRerun && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRerun();
                          }}
                          className="flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors p-1.5"
                        >
                          <RotateCcw
                            className="w-4 h-4 text-gray-700"
                            strokeWidth={2}
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
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
                          className="flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors p-1.5"
                        >
                          <Video
                            className="w-4 h-4 text-gray-700"
                            strokeWidth={2}
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
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
                          className="flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors p-1.5"
                        >
                          {isFrame ? (
                            <Ungroup
                              className="w-4 h-4 text-gray-700"
                              strokeWidth={2}
                            />
                          ) : isMultiSelect ? (
                            <Square
                              className="w-4 h-4 text-gray-700"
                              strokeWidth={2}
                            />
                          ) : (
                            <Maximize2
                              className="w-4 h-4 text-gray-700"
                              strokeWidth={2}
                            />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
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
                          className={`flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors p-1.5 ${
                            activeObject && (activeObject as any).autoLayout
                              ? "bg-blue-50"
                              : ""
                          }`}
                        >
                          <LayoutGrid
                            className={`w-4 h-4 ${
                              activeObject && (activeObject as any).autoLayout
                                ? "text-blue-600"
                                : "text-gray-700"
                            }`}
                            strokeWidth={2}
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p>Autolayout</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Download */}
                  {onDownload && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onDownload();
                          }}
                          className="flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors p-1.5"
                        >
                          <Download
                            className="w-4 h-4 text-gray-700"
                            strokeWidth={2}
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p>Download</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* More options */}
                  {onMore && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onMore();
                          }}
                          className="flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors p-1.5"
                        >
                          <MoreHorizontal
                            className="w-4 h-4 text-gray-700"
                            strokeWidth={2}
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
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
                          className="flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors p-1.5"
                        >
                          {colorTag !== "none" ? (
                            <div
                              className="w-4 h-4 rounded-full border-2 border-gray-300"
                              style={{
                                backgroundColor: getColorTagColor(),
                              }}
                            />
                          ) : (
                            <Circle
                              className="w-4 h-4 text-gray-700"
                              strokeWidth={2}
                            />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p>{getColorTagLabel()}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </TooltipProvider>
  );
}
