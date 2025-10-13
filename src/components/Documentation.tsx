/**
 * Documentation Component
 * Comprehensive documentation for the canvas playground with live examples
 * Figma-style left-right split layout
 */

import { useState } from "react";
import { X, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { MiniCanvas } from "./MiniCanvas";
import {
  getDocumentationSections,
  DocSection,
  DocSubsection,
} from "./DocumentationContent";

interface DocumentationProps {
  onClose: () => void;
  onShowExample?: (exampleId: string) => void;
}

export type { DocSection, DocSubsection };

export function Documentation({ onClose, onShowExample }: DocumentationProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["getting-started"])
  );
  const [activeSubsection, setActiveSubsection] = useState<string | null>(
    "overview"
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleSubsectionClick = (subsectionId: string) => {
    setActiveSubsection(subsectionId);
    if (onShowExample) {
      onShowExample(subsectionId);
    }
  };

  const sections = getDocumentationSections();

  const activeSection = sections.find((section) =>
    section.subsections.some((sub) => sub.id === activeSubsection)
  );
  const activeSubsectionData = activeSection?.subsections.find(
    (sub) => sub.id === activeSubsection
  );

  return (
    <div className="fixed inset-0 z-[100] bg-white flex">
      {/* Left Sidebar - Navigation */}
      <div className="w-72 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Documentation</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Tree */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {sections.map((section) => (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium hover:bg-gray-100 rounded transition-colors"
                >
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span>{section.title}</span>
                </button>

                {expandedSections.has(section.id) && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {section.subsections.map((subsection) => (
                      <button
                        key={subsection.id}
                        onClick={() => handleSubsectionClick(subsection.id)}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${
                          activeSubsection === subsection.id
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "hover:bg-gray-50 text-gray-600"
                        }`}
                      >
                        {subsection.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Content Area - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Documentation Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeSubsectionData ? (
            <div className="max-w-3xl">{activeSubsectionData.content}</div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a topic from the left sidebar
            </div>
          )}
        </div>

        {/* Live Canvas Preview */}
        <div className="w-1/2 border-l border-gray-200 bg-[#DFDFDF] overflow-hidden">
          <MiniCanvas subsectionId={activeSubsection} />
        </div>
      </div>
    </div>
  );
}
