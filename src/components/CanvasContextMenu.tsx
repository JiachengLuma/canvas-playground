import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  ImageIcon,
  Video,
  Music,
  Square,
  Upload,
  MessageSquare,
  ChevronRight,
  Clipboard,
} from "lucide-react";

interface CanvasContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onNewImage: () => void;
  onNewVideo: () => void;
  onNewAudio: () => void;
  onNewFrame: () => void;
  onUploadMedia: () => void;
  onCursorChat: () => void;
}

export function CanvasContextMenu({
  isOpen,
  x,
  y,
  onClose,
  onNewImage,
  onNewVideo,
  onNewAudio,
  onNewFrame,
  onUploadMedia,
  onCursorChat,
}: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState("");

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Close on escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
    setSearchValue("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          style={{
            position: "fixed",
            left: x,
            top: y,
            zIndex: 10000,
          }}
          className="flex flex-col gap-2.5"
        >
          {/* Quick Composer */}
          <div className="bg-[#f6f6f6] border border-[rgba(0,0,0,0.1)] rounded-[22px] px-4 py-1 shadow-[0px_2px_10px_0px_rgba(0,0,0,0.1)]">
            <input
              type="text"
              placeholder="Start typing…"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-[227px] h-[36px] bg-transparent outline-none text-[12px] text-[rgba(0,0,0,0.7)] placeholder:text-[rgba(0,0,0,0.7)]"
              autoFocus
            />
          </div>

          {/* Menu Items */}
          <div className="w-[253px] bg-[#f6f6f6] border border-[rgba(0,0,0,0.1)] rounded-[30px] p-2 shadow-[0px_2px_10px_0px_rgba(0,0,0,0.1)]">
            {/* New Image */}
            <MenuItem
              icon={<ImageIcon className="w-3 h-3" />}
              label="New Image"
              rightIcon={<ChevronRight className="w-3 h-3" />}
              onClick={() => handleAction(onNewImage)}
            />

            {/* New Video */}
            <MenuItem
              icon={<Video className="w-3 h-3" />}
              label="New Video"
              rightIcon={<ChevronRight className="w-3 h-3" />}
              onClick={() => handleAction(onNewVideo)}
            />

            {/* New Audio */}
            <MenuItem
              icon={<Music className="w-3 h-3" />}
              label="New Audio"
              rightIcon={<ChevronRight className="w-3 h-3" />}
              onClick={() => handleAction(onNewAudio)}
            />

            {/* New Frame */}
            <MenuItem
              icon={<Square className="w-3 h-3" />}
              label="New Frame"
              shortcut="F"
              onClick={() => handleAction(onNewFrame)}
            />

            {/* Divider */}
            <div className="h-[1px] bg-[rgba(0,0,0,0.1)] my-1" />

            {/* Paste - Disabled */}
            <MenuItem
              icon={<Clipboard className="w-3 h-3" />}
              label="Paste"
              shortcut="⌘V"
              disabled
            />

            {/* Upload Media */}
            <MenuItem
              icon={<Upload className="w-3 h-3" />}
              label="Upload Media"
              shortcut="⌘U"
              onClick={() => handleAction(onUploadMedia)}
            />

            {/* Divider */}
            <div className="h-[1px] bg-[rgba(0,0,0,0.1)] my-1" />

            {/* Cursor Chat */}
            <MenuItem
              icon={<MessageSquare className="w-3 h-3" />}
              label="Cursor Chat"
              shortcut="/"
              onClick={() => handleAction(onCursorChat)}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  rightIcon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  onClick?: () => void;
}

function MenuItem({
  icon,
  label,
  rightIcon,
  shortcut,
  disabled = false,
  onClick,
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group/item
        w-full flex items-center justify-between h-8 px-3 py-3 rounded-2xl
        transition-all duration-150
        ${
          disabled
            ? "opacity-30 cursor-not-allowed"
            : "hover:bg-black hover:rounded-[56px] cursor-pointer"
        }
      `}
    >
      <div className="flex items-center gap-2.5 text-[12px] text-[rgba(0,0,0,0.8)] group-hover/item:text-white transition-colors duration-150">
        <div className="flex items-center justify-center w-3 h-3">{icon}</div>
        <span className="font-['Graphik',_sans-serif] leading-[16px]">
          {label}
        </span>
      </div>

      <div className="flex items-center text-[12px] text-[rgba(0,0,0,0.8)] group-hover/item:text-white transition-colors duration-150">
        {rightIcon && (
          <div className="flex items-center justify-center w-3 h-3">
            {rightIcon}
          </div>
        )}
        {shortcut && (
          <div className="flex items-center justify-center min-w-[30px] h-[14px] text-[rgba(0,0,0,0.7)] group-hover/item:text-white font-['Graphik',_sans-serif] leading-[16px]">
            {shortcut}
          </div>
        )}
      </div>
    </button>
  );
}
