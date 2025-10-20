/**
 * Header Toolbar Component
 * Main toolbar with dropdown menus for creating objects
 */

import { CanvasNativeType, ArtifactType } from "../../types";
import { ChevronDown, BookOpen, Palette, Play, Settings } from "lucide-react";
import { ColorTheme } from "../../hooks/useColorTheme";
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
  colorTheme?: ColorTheme;
  onToggleColorTheme?: () => void;
  videoPauseOnSelect?: boolean;
  onToggleVideoPauseOnSelect?: () => void;
  selectionPaddingMode?: "flush" | "responsive";
  onToggleSelectionPadding?: () => void;
  frameLabelPosition?: "background" | "drag-handle";
  onToggleFrameLabelPosition?: () => void;
}

export function HeaderToolbar({
  onAddCanvasNative,
  onAddArtifact,
  onAddPlaceholder,
  onAddFrame,
  onAddAgentFrame,
  onOpenDocumentation,
  colorTheme = "black",
  onToggleColorTheme,
  videoPauseOnSelect = false,
  onToggleVideoPauseOnSelect,
  selectionPaddingMode = "flush",
  onToggleSelectionPadding,
  frameLabelPosition = "background",
  onToggleFrameLabelPosition,
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

      {/* Right side - Settings & Documentation */}
      <div className="flex gap-2">
        {/* Debug Options Dropdown */}
        {(onToggleVideoPauseOnSelect ||
          onToggleSelectionPadding ||
          onToggleColorTheme ||
          onToggleFrameLabelPosition) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Debug
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              {onToggleColorTheme && (
                <DropdownMenuItem
                  onSelect={onToggleColorTheme}
                  className="flex items-start gap-3 py-3"
                >
                  <Palette className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium flex items-center gap-2">
                      Color Theme
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {colorTheme === "blue" ? "Blue" : "Black"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Switch selection & hover colors between blue and black
                      themes
                    </div>
                  </div>
                </DropdownMenuItem>
              )}
              {onToggleVideoPauseOnSelect && (
                <DropdownMenuItem
                  onSelect={onToggleVideoPauseOnSelect}
                  className="flex items-start gap-3 py-3"
                >
                  <Play className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium flex items-center gap-2">
                      Video on Select
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {videoPauseOnSelect ? "Pause" : "Keep Playing"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Toggle whether videos pause or continue playing when
                      selected
                    </div>
                  </div>
                </DropdownMenuItem>
              )}
              {onToggleSelectionPadding && (
                <DropdownMenuItem
                  onSelect={onToggleSelectionPadding}
                  className="flex items-start gap-3 py-3"
                >
                  <div className="h-4 w-4 mt-0.5 flex-shrink-0 border-2 border-current rounded" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium flex items-center gap-2">
                      Selection Padding
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {selectionPaddingMode === "flush"
                          ? "Flush (0px)"
                          : "Responsive"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Toggle selection bounds padding: flush (0px) or responsive
                      (auto)
                    </div>
                  </div>
                </DropdownMenuItem>
              )}
              {onToggleFrameLabelPosition && (
                <DropdownMenuItem
                  onSelect={onToggleFrameLabelPosition}
                  className="flex items-start gap-3 py-3"
                >
                  <div className="h-4 w-4 mt-0.5 flex-shrink-0 border-2 border-current rounded-sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium flex items-center gap-2">
                      Label Style
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {frameLabelPosition === "background"
                          ? "Color Plate"
                          : "Color Circle"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Toggle between colored background plate (left) or colored
                      circle dot (top-right corner)
                    </div>
                  </div>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Documentation Button */}
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
