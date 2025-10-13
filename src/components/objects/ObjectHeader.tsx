import { useState, useRef, useEffect } from "react";
import {
  Image,
  Video,
  Music,
  FileText,
  Type,
  Square,
  Pen,
  StickyNote,
  Link,
  File,
  Frame,
  Loader2,
  AlertCircle,
  Circle,
} from "lucide-react";
import { ObjectType, ObjectState, ObjectMetadata } from "../../types";

interface ObjectHeaderProps {
  name: string;
  type: ObjectType;
  state: ObjectState;
  metadata?: ObjectMetadata;
  onNameChange: (newName: string) => void;
  onDragStart?: (e: React.MouseEvent) => void;
}

const TYPE_ICONS: Record<ObjectType, typeof Image> = {
  // Artifacts
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  // Canvas natives
  text: Type,
  shape: Square,
  doodle: Pen,
  sticky: StickyNote,
  link: Link,
  pdf: File,
  // Container
  frame: Frame,
};

const STATE_INDICATORS = {
  idle: { icon: Circle, color: "text-green-500", label: "Ready" },
  "pre-placeholder": {
    icon: Circle,
    color: "text-gray-400",
    label: "Waiting for input",
  },
  generating: {
    icon: Loader2,
    color: "text-blue-500",
    label: "Generating...",
    spin: true,
  },
  error: { icon: AlertCircle, color: "text-red-500", label: "Error" },
};

export function ObjectHeader({
  name,
  type,
  state,
  metadata,
  onNameChange,
  onDragStart,
}: ObjectHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  const TypeIcon = TYPE_ICONS[type];
  const stateIndicator = STATE_INDICATORS[state];
  const StatusIcon = stateIndicator.icon;

  // Generate "created by" text
  const getCreatedByText = () => {
    if (!metadata?.createdBy) return null;

    const { type, name } = metadata.createdBy;

    if (type === "model") {
      return name || "AI";
    } else if (type === "uploaded") {
      return "Uploaded";
    } else if (type === "user" && name) {
      return `@${name}`;
    }

    return null;
  };

  const createdByText = getCreatedByText();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditing) {
      e.stopPropagation();
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (editValue.trim()) {
      onNameChange(editValue.trim());
    } else {
      setEditValue(name); // Revert if empty
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(name);
      setIsEditing(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditing && onDragStart) {
      e.stopPropagation();
      onDragStart(e);
    }
  };

  return (
    <div
      className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200 cursor-move select-none"
      onMouseDown={handleMouseDown}
    >
      {/* Left: Type Icon + Name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <TypeIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="flex-1 px-1 py-0.5 text-sm font-medium border border-blue-500 rounded outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <button
            onClick={handleClick}
            className="flex-1 text-left text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
          >
            {name}
          </button>
        )}
      </div>

      {/* Right: Created By Info (with truncation, right-aligned) */}
      {createdByText ? (
        <div className="flex items-center gap-2 min-w-0 ml-2">
          <span
            className="text-xs text-gray-500"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textAlign: "right",
            }}
          >
            {createdByText}
          </span>
        </div>
      ) : (
        /* Show status indicator if no created by info */
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusIcon
            className={`w-3.5 h-3.5 ${stateIndicator.color} ${
              stateIndicator.spin ? "animate-spin" : ""
            }`}
          />
          {state !== "idle" && (
            <span className={`text-xs ${stateIndicator.color}`}>
              {stateIndicator.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
