/**
 * Placeholder Buttons Component
 * Buttons for creating loading placeholders that simulate artifact generation
 */

import { Image, Video, Music, FileText } from "lucide-react";
import { Button } from "../ui/button";
import { ArtifactType } from "../../types";

interface PlaceholderButtonsProps {
  onAdd: (type: ArtifactType) => void;
}

export function PlaceholderButtons({ onAdd }: PlaceholderButtonsProps) {
  const placeholderTypes: {
    type: ArtifactType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      type: "image",
      label: "Image Placeholder",
      icon: <Image className="w-4 h-4 mr-1" />,
    },
    {
      type: "video",
      label: "Video Placeholder",
      icon: <Video className="w-4 h-4 mr-1" />,
    },
    {
      type: "audio",
      label: "Audio Placeholder",
      icon: <Music className="w-4 h-4 mr-1" />,
    },
    {
      type: "document",
      label: "Doc Placeholder",
      icon: <FileText className="w-4 h-4 mr-1" />,
    },
  ];

  return (
    <>
      {placeholderTypes.map(({ type, label, icon }) => (
        <Button
          key={type}
          variant="outline"
          size="sm"
          onClick={() => onAdd(type)}
          className="border-gray-200 hover:border-gray-300 bg-gray-50"
        >
          {icon}
          {label}
        </Button>
      ))}
    </>
  );
}
