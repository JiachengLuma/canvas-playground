import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, AudioLines } from "lucide-react";
import { motion } from "framer-motion";
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
}

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
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const seekAreaRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(duration);
  const [isProgressBarHovered, setIsProgressBarHovered] = useState(false);
  const [scrubPreviewTime, setScrubPreviewTime] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false); // Start unmuted (will auto-unmute on select if hasAudio)
  const animationFrameRef = useRef<number | null>(null);
  const wasPlayingBeforeSelection = useRef(false);
  const isSelecting = useRef(false);
  const justSelected = useRef(false);
  const hoverSeekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hoverSeekPosition, setHoverSeekPosition] = useState<number | null>(
    null
  );
  const [isHoveringSeekArea, setIsHoveringSeekArea] = useState(false);

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
      console.log("[VideoPlayer] Dragging - pausing video, wasPlaying:", wasPlayingBeforeDrag.current);
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

  // Format duration
  const formatTime = (seconds: number, includeUnit = true) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (includeUnit) {
      // For non-hover state, show compact format
      if (mins > 0) {
        return `${mins}m ${secs}s`;
      }
      return `${secs}s`;
    } else {
      // For hover state, always show 0:00 format
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
  };

  const durationText = formatTime(videoDuration);

  // Use scrub preview time if hovering over progress bar, otherwise use actual current time
  const displayTime =
    scrubPreviewTime !== null ? scrubPreviewTime : currentTime;
  const currentTimeFormatted = formatTime(Math.floor(displayTime), false);
  const totalTimeFormatted = formatTime(videoDuration, false);
  const timeDisplay =
    (isHovered || isSelected) && videoDuration > 0
      ? `${currentTimeFormatted} / ${totalTimeFormatted}`
      : durationText;
  const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;
  const previewProgress =
    scrubPreviewTime !== null && videoDuration > 0
      ? (scrubPreviewTime / videoDuration) * 100
      : hoverSeekPosition !== null && videoDuration > 0
      ? (hoverSeekPosition / videoDuration) * 100
      : progress;

  // Calculate scale-aware sizing
  // Base sizes are for normal scale
  const getScaledSize = (baseSize: number) => baseSize / zoomLevel;

  // Get size classification for the video
  const sizeState = getUISizeState(width, height, zoomLevel);

  // Determine what to show based on size classification
  const showProgressBar = sizeState !== "micro"; // Hide everything at micro
  const showIconAndTime = sizeState === "normal"; // Only show icon and time at normal size

  // Scale-aware sizing - made bigger at normal scale
  const pillInset = getScaledSize(10);
  const pillPaddingX = getScaledSize(8);
  const pillPaddingY = getScaledSize(4);
  const pillGap = getScaledSize(4);
  const pillRadius = getScaledSize(14);
  const pillBlur = getScaledSize(10);
  const iconSize = getScaledSize(14);
  const fontSize = getScaledSize(11);
  const lineHeight = getScaledSize(16);

  // Progress bar sizing - taller on hover for interactivity
  const progressBarHeight = getScaledSize(isProgressBarHovered ? 6 : 2);
  const progressBarRadius = getScaledSize(23);
  const progressBarBottom = getScaledSize(8);
  const progressBarSide = getScaledSize(13);
  const progressBarHoverPadding = getScaledSize(16); // Extra hover area (doubled for more generous interaction)

  // Adjust pill position when progress bar is hovered
  const adjustedPillBottom = isProgressBarHovered
    ? pillInset + getScaledSize(6) // Push up when progress bar is taller
    : pillInset;

  // Handle seek area hover for scrub preview (bottom 50% of video)
  const handleSeekAreaMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekAreaRef.current || !videoRef.current) return;

    const rect = seekAreaRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, hoverX / rect.width));
    const previewTime = percentage * videoDuration;

    if (isSelected) {
      // Selected mode: instant scrubbing
      setScrubPreviewTime(previewTime);
      setIsProgressBarHovered(true);
      videoRef.current.currentTime = previewTime;
      setCurrentTime(previewTime);
    } else {
      // Hover mode: scrub immediately but pause, then resume on dwell
      setIsHoveringSeekArea(true); // Mark that we're in seek area
      setHoverSeekPosition(previewTime);
      setIsProgressBarHovered(true);

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
          setHoverSeekPosition(null);
        }
      }, 500);
    }
  };

  // Handle seek area click for scrubbing
  const handleSeekAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Prevent triggering play/pause

    if (!videoRef.current || !seekAreaRef.current) return;

    const rect = seekAreaRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * videoDuration;

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setScrubPreviewTime(null); // Clear preview after clicking
    // Don't change playback state - keep playing if it was playing, paused if it was paused
  };

  // Clear scrub preview when mouse leaves seek area
  const handleSeekAreaMouseLeave = () => {
    setIsProgressBarHovered(false);
    setScrubPreviewTime(null);
    setHoverSeekPosition(null);
    setIsHoveringSeekArea(false); // No longer in seek area

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
        {/* Default duration badge - show when not hovered and not selected */}
        {!isHovered && !isSelected && showIconAndTime && (
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: `${pillInset}px`,
              bottom: `${pillInset}px`,
              paddingLeft: `${pillPaddingX}px`,
              paddingRight: `${pillPaddingX}px`,
              paddingTop: `${pillPaddingY}px`,
              paddingBottom: `${pillPaddingY}px`,
              borderRadius: `${pillRadius}px`,
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              backdropFilter: `blur(${pillBlur}px)`,
              WebkitBackdropFilter: `blur(${pillBlur}px)`,
              boxShadow:
                "0px 8px 24px -4px rgba(24, 39, 75, 0.04), 0px 4px 20px 0px rgba(0, 0, 0, 0.02)",
            }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
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
              {/* Play icon */}
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

              {/* Audio wave icon - only show if video has audio */}
              {hasAudio && (
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

              {/* Duration text (simple format like "5s") */}
              <div
                className="text-white font-medium"
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: `${lineHeight}px`,
                  opacity: 0.9,
                }}
              >
                {durationText}
              </div>
            </div>
          </motion.div>
        )}

        {/* Duration pill with play/pause - only show when selected and at normal size */}
        {isSelected && showIconAndTime && (
          <motion.div
            className="absolute"
            style={{
              left: `${pillInset}px`,
              bottom: `${adjustedPillBottom}px`,
              paddingLeft: `${pillPaddingX}px`,
              paddingRight: `${pillPaddingX}px`,
              paddingTop: `${pillPaddingY}px`,
              paddingBottom: `${pillPaddingY}px`,
              borderRadius: `${pillRadius}px`,
              backgroundColor: "transparent",
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
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
              {/* Play/Pause icon - clickable */}
              <div
                className="flex items-center justify-center text-white cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  fontSize: `${iconSize}px`,
                  lineHeight: `${iconSize}px`,
                  pointerEvents: "auto",
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
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                {timeDisplay}
              </div>
            </div>
          </motion.div>
        )}

        {/* Audio control button - only show when selected and has audio */}
        {isSelected && hasAudio && showIconAndTime && (
          <motion.div
            className="absolute pointer-events-auto"
            style={{
              right: `${pillInset}px`,
              bottom: `${adjustedPillBottom}px`,
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
          >
            <button
              onClick={handleMuteToggle}
              className="flex items-center justify-center text-white hover:opacity-80 transition-opacity"
              style={{
                padding: `${pillPaddingY}px ${pillPaddingX}px`,
                borderRadius: `${pillRadius}px`,
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
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
          </motion.div>
        )}

        {/* Large seek area - bottom 40% of video, excluding control buttons */}
        {showProgressBar && (
          <div
            ref={seekAreaRef}
            className="absolute cursor-pointer"
            style={{
              // Start after the play pill, end before the mute button
              left: showIconAndTime
                ? `${pillInset + (iconSize + pillPaddingX * 2) + pillGap}px`
                : 0,
              right:
                hasAudio && showIconAndTime
                  ? `${pillInset + (iconSize + pillPaddingX * 2) + pillGap}px`
                  : 0,
              bottom: 0,
              height: "40%",
            }}
            onClick={handleSeekAreaClick}
            onMouseMove={handleSeekAreaMouseMove}
            onMouseLeave={handleSeekAreaMouseLeave}
          />
        )}

        {/* Progress bar - show when hovered or selected, but not at micro size */}
        {(isHovered || isSelected) && showProgressBar && (
          <motion.div
            ref={progressBarRef}
            className="absolute pointer-events-none"
            style={{
              left: `${progressBarSide}px`,
              right: `${progressBarSide}px`,
              bottom: `${progressBarBottom}px`,
            }}
            initial={{ opacity: 0, scaleY: 0.5 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.5 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
          >
            {/* Background bar - anchored to bottom, grows upward */}
            <motion.div
              className="absolute"
              style={{
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.56)",
                borderRadius: `${progressBarRadius}px`,
                boxShadow: "0px 2px 10px 0px rgba(0, 0, 0, 0.1)",
              }}
              initial={{ height: progressBarHeight }}
              animate={{ height: progressBarHeight }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.5,
              }}
            />

            {/* Progress bar - shows current or preview position */}
            <motion.div
              className="absolute left-0 bg-white"
              style={{
                bottom: 0,
                width: `${previewProgress}%`,
                borderRadius: `${progressBarRadius}px`,
                boxShadow: "0px 2px 10px 0px rgba(0, 0, 0, 0.1)",
                opacity: scrubPreviewTime !== null ? 0.7 : 1,
                transition:
                  scrubPreviewTime !== null
                    ? "opacity 0.15s ease-in-out"
                    : "none",
              }}
              initial={{ height: progressBarHeight }}
              animate={{ height: progressBarHeight }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.5,
              }}
            />

            {/* Actual playback progress indicator (thin line when scrubbing or hover seeking) */}
            {(scrubPreviewTime !== null || hoverSeekPosition !== null) && (
              <div
                className="absolute left-0 bg-white"
                style={{
                  bottom: 0,
                  width: `${progress}%`,
                  height: `${progressBarHeight}px`,
                  borderRadius: `${progressBarRadius}px`,
                  opacity: 0.3,
                }}
              />
            )}
          </motion.div>
        )}
      </>
    </div>
  );
};
