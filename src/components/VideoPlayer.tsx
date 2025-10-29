import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  AudioLines,
  Maximize,
} from "lucide-react";
import { getUISizeState } from "../utils/canvasUtils";

interface VideoPlayerProps {
  src: string;
  isSelected: boolean;
  isHovered: boolean;
  zoomLevel: number;
  width: number;
  height: number;
  duration?: number;
  pauseOnSelect?: boolean;
  isDragging?: boolean;
  hasAudio?: boolean; // Whether this video has audio track
  shouldSyncPlay?: boolean; // For multi-video sync play feature
  controlsLayout?: "unified-pill" | "split-top-bottom"; // DEBUG: Layout option
  showPlayIconOnHover?: boolean; // DEBUG: Show play icon in default/hover states
}

/**
 * DEBUG: Two layout options available via controlsLayout prop:
 *
 * "unified-pill" (default): All controls in one pill above timeline
 * - Selected: [Play/Pause] [Time] [Mute] [Fullscreen] in single pill above bottom
 * - Timeline never conflicts with controls
 *
 * "split-top-bottom": Controls split between top and bottom
 * - Top: [Time] ... [Mute] [Fullscreen]
 * - Bottom: Timeline only (no control conflicts)
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  isSelected,
  isHovered,
  zoomLevel,
  width,
  height,
  duration = 0,
  pauseOnSelect = false,
  isDragging = false,
  hasAudio = false,
  shouldSyncPlay = false,
  controlsLayout = "unified-pill", // DEBUG: Change to "split-top-bottom" to test alternate layout
  showPlayIconOnHover = true, // DEBUG: Toggle play icon in default/hover states
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const seekAreaRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(duration);
  const [isMuted, setIsMuted] = useState(false); // Start unmuted (will auto-unmute on select if hasAudio)
  const animationFrameRef = useRef<number | null>(null);
  const wasPlayingBeforeSelection = useRef(false);
  const isSelecting = useRef(false);
  const justSelected = useRef(false);
  const hoverSeekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isHoveringSeekArea, setIsHoveringSeekArea] = useState(false);
  const [isDraggingSeekBar, setIsDraggingSeekBar] = useState(false);
  const [hoverTimelinePosition, setHoverTimelinePosition] = useState<
    number | null
  >(null);
  const [isHoveringTimelineArea, setIsHoveringTimelineArea] = useState(false);

  // Smooth progress bar animation using requestAnimationFrame
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video && !video.paused && !video.ended) {
        setCurrentTime(video.currentTime);
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handlePause);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handlePause);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  // Auto-play on hover (when not selected) - only if not hovering seek area
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isSelected) return;

    if (isHovered && !isHoveringSeekArea) {
      console.log("[VideoPlayer] Hover (top half) - playing video");
      video.play().catch(() => {
        // Ignore play errors
      });
      wasPlayingBeforeSelection.current = true;
    } else if (!isHovered) {
      // Pause on hover leave ONLY if:
      // 1. Not in process of selecting OR
      // 2. pauseOnSelect is true (user wants pause behavior)
      if (!isSelecting.current || pauseOnSelect) {
        console.log("[VideoPlayer] Hover leave - pausing video");
        video.pause();
        wasPlayingBeforeSelection.current = false;
      } else {
        console.log("[VideoPlayer] Hover leave - BLOCKED by isSelecting flag");
      }
    }
  }, [isHovered, isSelected, pauseOnSelect, isHoveringSeekArea]);

  // Keep playing when selected (based on pauseOnSelect setting)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isSelected) {
      console.log(
        "[VideoPlayer] Selected! pauseOnSelect:",
        pauseOnSelect,
        "wasPlayingBeforeSelection:",
        wasPlayingBeforeSelection.current
      );
      console.log("[VideoPlayer] Video paused state:", video.paused);

      // Set justSelected flag to ignore the first click event
      justSelected.current = true;

      // If pauseOnSelect is FALSE and was playing before selection, keep it playing
      if (!pauseOnSelect && wasPlayingBeforeSelection.current) {
        console.log("[VideoPlayer] Forcing video to keep playing...");
        // Force multiple times to override any pause attempts
        video.play().catch(() => {});
        setTimeout(() => {
          if (video && wasPlayingBeforeSelection.current) {
            console.log("[VideoPlayer] Force play again at 10ms");
            video.play().catch(() => {});
          }
        }, 10);
        setTimeout(() => {
          if (video && wasPlayingBeforeSelection.current) {
            console.log("[VideoPlayer] Force play again at 50ms");
            video.play().catch(() => {});
          }
        }, 50);
      } else if (pauseOnSelect && wasPlayingBeforeSelection.current) {
        console.log("[VideoPlayer] pauseOnSelect is TRUE - pausing video");
        video.pause();
      }

      // Clear flags after selection is complete
      setTimeout(() => {
        console.log(
          "[VideoPlayer] Clearing isSelecting and justSelected flags"
        );
        isSelecting.current = false;
        justSelected.current = false;
      }, 150);
    } else {
      // Reset when deselected
      console.log("[VideoPlayer] Deselected - resetting state");
      wasPlayingBeforeSelection.current = false;
      isSelecting.current = false;
      justSelected.current = false;
    }
  }, [isSelected, pauseOnSelect]);

  // Pause video when dragging, resume if it was playing
  const wasPlayingBeforeDrag = useRef(false);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isDragging) {
      // Store playing state before pausing
      wasPlayingBeforeDrag.current = !video.paused;
      console.log(
        "[VideoPlayer] Dragging - pausing video, wasPlaying:",
        wasPlayingBeforeDrag.current
      );
      video.pause();
    } else if (wasPlayingBeforeDrag.current) {
      // Resume playing if it was playing before drag
      console.log("[VideoPlayer] Drag ended - resuming playback");
      video.play().catch(() => {});
      wasPlayingBeforeDrag.current = false;
    }
  }, [isDragging]);

  // Control audio based on state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasAudio) return;

    // Audio rules:
    // - Hover play: always muted
    // - Selected (including seek/scrub): respect user's mute preference
    let shouldBeMuted = true;

    if (isSelected) {
      // Selected - respect user's mute preference (allow sound during seek)
      shouldBeMuted = isMuted;
    } else {
      // Hovering - always muted
      shouldBeMuted = true;
    }

    video.muted = shouldBeMuted;

    console.log(
      "[VideoPlayer] Audio - hasAudio:",
      hasAudio,
      "selected:",
      isSelected,
      "userMuted:",
      isMuted,
      "=> muted:",
      shouldBeMuted
    );
  }, [isSelected, hasAudio, isMuted]);

  // Multi-video sync play feature - play all selected videos when hovering any one
  const wasSyncPlaying = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (shouldSyncPlay) {
      console.log("[VideoPlayer] Multi-video sync play activated!");
      video.play().catch(() => {
        // Ignore play errors
      });
      wasSyncPlaying.current = true;
    } else if (wasSyncPlaying.current && !shouldSyncPlay) {
      // Just stopped sync playing - pause immediately
      console.log("[VideoPlayer] Multi-video sync play ended - pausing");
      video.pause();
      wasSyncPlaying.current = false;
    }
  }, [shouldSyncPlay]);

  // Format duration
  const formatTime = (seconds: number, includeUnit = true) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (includeUnit) {
      // For non-hover state, show compact format for short videos, time format for longer ones
      if (seconds >= 60) {
        // Videos >= 1 minute: show 0:00 format
        return `${mins}:${secs.toString().padStart(2, "0")}`;
      }
      // Videos < 1 minute: show simple "5s" format
      return `${secs}s`;
    } else {
      // For hover state, always show 0:00 format
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
  };

  const durationText = formatTime(videoDuration);

  // Format current time in simple seconds format for hover (e.g., "1s", "2s", "3s")
  const currentTimeSimple = formatTime(Math.floor(currentTime), true);

  // Format times for display (detailed format for selected)
  const currentTimeFormatted = formatTime(Math.floor(currentTime), false);
  const totalTimeFormatted = formatTime(videoDuration, false);
  const detailedTimeDisplay = `${currentTimeFormatted} / ${totalTimeFormatted}`;

  // Choose display format based on state
  let timeDisplay = durationText; // Default
  if (isSelected && videoDuration > 0) {
    timeDisplay = detailedTimeDisplay; // Selected: show "0:00 / 0:05"
  } else if (isHovered && videoDuration > 0) {
    timeDisplay = currentTimeSimple; // Hover: show "1s", "2s", "3s"
  }

  const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  // Calculate scale-aware sizing
  // Base sizes are for normal scale
  const getScaledSize = (baseSize: number) => baseSize / zoomLevel;

  // Get size classification for the video
  const sizeState = getUISizeState(width, height, zoomLevel);

  // Determine what to show based on size classification
  const showProgressBar = sizeState !== "micro"; // Hide everything at micro
  const showIconAndTime = sizeState !== "tiny" && sizeState !== "micro"; // Show icon and time at small and normal size

  // Clever pill scaling: Scale down proportionally based on video's screen size
  // Calculate the smaller dimension on screen (to handle both portrait and landscape)
  const smallerScreenDimension = Math.min(
    width * zoomLevel,
    height * zoomLevel
  );

  // Scale factor based on screen size:
  // - At 200px+: scale = 1.0 (full size)
  // - At 100px: scale = 0.75 (25% smaller)
  // - At 50px: scale = 0.5 (50% smaller)
  const pillScaleFactor = Math.max(
    0.5,
    Math.min(1.0, 0.5 + (smallerScreenDimension - 50) / 300)
  );

  // Scale-aware sizing - made bigger at normal scale, with additional proportional scaling
  // Pill inset decreases at smaller scales for better space utilization
  const basePillInset =
    sizeState === "normal" ? 10 : sizeState === "small" ? 6 : 3;
  const pillInset = getScaledSize(basePillInset);
  const pillPaddingX = getScaledSize(8) * pillScaleFactor;
  const pillPaddingY = getScaledSize(4) * pillScaleFactor;
  const pillGap = getScaledSize(4) * pillScaleFactor;
  const pillRadius = getScaledSize(14) * pillScaleFactor;
  const iconSize = getScaledSize(14) * pillScaleFactor;
  const fontSize = getScaledSize(11) * pillScaleFactor;
  const lineHeight = getScaledSize(16) * pillScaleFactor;

  // Progress bar flush to bottom and sides - no padding
  const baseProgressBarBottom = 0; // Moved to bottom edge - no padding
  const baseProgressBarSide = 0; // Flush to left and right edges - no padding
  const progressBarBottom = getScaledSize(baseProgressBarBottom);
  const progressBarSide = getScaledSize(baseProgressBarSide);

  // Handle seek area interaction - YouTube style
  const handleSeekAreaMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekAreaRef.current || !videoRef.current) return;

    const rect = seekAreaRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const hoverY = e.clientY - rect.top;
    const percentage = Math.max(0, Math.min(1, hoverX / rect.width));
    const previewTime = percentage * videoDuration;

    if (isSelected) {
      // Check if hovering in bottom timeline area (bottom 60px in screen coordinates)
      const timelineAreaHeight = 60 / zoomLevel;
      const isInTimelineArea = hoverY >= rect.height - timelineAreaHeight;
      setIsHoveringTimelineArea(isInTimelineArea);

      // Selected mode: YouTube style - show preview, seek when dragging
      setHoverTimelinePosition(percentage);

      // If dragging, seek immediately
      if (isDraggingSeekBar) {
        videoRef.current.currentTime = previewTime;
        setCurrentTime(previewTime);
      }
    } else {
      // Hover mode: scrub immediately but pause, then resume on dwell
      setIsHoveringSeekArea(true);

      // Pause and seek immediately
      videoRef.current.pause();
      videoRef.current.currentTime = previewTime;
      setCurrentTime(previewTime);

      // Clear existing timeout
      if (hoverSeekTimeoutRef.current) {
        clearTimeout(hoverSeekTimeoutRef.current);
      }

      // Set new timeout to resume playing after dwell (500ms)
      hoverSeekTimeoutRef.current = setTimeout(() => {
        if (videoRef.current) {
          console.log(
            "[VideoPlayer] Hover dwell - resuming play from:",
            previewTime
          );
          videoRef.current.play().catch(() => {});
        }
      }, 500);
    }
  };

  // Handle seek bar mouse down to start dragging
  const handleSeekAreaMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSelected) {
      e.stopPropagation(); // Prevent video object drag
      setIsDraggingSeekBar(true);

      // Immediately seek to clicked position (YouTube style - click to jump)
      if (!seekAreaRef.current || !videoRef.current) return;
      const rect = seekAreaRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      const newTime = percentage * videoDuration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Handle global mouse up to end dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingSeekBar) {
        setIsDraggingSeekBar(false);
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDraggingSeekBar]);

  // Handle seek area click - only for selected mode (already handled in mousedown)
  const handleSeekAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Prevent triggering play/pause

    // Click is handled by mousedown for selected mode
    // For hover mode, clicks are ignored (only mouse move matters)
  };

  // Clear preview when mouse leaves seek area
  const handleSeekAreaMouseLeave = () => {
    setHoverTimelinePosition(null);
    setIsHoveringSeekArea(false);
    setIsHoveringTimelineArea(false);

    // Clear hover seek timeout and resume playing if in hover mode
    if (hoverSeekTimeoutRef.current) {
      clearTimeout(hoverSeekTimeoutRef.current);
      hoverSeekTimeoutRef.current = null;

      // If in hover mode (not selected), resume playing
      if (!isSelected && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  // Handle play icon click
  const handlePlayIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      wasPlayingBeforeSelection.current = true;
    } else {
      videoRef.current.pause();
      wasPlayingBeforeSelection.current = false;
    }
  };

  // Handle mute toggle
  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  // Handle fullscreen toggle
  const handleFullscreenToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;

    const videoElement = videoRef.current;
    if (!document.fullscreenElement) {
      videoElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Track if mouse has moved during mousedown (to distinguish click from drag)
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const hasMoved = useRef(false);

  // Handle mouse down - set flag BEFORE hover state changes
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;

    // Track initial mouse position to detect dragging
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    hasMoved.current = false;

    // For non-selected videos, don't interfere with drag detection
    // Just track the playing state
    if (!isSelected) {
      const isPaused = videoRef.current.paused;
      const wasPlaying = !isPaused;
      console.log(
        "[VideoPlayer] MouseDown - video paused:",
        isPaused,
        "wasPlaying:",
        wasPlaying
      );

      isSelecting.current = true; // Prevent hover leave from pausing
      wasPlayingBeforeSelection.current = wasPlaying;

      console.log(
        "[VideoPlayer] Set isSelecting=true, wasPlayingBeforeSelection=",
        wasPlaying
      );

      // Don't stop propagation - let CanvasObject handle the drag
      return;
    }

    // For selected videos, still track but let CanvasObject handle first
    // The click handler will deal with play/pause if it's not a drag
  };

  // Handle mouse move to detect dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mouseDownPos.current && !hasMoved.current) {
      const dx = Math.abs(e.clientX - mouseDownPos.current.x);
      const dy = Math.abs(e.clientY - mouseDownPos.current.y);

      // If moved more than 3px, consider it a drag
      if (dx > 3 || dy > 3) {
        hasMoved.current = true;
      }
    }
  };

  // Handle video click to select or play/pause
  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;

    // If this was a drag, ignore the click
    if (hasMoved.current) {
      console.log("[VideoPlayer] Click ignored - was dragging");
      mouseDownPos.current = null;
      hasMoved.current = false;
      return;
    }

    // Reset tracking
    mouseDownPos.current = null;
    hasMoved.current = false;

    // First click (not selected): just let it select
    if (!isSelected) {
      console.log("[VideoPlayer] Click - not selected, allowing selection");
      // Don't stop propagation - let it select the object
      // State was already captured in mousedown
      return;
    }

    // Ignore the click event that happens right after selection
    if (justSelected.current) {
      console.log("[VideoPlayer] Click - just selected, ignoring this click");
      e.stopPropagation();
      return;
    }

    // Already selected: toggle play/pause
    e.stopPropagation();
    console.log("[VideoPlayer] Already selected - toggling play/pause");

    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      wasPlayingBeforeSelection.current = true;
    } else {
      videoRef.current.pause();
      wasPlayingBeforeSelection.current = false;
    }
  };

  return (
    <div
      className="w-full h-full bg-black flex items-center justify-center relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onClick={handleVideoClick}
      style={{ cursor: isSelected ? "pointer" : "default" }}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        loop
        playsInline
        disablePictureInPicture
        disableRemotePlayback
      />

      {/* Always hide native controls across all browsers */}
      <style>{`
        video::-webkit-media-controls {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }
        video::-webkit-media-controls-enclosure {
          display: none !important;
        }
        video::-webkit-media-controls-panel {
          display: none !important;
        }
        video::-webkit-media-controls-play-button {
          display: none !important;
        }
        video::-webkit-media-controls-start-playback-button {
          display: none !important;
        }
        video::-webkit-media-controls-overlay-play-button {
          display: none !important;
        }
        /* Firefox */
        video::-moz-media-controls {
          display: none !important;
        }
        /* IE/Edge */
        video::-ms-media-controls {
          display: none !important;
        }
      `}</style>

      {/* Custom controls */}
      <>
        {/* LAYOUT OPTION 1: Unified Pill - All controls including timeline in one pill */}
        {controlsLayout === "unified-pill" && (
          <>
            {/* Black gradient background - shows when hovering in selected state */}
            {isSelected && isHovered && !isDragging && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: `${Math.min(100 / zoomLevel, 120)}px`, // Clamped to max 120px
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%)",
                  zIndex: 15,
                }}
              />
            )}

            {/* Interactive area for selected state - keeps hover detection active and allows clicking to bring back controls */}
            {isSelected && !isDragging && !isHovered && (
              <div
                className="absolute cursor-pointer"
                style={{
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  pointerEvents: "auto",
                  zIndex: 10,
                }}
              />
            )}

            {/* Unified control pill - contains play, time, TIMELINE, mute, fullscreen all in one */}
            {showIconAndTime && !isDragging && isSelected && isHovered && (
              <div
                className="absolute flex items-center transition-opacity duration-200"
                style={{
                  left: `${pillInset}px`,
                  right: `${pillInset}px`,
                  bottom: `${pillInset}px`,
                  paddingLeft: `${pillPaddingX}px`,
                  paddingRight: `${pillPaddingX}px`,
                  paddingTop: `${pillPaddingY}px`,
                  paddingBottom: `${pillPaddingY}px`,
                  borderRadius: `${pillRadius}px`,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  boxShadow:
                    "0px 8px 24px -4px rgba(24, 39, 75, 0.04), 0px 4px 20px 0px rgba(0, 0, 0, 0.02)",
                  zIndex: 20,
                  gap: `${pillGap}px`,
                  opacity: 1,
                  pointerEvents: "auto",
                }}
              >
                {/* Play/Pause button */}
                <div
                  className="flex items-center justify-center text-white cursor-pointer hover:opacity-80"
                  style={{
                    fontSize: `${iconSize}px`,
                    lineHeight: `${iconSize}px`,
                    flexShrink: 0,
                  }}
                  onClick={handlePlayIconClick}
                >
                  {isPlaying ? (
                    <Pause
                      fill="white"
                      className="text-white"
                      style={{
                        width: `${iconSize}px`,
                        height: `${iconSize}px`,
                      }}
                    />
                  ) : (
                    <Play
                      fill="white"
                      className="text-white"
                      style={{
                        width: `${iconSize}px`,
                        height: `${iconSize}px`,
                      }}
                    />
                  )}
                </div>

                {/* Time display */}
                <div
                  className="text-white font-medium"
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: `${lineHeight}px`,
                    opacity: 0.9,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {detailedTimeDisplay}
                </div>

                {/* Timeline/Progress Bar Container - takes up remaining space */}
                <div
                  ref={seekAreaRef}
                  className="relative flex-1 cursor-pointer"
                  style={{
                    height: `${lineHeight}px`,
                    minWidth: `${50 / zoomLevel}px`,
                  }}
                  onMouseDown={handleSeekAreaMouseDown}
                  onClick={handleSeekAreaClick}
                  onMouseMove={handleSeekAreaMouseMove}
                  onMouseLeave={handleSeekAreaMouseLeave}
                >
                  {/* Progress bar background */}
                  <div
                    className="absolute"
                    style={{
                      left: 0,
                      right: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      height: `${3 / zoomLevel}px`,
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                      borderRadius: `${1.5 / zoomLevel}px`,
                    }}
                  />

                  {/* Preview bar (shows on hover) */}
                  {hoverTimelinePosition !== null && (
                    <div
                      className="absolute left-0"
                      style={{
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: `${hoverTimelinePosition * 100}%`,
                        height: `${3 / zoomLevel}px`,
                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                        borderRadius: `${1.5 / zoomLevel}px`,
                      }}
                    />
                  )}

                  {/* Actual progress bar */}
                  <div
                    className="absolute left-0 bg-white"
                    style={{
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: `${progress}%`,
                      height: `${3 / zoomLevel}px`,
                      borderRadius: `${1.5 / zoomLevel}px`,
                    }}
                  />

                  {/* Hover timestamp tooltip */}
                  {hoverTimelinePosition !== null && (
                    <div
                      className="absolute text-white font-medium"
                      style={{
                        left: `${hoverTimelinePosition * 100}%`,
                        bottom: "100%",
                        transform: "translateX(-50%)",
                        marginBottom: `${4 / zoomLevel}px`,
                        fontSize: `${fontSize}px`,
                        lineHeight: `${lineHeight}px`,
                        opacity: 0.9,
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                      }}
                    >
                      {formatTime(hoverTimelinePosition * videoDuration, false)}
                    </div>
                  )}
                </div>

                {/* Mute button */}
                {hasAudio && (
                  <button
                    onClick={handleMuteToggle}
                    className="flex items-center justify-center text-white hover:opacity-80 cursor-pointer"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    {isMuted ? (
                      <VolumeX
                        style={{
                          width: `${iconSize}px`,
                          height: `${iconSize}px`,
                        }}
                      />
                    ) : (
                      <Volume2
                        style={{
                          width: `${iconSize}px`,
                          height: `${iconSize}px`,
                        }}
                      />
                    )}
                  </button>
                )}

                {/* Fullscreen button */}
                <button
                  onClick={handleFullscreenToggle}
                  className="flex items-center justify-center text-white hover:opacity-80 cursor-pointer"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  <Maximize
                    style={{
                      width: `${iconSize}px`,
                      height: `${iconSize}px`,
                    }}
                  />
                </button>
              </div>
            )}

            {/* Default/Hover pill (non-selected state) - positioned at BOTTOM for this layout */}
            {showIconAndTime && !isDragging && !isSelected && (
              <div
                className="absolute transition-opacity duration-200"
                style={{
                  left: `${pillInset}px`,
                  bottom: `${pillInset}px`, // Bottom position for unified-pill layout
                  paddingLeft: `${pillPaddingX}px`,
                  paddingRight: `${pillPaddingX}px`,
                  paddingTop: `${pillPaddingY}px`,
                  paddingBottom: `${pillPaddingY}px`,
                  borderRadius: `${pillRadius}px`,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  boxShadow:
                    "0px 8px 24px -4px rgba(24, 39, 75, 0.04), 0px 4px 20px 0px rgba(0, 0, 0, 0.02)",
                  zIndex: 20, // Above seek area
                  opacity: isSelected && isHoveringTimelineArea ? 0 : 1,
                  pointerEvents:
                    isSelected && isHoveringTimelineArea ? "none" : "auto",
                }}
              >
                <div
                  className="flex items-center"
                  style={{
                    gap: `${pillGap}px`,
                    fontSize: `${fontSize}px`,
                    lineHeight: `${lineHeight}px`,
                  }}
                >
                  {/* Play/Pause icon - shows based on showPlayIconOnHover setting */}
                  {showPlayIconOnHover && (
                    <div
                      className={`flex items-center justify-center text-white transition-opacity ${
                        isSelected
                          ? "cursor-pointer hover:opacity-80"
                          : "cursor-default"
                      }`}
                      style={{
                        fontSize: `${iconSize}px`,
                        lineHeight: `${iconSize}px`,
                        pointerEvents: isSelected ? "auto" : "none",
                      }}
                      onClick={isSelected ? handlePlayIconClick : undefined}
                    >
                      {isSelected && isPlaying ? (
                        <Pause
                          fill="white"
                          className="text-white"
                          style={{
                            width: `${iconSize}px`,
                            height: `${iconSize}px`,
                          }}
                        />
                      ) : (
                        <Play
                          fill="white"
                          className="text-white"
                          style={{
                            width: `${iconSize}px`,
                            height: `${iconSize}px`,
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* Time display - changes based on state: default "5s", hover "1s/2s/3s", selected "0:00 / 0:05" */}
                  <div
                    className="text-white font-medium"
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: `${lineHeight}px`,
                      opacity: 0.9,
                    }}
                  >
                    {timeDisplay}
                  </div>

                  {/* Audio wave icon - only show if video has audio and NOT hovered/selected */}
                  {hasAudio && !isHovered && !isSelected && (
                    <div
                      className="flex items-center justify-center text-white"
                      style={{
                        fontSize: `${iconSize}px`,
                        lineHeight: `${iconSize}px`,
                      }}
                    >
                      <AudioLines
                        className="text-white"
                        style={{
                          width: `${iconSize}px`,
                          height: `${iconSize}px`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* LAYOUT OPTION 2: Split Top/Bottom - Controls at top, timeline at bottom */}
        {controlsLayout === "split-top-bottom" && (
          <>
            {/* Top controls pill - play/pause + time on left, mute/fullscreen on right (when selected) */}
            {showIconAndTime && !isDragging && isSelected && (
              <div
                className="absolute flex items-center justify-between"
                style={{
                  left: `${pillInset}px`,
                  right: `${pillInset}px`,
                  top: `${pillInset}px`,
                  zIndex: 20,
                }}
              >
                {/* Left: Play/Pause + Time display in one pill */}
                <div
                  className="flex items-center"
                  style={{
                    paddingLeft: `${pillPaddingX}px`,
                    paddingRight: `${pillPaddingX}px`,
                    paddingTop: `${pillPaddingY}px`,
                    paddingBottom: `${pillPaddingY}px`,
                    borderRadius: `${pillRadius}px`,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    boxShadow:
                      "0px 8px 24px -4px rgba(24, 39, 75, 0.04), 0px 4px 20px 0px rgba(0, 0, 0, 0.02)",
                    gap: `${pillGap}px`,
                  }}
                >
                  {/* Play/Pause button */}
                  <div
                    className="flex items-center justify-center text-white cursor-pointer hover:opacity-80"
                    style={{
                      fontSize: `${iconSize}px`,
                      lineHeight: `${iconSize}px`,
                    }}
                    onClick={handlePlayIconClick}
                  >
                    {isPlaying ? (
                      <Pause
                        fill="white"
                        className="text-white"
                        style={{
                          width: `${iconSize}px`,
                          height: `${iconSize}px`,
                        }}
                      />
                    ) : (
                      <Play
                        fill="white"
                        className="text-white"
                        style={{
                          width: `${iconSize}px`,
                          height: `${iconSize}px`,
                        }}
                      />
                    )}
                  </div>

                  {/* Time display */}
                  <div
                    className="text-white font-medium"
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: `${lineHeight}px`,
                      opacity: 0.9,
                    }}
                  >
                    {detailedTimeDisplay}
                  </div>
                </div>

                {/* Right: Control buttons */}
                <div
                  className="flex items-center"
                  style={{
                    gap: `${pillGap}px`,
                  }}
                >
                  {/* Mute button */}
                  {hasAudio && (
                    <button
                      onClick={handleMuteToggle}
                      className="flex items-center justify-center text-white hover:opacity-80 cursor-pointer"
                      style={{
                        padding: `${pillPaddingY}px ${pillPaddingX}px`,
                        borderRadius: `${pillRadius}px`,
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        boxShadow:
                          "0px 8px 24px -4px rgba(24, 39, 75, 0.04), 0px 4px 20px 0px rgba(0, 0, 0, 0.02)",
                        border: "none",
                      }}
                    >
                      {isMuted ? (
                        <VolumeX
                          style={{
                            width: `${iconSize}px`,
                            height: `${iconSize}px`,
                          }}
                        />
                      ) : (
                        <Volume2
                          style={{
                            width: `${iconSize}px`,
                            height: `${iconSize}px`,
                          }}
                        />
                      )}
                    </button>
                  )}

                  {/* Fullscreen button */}
                  <button
                    onClick={handleFullscreenToggle}
                    className="flex items-center justify-center text-white hover:opacity-80 cursor-pointer"
                    style={{
                      padding: `${pillPaddingY}px ${pillPaddingX}px`,
                      borderRadius: `${pillRadius}px`,
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      boxShadow:
                        "0px 8px 24px -4px rgba(24, 39, 75, 0.04), 0px 4px 20px 0px rgba(0, 0, 0, 0.02)",
                      border: "none",
                    }}
                  >
                    <Maximize
                      style={{
                        width: `${iconSize}px`,
                        height: `${iconSize}px`,
                      }}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Default/Hover pill (non-selected state) - positioned at TOP for this layout */}
            {showIconAndTime && !isDragging && !isSelected && (
              <div
                className="absolute"
                style={{
                  left: `${pillInset}px`,
                  top: `${pillInset}px`, // Top position for split-top-bottom layout
                  paddingLeft: `${pillPaddingX}px`,
                  paddingRight: `${pillPaddingX}px`,
                  paddingTop: `${pillPaddingY}px`,
                  paddingBottom: `${pillPaddingY}px`,
                  borderRadius: `${pillRadius}px`,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  boxShadow:
                    "0px 8px 24px -4px rgba(24, 39, 75, 0.04), 0px 4px 20px 0px rgba(0, 0, 0, 0.02)",
                  zIndex: 20,
                }}
              >
                <div
                  className="flex items-center"
                  style={{
                    gap: `${pillGap}px`,
                    fontSize: `${fontSize}px`,
                    lineHeight: `${lineHeight}px`,
                  }}
                >
                  {/* Play icon - shows based on showPlayIconOnHover setting */}
                  {showPlayIconOnHover && (
                    <div
                      className="flex items-center justify-center text-white"
                      style={{
                        fontSize: `${iconSize}px`,
                        lineHeight: `${iconSize}px`,
                      }}
                    >
                      <Play
                        fill="white"
                        className="text-white"
                        style={{
                          width: `${iconSize}px`,
                          height: `${iconSize}px`,
                        }}
                      />
                    </div>
                  )}

                  {/* Time display */}
                  <div
                    className="text-white font-medium"
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: `${lineHeight}px`,
                      opacity: 0.9,
                    }}
                  >
                    {timeDisplay}
                  </div>

                  {/* Audio wave icon */}
                  {hasAudio && !isHovered && (
                    <div
                      className="flex items-center justify-center text-white"
                      style={{
                        fontSize: `${iconSize}px`,
                        lineHeight: `${iconSize}px`,
                      }}
                    >
                      <AudioLines
                        className="text-white"
                        style={{
                          width: `${iconSize}px`,
                          height: `${iconSize}px`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== SHARED HOVER SCRUB (for both layouts when not selected) ===== */}
        {!isSelected && !isDragging && (
          <>
            {/* Full-height scrub area */}
            <div
              ref={seekAreaRef}
              className="absolute cursor-pointer"
              style={{
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                pointerEvents: "auto",
                zIndex: 10,
              }}
              onMouseDown={handleSeekAreaMouseDown}
              onClick={handleSeekAreaClick}
              onMouseMove={handleSeekAreaMouseMove}
              onMouseLeave={handleSeekAreaMouseLeave}
            />

            {/* Hover progress bar at bottom */}
            {isHovered && showProgressBar && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${progressBarSide}px`,
                  right: `${progressBarSide}px`,
                  bottom: `${progressBarBottom}px`,
                }}
              >
                {/* Background track */}
                <div
                  className="absolute"
                  style={{
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: `${3 / zoomLevel}px`,
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                    borderRadius: 0,
                  }}
                />

                {/* Preview bar (shows hover position) */}
                {hoverTimelinePosition !== null && (
                  <div
                    className="absolute left-0"
                    style={{
                      bottom: 0,
                      width: `${hoverTimelinePosition * 100}%`,
                      height: `${3 / zoomLevel}px`,
                      backgroundColor: "rgba(255, 255, 255, 0.5)",
                      borderRadius: 0,
                    }}
                  />
                )}

                {/* Actual progress bar */}
                <div
                  className="absolute left-0 bg-white"
                  style={{
                    bottom: 0,
                    width: `${progress}%`,
                    height: `${3 / zoomLevel}px`,
                    borderRadius: 0,
                  }}
                />

                {/* Hover timestamp */}
                {hoverTimelinePosition !== null && (
                  <div
                    className="absolute text-white font-medium"
                    style={{
                      left: `${hoverTimelinePosition * 100}%`,
                      bottom: `${10 / zoomLevel}px`,
                      transform: "translate(-50%, -100%)",
                      fontSize: `${fontSize}px`,
                      lineHeight: `${lineHeight}px`,
                      opacity: 0.9,
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                    }}
                  >
                    {formatTime(hoverTimelinePosition * videoDuration, false)}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ===== SELECTED STATE: Scrub area and Progress Bar for split-top-bottom layout ===== */}
        {/* For unified-pill layout, these are integrated into the pill itself */}

        {/* Scrub area - bottom 60px for selected state only (hide when dragging) */}
        {controlsLayout === "split-top-bottom" &&
          isSelected &&
          showProgressBar &&
          !isDragging && (
            <div
              ref={seekAreaRef}
              className="absolute cursor-pointer"
              style={{
                // Full width
                left: 0,
                right: 0,
                height: `${60 / zoomLevel}px`,
                bottom: 0,
                pointerEvents: "auto",
                zIndex: 10, // Below buttons
              }}
              onMouseDown={handleSeekAreaMouseDown}
              onClick={handleSeekAreaClick}
              onMouseMove={handleSeekAreaMouseMove}
              onMouseLeave={handleSeekAreaMouseLeave}
            />
          )}

        {/* YouTube-style Progress Bar - show when selected (hide when dragging) */}
        {controlsLayout === "split-top-bottom" &&
          isSelected &&
          showProgressBar &&
          !isDragging && (
            <div
              ref={progressBarRef}
              className="absolute pointer-events-none"
              style={{
                left: `${progressBarSide}px`,
                right: `${progressBarSide}px`,
                bottom: `${progressBarBottom}px`,
              }}
            >
              {/* Subtle black gradient bottom-up when hovering controls in selected mode */}
              {isSelected && isHovered && (
                <div
                  className="absolute"
                  style={{
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: `${Math.min(80 / zoomLevel, 100)}px`, // Clamped to max 100px
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%)",
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* Background track - dark gray */}
              <div
                className="absolute"
                style={{
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: `${3 / zoomLevel}px`, // Fixed 3px height
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                  borderRadius: 0,
                }}
              />

              {/* Preview bar (transparent white) - shows on hover */}
              {hoverTimelinePosition !== null && (
                <div
                  className="absolute left-0"
                  style={{
                    bottom: 0,
                    width: `${hoverTimelinePosition * 100}%`,
                    height: `${3 / zoomLevel}px`,
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                    borderRadius: 0,
                  }}
                />
              )}

              {/* Actual progress bar - pure white */}
              <div
                className="absolute left-0 bg-white"
                style={{
                  bottom: 0,
                  width: `${progress}%`,
                  height: `${3 / zoomLevel}px`,
                  borderRadius: 0,
                }}
              />

              {/* Time tooltip - shows current hover time (same style as time code) */}
              {hoverTimelinePosition !== null && (
                <div
                  className="absolute text-white font-medium"
                  style={{
                    left: `${hoverTimelinePosition * 100}%`,
                    bottom: `${10 / zoomLevel}px`,
                    transform: "translate(-50%, -100%)",
                    fontSize: `${fontSize}px`,
                    lineHeight: `${lineHeight}px`,
                    opacity: 0.9,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  {formatTime(hoverTimelinePosition * videoDuration, false)}
                </div>
              )}
            </div>
          )}
      </>
    </div>
  );
};
