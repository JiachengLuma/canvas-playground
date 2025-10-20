import { useState, useRef } from "react";

interface StickyNoteProps {
  noteColor: string;
  noteTitle?: string;
  noteAuthor?: string;
  content?: string;
  createdAt?: number;
  isSelected: boolean;
  onContentUpdate?: (content: string) => void;
  onTitleUpdate?: (title: string) => void;
  onColorChange?: () => void;
}

export function StickyNote({
  noteColor,
  noteTitle,
  noteAuthor,
  content,
  createdAt,
  isSelected,
  onContentUpdate,
  onTitleUpdate,
  onColorChange,
}: StickyNoteProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [isHoveringDot, setIsHoveringDot] = useState(false);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      className="w-full h-full p-4 flex flex-col shadow-md relative"
      style={{
        backgroundColor: noteColor,
        borderRadius: "5px",
      }}
      onDoubleClick={(e) => {
        if (isSelected && onContentUpdate && !isEditingTitle) {
          e.stopPropagation();
          setIsEditingContent(true);
          // Focus after state updates
          setTimeout(() => {
            if (contentRef.current) {
              contentRef.current.focus();
              // Select all text
              const range = document.createRange();
              range.selectNodeContents(contentRef.current);
              const sel = window.getSelection();
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          }, 0);
        }
      }}
      onMouseDown={(e) => {
        if (isEditingTitle || isEditingContent) {
          e.stopPropagation();
          return;
        }
      }}
      onMouseEnter={() => setIsHoveringDot(true)}
      onMouseLeave={() => setIsHoveringDot(false)}
    >
      {/* Color dot - top right corner (shows on hover) */}
      <button
        className="absolute top-4 right-4 w-6 h-6 rounded-full transition-all z-10"
        style={{
          backgroundColor: noteColor,
          filter: "brightness(1.15)", // Slightly brighter than note background
          opacity: isHoveringDot ? 1 : 0,
          transform: isHoveringDot ? "scale(1.1)" : "scale(1)",
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (onColorChange) {
            onColorChange();
          }
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        title="Change color"
      />

      {/* Title - editable on double click */}
      {noteTitle !== undefined && (
        <div
          ref={titleRef}
          contentEditable={isEditingTitle}
          suppressContentEditableWarning
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (isSelected && onTitleUpdate) {
              setIsEditingTitle(true);
              setTimeout(() => {
                if (titleRef.current) {
                  titleRef.current.focus();
                  const range = document.createRange();
                  range.selectNodeContents(titleRef.current);
                  const sel = window.getSelection();
                  sel?.removeAllRanges();
                  sel?.addRange(range);
                }
              }, 0);
            }
          }}
          onBlur={(e) => {
            if (isEditingTitle && onTitleUpdate) {
              const newTitle = e.currentTarget.textContent || "";
              if (newTitle !== noteTitle) {
                onTitleUpdate(newTitle);
              }
              setIsEditingTitle(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              titleRef.current?.blur();
            } else if (e.key === "Escape") {
              e.preventDefault();
              if (titleRef.current) {
                titleRef.current.textContent = noteTitle;
              }
              setIsEditingTitle(false);
            }
          }}
          className={`font-semibold text-gray-900 mb-1 outline-none ${
            isEditingTitle ? "cursor-text" : "cursor-move"
          }`}
          style={{
            minHeight: "1.5em",
            whiteSpace: "pre-wrap",
          }}
        >
          {noteTitle}
        </div>
      )}

      {/* Author with timestamp */}
      {noteAuthor && (
        <p className="text-xs text-gray-600 mb-3">
          {new Date(createdAt || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          · {noteAuthor}
        </p>
      )}

      {/* Content - editable on double click */}
      <div
        ref={contentRef}
        contentEditable={isEditingContent}
        suppressContentEditableWarning
        onBlur={(e) => {
          if (isEditingContent && onContentUpdate) {
            const newContent = e.currentTarget.textContent || "";
            onContentUpdate(newContent);
            setIsEditingContent(false);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            if (contentRef.current) {
              contentRef.current.textContent = content || "";
            }
            setIsEditingContent(false);
          }
          // Allow Enter for multi-line content
        }}
        className={`text-sm text-gray-700 break-words outline-none flex-1 ${
          isEditingContent ? "cursor-text" : "cursor-move"
        }`}
        style={{
          minHeight: "2em",
          whiteSpace: "pre-wrap",
          overflowY: "auto",
        }}
      >
        {content || ""}
      </div>
    </div>
  );
}
