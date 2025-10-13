/**
 * Artifact Buttons Component
 * Buttons for creating AI-generated artifacts (Image, Video, etc.)
 */

import { Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { ArtifactType } from "../../types";

interface ArtifactButtonsProps {
  onAdd: (type: ArtifactType) => void;
}

export function ArtifactButtons({ onAdd }: ArtifactButtonsProps) {
  const artifactTypes: { type: ArtifactType; label: string }[] = [
    { type: "image", label: "Image" },
    { type: "video", label: "Video" },
    { type: "audio", label: "Audio" },
    { type: "document", label: "Doc" },
  ];

  return (
    <>
      {artifactTypes.map(({ type, label }) => (
        <Button
          key={type}
          variant="outline"
          size="sm"
          onClick={() => onAdd(type)}
          className="border-blue-200 hover:border-blue-300"
        >
          <Sparkles className="w-4 h-4 mr-1" />
          {label}
        </Button>
      ))}
    </>
  );
}
