/**
 * Agent Frame Header
 * Black pill with colorful orb and shimmer animation during agent frame creation
 * Replaces the standard frame header when agent is creating
 */

import { motion } from "motion/react";

interface AgentFrameHeaderProps {
  isCreating: boolean;
  frameName: string;
  zoomLevel: number;
  frameWidth: number;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export function AgentFrameHeader({
  isCreating,
  frameName,
  zoomLevel,
  frameWidth,
  onMouseDown,
}: AgentFrameHeaderProps) {
  const headerHeight = 20 / zoomLevel;
  const fontSize = 12 / zoomLevel;
  const orbSize = 8 / zoomLevel;
  const paddingX = 6 / zoomLevel;
  const gap = 4 / zoomLevel;

  return (
    <motion.div
      className="absolute flex items-center cursor-move overflow-hidden"
      style={{
        top: -headerHeight,
        left: 0,
        height: headerHeight,
        backgroundColor: isCreating ? "#000000" : "transparent",
        borderRadius: isCreating ? `${26 / zoomLevel}px` : 0,
        paddingLeft: paddingX,
        paddingRight: paddingX,
        gap: `${gap}px`,
        boxShadow: isCreating ? "0px 2px 2px 0px rgba(0,0,0,0.25)" : "none",
        zIndex: 50,
        pointerEvents: "auto",
        maxWidth: frameWidth,
      }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
      }}
      transition={{
        opacity: { duration: 0.3 },
      }}
      onMouseDown={onMouseDown}
    >
      {isCreating && (
        <>
          {/* Shimmer Sweep Animation - enlarged orb sweep */}
          <motion.div
            key="sweep-animation" // Prevent remounting on prop changes
            className="absolute pointer-events-none overflow-visible"
            style={{
              left: -200 / zoomLevel,
              top: -67 / zoomLevel,
              width: 198 / zoomLevel,
              height: 198 / zoomLevel,
              mixBlendMode: "screen",
              opacity: 0.85,
              zIndex: 0,
            }}
            animate={{
              x: [0, 600 / zoomLevel], // Shorter distance to reduce dead time
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 0,
            }}
          >
            {/* Enlarged glowing orb */}
            <motion.div
              key="glowing-orb" // Prevent remounting on prop changes
              className="rounded-full"
              style={{
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
                backgroundSize: "400% 400%",
                filter: `blur(${35 / zoomLevel}px)`,
              }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </motion.div>

          {/* Animated Colorful Orb */}
          <motion.div
            key="colorful-orb" // Prevent remounting on prop changes
            className="rounded-full flex-shrink-0 relative"
            style={{
              width: orbSize,
              height: orbSize,
              background:
                "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
              backgroundSize: "400% 400%",
              boxShadow: `0px ${2 / zoomLevel}px ${
                2 / zoomLevel
              }px 0px rgba(0,0,0,0.25)`,
              zIndex: 1,
            }}
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </>
      )}

      {/* Frame Name Text */}
      <span
        className="whitespace-nowrap overflow-hidden text-ellipsis relative"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: `${16 / zoomLevel}px`,
          color: isCreating ? "#ffffff" : "rgba(0, 0, 0, 0.7)",
          fontFamily: "Graphik, sans-serif",
          fontWeight: isCreating ? 500 : 400,
          zIndex: 1,
          minWidth: 0,
          flexShrink: 1,
        }}
      >
        {frameName}
      </span>
    </motion.div>
  );
}
