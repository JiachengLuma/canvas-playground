/**
 * Header Toolbar Component
 * Main toolbar with dropdown menus for creating objects
 */

import { CanvasNativeType, ArtifactType } from "../../types";
import { ChevronDown, BookOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

interface HeaderToolbarProps {
  onAddCanvasNative: (type: CanvasNativeType) => void;
  onAddArtifact: (type: ArtifactType) => void;
  onAddPlaceholder: (type: ArtifactType) => void;
  onAddFrame: () => void;
  onAddAgentFrame: () => void;
  onOpenDocumentation?: () => void;
}

export function HeaderToolbar({
  onAddCanvasNative,
  onAddArtifact,
  onAddPlaceholder,
  onAddFrame,
  onAddAgentFrame,
  onOpenDocumentation,
}: HeaderToolbarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b">
      <div className="flex gap-2">
        {/* Canvas Objects Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              Canvas Objects
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => onAddCanvasNative("text")}>
              Text
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAddCanvasNative("shape")}>
              Shape
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAddCanvasNative("doodle")}>
              Doodle
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAddCanvasNative("sticky")}>
              Sticky Note
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAddCanvasNative("link")}>
              Link
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAddCanvasNative("pdf")}>
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onAddFrame}>Frame</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Generated Objects Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              Generated Objects
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => onAddArtifact("image")}>
              ✨ Image
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAddArtifact("video")}>
              ✨ Video
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAddArtifact("audio")}>
              ✨ Audio
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAddArtifact("document")}>
              ✨ Document
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Placeholders Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              Placeholders
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => onAddPlaceholder("image")}>
              Image Placeholder
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAddPlaceholder("video")}>
              Video Placeholder
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAddPlaceholder("audio")}>
              Audio Placeholder
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAddPlaceholder("document")}>
              Document Placeholder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Agent Frame Button */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onAddAgentFrame}
        >
          Agent Frame
        </Button>
      </div>

      {/* Right side - Documentation */}
      <div className="flex gap-2">
        {onOpenDocumentation && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onOpenDocumentation}
          >
            <BookOpen className="h-4 w-4" />
            Documentation
          </Button>
        )}
      </div>
    </div>
  );
}
