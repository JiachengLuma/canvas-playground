import { useState } from "react";
import { Button } from "../ui/button";
import { Sparkles } from "lucide-react";

interface PrePlaceholderProps {
  objectType: string;
  onGenerate: (prompt: string) => void;
  onCancel: () => void;
}

export function PrePlaceholder({
  objectType,
  onGenerate,
  onCancel,
}: PrePlaceholderProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt.trim());
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 bg-gray-50 rounded">
      <Sparkles className="w-12 h-12 text-gray-400 mb-4" />

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Describe the ${objectType} you want to generate...`}
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            type="submit"
            disabled={!prompt.trim()}
            className="min-w-[100px]"
          >
            Generate
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
