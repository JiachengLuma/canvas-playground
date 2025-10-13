import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";

interface GeneratingPlaceholderProps {
  prompt: string;
  progress?: number;
  onCancel: () => void;
}

export function GeneratingPlaceholder({
  prompt,
  progress,
  onCancel,
}: GeneratingPlaceholderProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 border border-gray-300 bg-white rounded">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />

      <div className="text-center space-y-3 max-w-md">
        <h3 className="font-medium text-gray-900">Generating...</h3>
        <p className="text-sm text-gray-600 italic">"{prompt}"</p>

        {typeof progress === "number" && (
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <Button variant="outline" size="sm" onClick={onCancel} className="mt-4">
          Cancel
        </Button>
      </div>
    </div>
  );
}
