import React, { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
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
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  isSelected,
  isHovered,
  zoomLevel,
  width,
  height,
  duration = 0,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const seekAreaRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(duration);
  const [isProgressBarHovered, setIsProgressBarHovered] = useState(false);
  const [scrubPreviewTime, setScrubPreviewTime] = useState<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wasPlayingBeforeSelection = useRef(false);
  const isSelecting = useRef(false);
  const justSelected = useRef(false);

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

  // Auto-play on hover (when not selected)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isSelected) return;

    if (isHovered) {
      console.log("[VideoPlayer] Hover - playing video");
      video.play().catch(() => {
        // Ignore play errors
      });
      wasPlayingBeforeSelection.current = true;
    } else {
      // Pause on hover leave ONLY if not in process of selecting
      if (!isSelecting.current) {
        console.log("[VideoPlayer] Hover leave - pausing video");
        video.pause();
        wasPlayingBeforeSelection.current = false;
      } else {
        console.log("[VideoPlayer] Hover leave - BLOCKED by isSelecting flag");
      }
    }
  }, [isHovered, isSelected]);

  // Keep playing when selected
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isSelected) {
      console.log(
        "[VideoPlayer] Selected! wasPlayingBeforeSelection:",
        wasPlayingBeforeSelection.current
      );
      console.log("[VideoPlayer] Video paused state:", video.paused);

      // Set justSelected flag to ignore the first click event
      justSelected.current = true;

      // If was playing before selection, aggressively keep it playing
      if (wasPlayingBeforeSelection.current) {
        console.log("[VideoPlayer] Forcing video to play...");
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
  }, [isSelected]);

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
    if (!seekAreaRef.current || !isSelected || !videoRef.current) return;

    const rect = seekAreaRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, hoverX / rect.width));
    const previewTime = percentage * videoDuration;

    setScrubPreviewTime(previewTime);
    setIsProgressBarHovered(true);

    // Actually seek the video to the preview position
    videoRef.current.currentTime = previewTime;
    setCurrentTime(previewTime);
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

  // Handle mouse down - set flag BEFORE hover state changes
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || isSelected) return;

    // Set selecting flag immediately on mouse down, before hover changes
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
  };

  // Handle video click to select or play/pause
  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;

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
      onClick={handleVideoClick}
      style={{ cursor: isSelected ? "pointer" : "default" }}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        loop
        muted
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

        {/* Large seek area - bottom 50% of video (only when selected) */}
        {isSelected && showProgressBar && (
          <div
            ref={seekAreaRef}
            className="absolute cursor-pointer"
            style={{
              left: 0,
              right: 0,
              bottom: 0,
              height: "50%",
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

            {/* Actual playback progress indicator (thin line when scrubbing) */}
            {scrubPreviewTime !== null && (
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
