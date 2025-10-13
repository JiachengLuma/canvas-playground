import { AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

interface ErrorStateProps {
  errorMessage: string;
  prompt?: string;
  onRetry: () => void;
  onEditPrompt: () => void;
  onDelete: () => void;
}

export function ErrorState({
  errorMessage,
  prompt,
  onRetry,
  onEditPrompt,
  onDelete,
}: ErrorStateProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 border-2 border-red-400 bg-red-50 rounded">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />

      <div className="text-center space-y-3 max-w-md">
        <h3 className="font-medium text-red-900">Generation Failed</h3>
        <p className="text-sm text-red-700">{errorMessage}</p>

        {prompt && (
          <p className="text-xs text-gray-600 italic mt-2">
            Prompt: "{prompt}"
          </p>
        )}

        <div className="flex gap-2 justify-center mt-6">
          <Button onClick={onRetry} size="sm">
            Retry
          </Button>
          <Button onClick={onEditPrompt} variant="outline" size="sm">
            Edit Prompt
          </Button>
          <Button onClick={onDelete} variant="destructive" size="sm">
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
