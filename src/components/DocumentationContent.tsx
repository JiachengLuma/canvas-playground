/**
 * Documentation Content
 * Extracted from actual implementation to ensure accuracy
 */

import React from "react";

export interface DocSection {
  id: string;
  title: string;
  subsections: DocSubsection[];
}

export interface DocSubsection {
  id: string;
  title: string;
  content: React.ReactNode;
}

export const getDocumentationSections = (): DocSection[] => [
  {
    id: "getting-started",
    title: "Getting Started",
    subsections: [
      {
        id: "overview",
        title: "Overview",
        content: (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Canvas Playground</h2>
            <p className="text-gray-600">
              An infinite canvas for creating, organizing, and interacting with
              various object types including AI-generated artifacts, canvas
              natives, and organizational frames.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Key Features</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                <li>Infinite panning and zooming canvas</li>
                <li>Multiple object types with unique behaviors</li>
                <li>Smart hover-based toolbar with smooth animations</li>
                <li>
                  Custom video player with hover controls and progress bar
                </li>
                <li>Advanced frame system with auto-layout</li>
                <li>Scale-aware UI that adapts to zoom levels</li>
                <li>Color tagging for all objects</li>
                <li>Keyboard shortcuts for productivity</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: "navigation",
        title: "Navigation",
        content: (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Canvas Navigation</h2>

            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Panning</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Two-finger scroll
                    </kbd>{" "}
                    - Trackpad pan
                  </li>
                  <li>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Mouse wheel
                    </kbd>{" "}
                    - Pan vertically/horizontally
                  </li>
                  <li>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Alt + Click + Drag
                    </kbd>{" "}
                    - Drag to pan
                  </li>
                  <li>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Middle Click + Drag
                    </kbd>{" "}
                    - Drag to pan
                  </li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Zooming</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Cmd/Ctrl + Scroll
                    </kbd>{" "}
                    - Zoom at cursor position
                  </li>
                  <li>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Pinch
                    </kbd>{" "}
                    - Trackpad pinch-to-zoom
                  </li>
                  <li>Zoom controls in bottom-right corner</li>
                  <li>Zoom range: 10% to 300%</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Zoom focuses on cursor position - the
                  point under your cursor stays in place while zooming.
                </p>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "selection",
    title: "Selection & Interaction",
    subsections: [
      {
        id: "selection-modes",
        title: "Selection",
        content: (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Selection System</h2>

            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Single Selection</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Click any object to select it. Selected objects show:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Blue selection outline (2px)</li>
                  <li>
                    Resize handles (for resizable objects: PDFs, artifacts,
                    frames)
                  </li>
                  <li>Hover toolbar (for artifacts, PDFs, frames)</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Multi-Selection</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Select multiple objects using:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Shift/Cmd + Click
                    </kbd>{" "}
                    - Add to selection
                  </li>
                  <li>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Click + Drag on canvas
                    </kbd>{" "}
                    - Box selection
                  </li>
                </ul>
                <p className="text-sm text-gray-600 mt-2">
                  Multi-selected objects show a multi-select toolbar with frame,
                  delete, duplicate, tag, and AI prompt actions.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Box Selection</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Draw a selection box on empty canvas:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Click and drag on empty canvas</li>
                  <li>Objects inside the box are highlighted</li>
                  <li>Release to complete selection</li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "hover-behavior",
        title: "Hover Toolbar",
        content: (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Smart Hover Toolbar</h2>

            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Which Objects Have Toolbars?
                </h3>
                <p className="text-sm text-blue-800 mb-2">
                  Hover toolbars only appear for:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                  <li>
                    <strong>Artifacts:</strong> Image, Video, Audio, Document
                  </li>
                  <li>
                    <strong>Files:</strong> PDF
                  </li>
                  <li>
                    <strong>Organization:</strong> Frames
                  </li>
                </ul>
                <p className="text-sm text-blue-800 mt-2">
                  <strong>No toolbar for:</strong> Text, Shape, Doodle, Sticky,
                  Link
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Timing Behavior</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>
                    <strong>First hover:</strong> 1000ms (1 second) dwell time
                    before toolbar appears
                  </li>
                  <li>
                    <strong>Subsequent hovers:</strong> Instant appearance once
                    system is activated
                  </li>
                  <li>
                    <strong>Grace period:</strong> 150ms to move cursor from
                    object to toolbar
                  </li>
                  <li>
                    <strong>System reset:</strong> After 1000ms outside any
                    hover, system resets to 1 second dwell
                  </li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Compact Mode</h3>
                <p className="text-sm text-gray-600 mb-2">
                  When an object is narrower than 60% of the full toolbar width,
                  a compact toolbar appears:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Shows "Tab | ..." button instead of full toolbar</li>
                  <li>
                    Clicking the compact button zooms the object to fit in view
                  </li>
                  <li>
                    After zoom, full toolbar becomes visible at proper size
                  </li>
                  <li>
                    Prevents toolbar from being wider than the object itself
                  </li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Smooth Animations</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Toolbar position animates smoothly during zoom transitions:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>
                    Spring-based animation when zooming in/out on same object
                  </li>
                  <li>Toolbar glides smoothly to new position</li>
                  <li>
                    Object header fade-in/out accompanied by position animation
                  </li>
                  <li>Instant snap when switching between different objects</li>
                  <li>No animation during drag or resize operations</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Zoom Threshold</h3>
                <p className="text-sm text-gray-600">
                  Hover toolbar only appears when zoom level is{" "}
                  <strong>20% or above</strong>. Below 20%, toolbar is hidden on
                  hover (but still appears when object is selected).
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Toolbar automatically hides during drag
                  operations and box selections for cleaner interaction.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "drag-behavior",
        title: "Dragging",
        content: (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Dragging Objects</h2>

            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Normal Drag</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Click and drag any object to move it</li>
                  <li>3px movement threshold prevents accidental drags</li>
                  <li>Multi-selected objects move together</li>
                  <li>Toolbar and decorations hide during drag</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">
                  Option + Drag to Duplicate
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Hold{" "}
                  <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                    Option/Alt
                  </kbd>{" "}
                  while dragging to create a duplicate.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Original stays in place</li>
                  <li>Duplicate follows cursor</li>
                  <li>Works with single and multi-selection</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Drag Handle</h3>
                <p className="text-sm text-gray-600">
                  <strong>Only artifacts</strong> (Image, Video, Audio,
                  Document) show a drag handle icon (⋮⋮) in the top-left corner
                  when selected. This provides an explicit drag target.
                </p>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "object-types",
    title: "Object Types",
    subsections: [
      {
        id: "artifacts",
        title: "Artifacts",
        content: (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">AI Artifacts</h2>
            <p className="text-gray-600">
              Artifacts are AI-generated content that go through a generation
              pipeline with progress tracking.
            </p>

            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Image</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>
                    Hover toolbar: Download, AI Prompt (Tab), Convert to Video,
                    Color Tag
                  </li>
                  <li>Drag handle (⋮⋮) in top-left when selected</li>
                  <li>Metadata header shows creator and timestamp on select</li>
                  <li>Resizable with 8 resize handles (corners + edges)</li>
                  <li>Draggable</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Video</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Custom video player with hover controls</li>
                  <li>Duration pill in bottom-left (play icon + duration)</li>
                  <li>Hover to auto-play with smooth progress bar</li>
                  <li>Click progress bar to scrub to any position</li>
                  <li>Progress bar grows on hover for better interaction</li>
                  <li>Hover toolbar: Download, Rerun, Color Tag</li>
                  <li>Drag handle (⋮⋮) when selected</li>
                  <li>Metadata header on select</li>
                  <li>Resizable and draggable</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Audio</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Waveform visualization</li>
                  <li>Hover toolbar: Download, Rerun, Color Tag</li>
                  <li>Drag handle (⋮⋮) when selected</li>
                  <li>Metadata header on select</li>
                  <li>Resizable and draggable</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Document</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Scrollable text content</li>
                  <li>Hover toolbar: Download, Rerun, Color Tag</li>
                  <li>Drag handle (⋮⋮) when selected</li>
                  <li>Metadata header on select</li>
                  <li>Resizable and draggable</li>
                </ul>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">
                  Generation States
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-purple-800">
                  <li>
                    <strong>Pre-placeholder:</strong> Waiting for prompt input
                  </li>
                  <li>
                    <strong>Generating:</strong> Shows progress bar (0-100%)
                  </li>
                  <li>
                    <strong>Idle:</strong> Generation complete, ready to use
                  </li>
                  <li>
                    <strong>Error:</strong> Generation failed
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "canvas-natives",
        title: "Canvas Natives",
        content: (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Canvas Native Objects</h2>
            <p className="text-gray-600">
              Native canvas objects that don't require AI generation. They're
              instantly created and ready to use.
            </p>

            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Text</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Simple text content</li>
                  <li>Draggable, not resizable</li>
                  <li>No hover toolbar or drag handle</li>
                  <li>Has color tag support</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Shape</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Rectangle, circle, triangle, star</li>
                  <li>Configurable fill and stroke</li>
                  <li>Draggable, not resizable</li>
                  <li>No hover toolbar or drag handle</li>
                  <li>Has color tag support</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Doodle</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Free-form SVG paths</li>
                  <li>Draggable, not resizable</li>
                  <li>No hover toolbar or drag handle</li>
                  <li>Has color tag support</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Sticky Note</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Note with title and author</li>
                  <li>Custom background color</li>
                  <li>Draggable, not resizable</li>
                  <li>No hover toolbar or drag handle</li>
                  <li>Has color tag support</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Link</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>URL preview card</li>
                  <li>Shows title, description, thumbnail</li>
                  <li>Draggable, not resizable</li>
                  <li>No hover toolbar or drag handle</li>
                  <li>Has color tag support</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">PDF</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>PDF document viewer with page navigation</li>
                  <li>Hover toolbar: Download, Color Tag</li>
                  <li>No drag handle (PDF is not an artifact)</li>
                  <li>Resizable and draggable</li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "frames",
        title: "Frames",
        content: (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Frame System</h2>
            <p className="text-gray-600">
              Frames are organizational containers that can group and
              auto-layout child objects.
            </p>

            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Creating Frames</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>
                    <strong>Frame Selection:</strong> Select multiple objects,
                    click "Frame" in multi-select toolbar
                  </li>
                  <li>
                    <strong>Draw Frame:</strong> Press{" "}
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      F
                    </kbd>
                    , click and drag to draw
                  </li>
                  <li>
                    <strong>Empty Frame:</strong> Use "Canvas Objects" menu →
                    Frame
                  </li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Auto-Layout</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Enable auto-layout to automatically arrange children in a
                  flexbox-like layout.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>
                    <strong>HStack:</strong> Horizontal row layout
                  </li>
                  <li>
                    <strong>VStack:</strong> Vertical column layout
                  </li>
                  <li>
                    <strong>Grid:</strong> Wrapping grid (max 5 items per row)
                  </li>
                </ul>
                <p className="text-sm text-gray-600 mt-2">
                  Gap and padding default to 10px. Frame automatically resizes
                  to fit contents.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Frame Toolbar</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>
                    <strong>Layout Type:</strong> Switch between hstack, vstack,
                    grid
                  </li>
                  <li>
                    <strong>Auto Layout:</strong> Toggle auto-layout on/off
                  </li>
                  <li>
                    <strong>Unframe:</strong> Remove frame and release children
                  </li>
                  <li>
                    <strong>Download, More, Tag:</strong> Additional actions
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "features",
    title: "Features",
    subsections: [
      {
        id: "video-player",
        title: "Video Player",
        content: (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Custom Video Player</h2>
            <p className="text-gray-600">
              Videos feature a custom player with hover controls and smooth
              interactions.
            </p>

            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Duration Pill</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Located in bottom-left corner</li>
                  <li>Shows play icon and video duration</li>
                  <li>Translucent background with backdrop blur</li>
                  <li>Automatically hidden when video is selected</li>
                  <li>Duration formatted (e.g., "5s", "1m 30s")</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Hover Behavior</h3>
                <p className="text-sm text-gray-600 mb-2">
                  When you hover over a video (without selecting):
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Video auto-plays (muted, loops)</li>
                  <li>Duration pill background disappears (text remains)</li>
                  <li>Custom progress bar appears at bottom</li>
                  <li>Smooth 60fps progress animation</li>
                  <li>Video resets to start when hover ends</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Progress Bar</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Rounded pill shape at bottom edge</li>
                  <li>Dark background with white progress indicator</li>
                  <li>Interactive - grows from 2px to 6px on hover</li>
                  <li>Click anywhere to scrub to that position</li>
                  <li>Precise seeking by clicking specific time</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Scale-Aware Design</h3>
                <p className="text-sm text-gray-600 mb-2">
                  All video controls scale inversely with zoom level:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>UI elements maintain consistent visual size</li>
                  <li>
                    Controls auto-hide when video is too small (under 40px)
                  </li>
                  <li>Readable at all zoom levels</li>
                  <li>No UI clutter at small sizes</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Selected State</h3>
                <p className="text-sm text-gray-600 mb-2">
                  When video is selected:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Native browser controls appear</li>
                  <li>Custom controls hidden</li>
                  <li>Full playback capabilities available</li>
                  <li>Volume control, fullscreen, etc.</li>
                </ul>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">
                  Technical Features
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-purple-800">
                  <li>
                    Cross-browser compatible (Chrome, Safari, Firefox, Edge)
                  </li>
                  <li>RequestAnimationFrame for smooth 60fps updates</li>
                  <li>No native controls shown in custom mode</li>
                  <li>Graceful error handling for playback issues</li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "color-tags",
        title: "Color Tags",
        content: (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Color Tag System</h2>

            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Available Tags</h3>
                <div className="flex gap-3 items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded border-2 border-gray-300"></div>
                    <span className="text-sm">None</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-red-500"></div>
                    <span className="text-sm">Red</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-yellow-500"></div>
                    <span className="text-sm">Yellow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-green-500"></div>
                    <span className="text-sm">Green</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Tags cycle in order: none → red → yellow → green → none
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">How to Use</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Click the tag button in object toolbar (if available)</li>
                  <li>Tag indicator appears in top-right corner of object</li>
                  <li>Always visible (not just on hover/select)</li>
                  <li>All object types support color tags</li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "keyboard-shortcuts",
        title: "Shortcuts",
        content: (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Keyboard Shortcuts</h2>

            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">General</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Delete selected objects
                    </span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Delete / Backspace
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Duplicate selected
                    </span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Cmd/Ctrl + D
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Undo</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Cmd/Ctrl + Z
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Redo</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Cmd/Ctrl + Shift + Z
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Deselect all</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Escape
                    </kbd>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Selection</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Select all</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Cmd/Ctrl + A
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Add to selection
                    </span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Shift + Click
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Add to selection (Mac)
                    </span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Cmd + Click
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Box selection</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Click + Drag on canvas
                    </kbd>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Navigation</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Zoom</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Cmd/Ctrl + Scroll
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pan</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Alt + Drag
                    </kbd>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Frames</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Frame drawing mode
                    </span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      F
                    </kbd>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Actions</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Duplicate (drag)
                    </span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Option/Alt + Drag
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Duplicate (in place)
                    </span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                      Cmd/Ctrl + D
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "zoom-behavior",
        title: "Zoom Behavior",
        content: (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Zoom Level Interactions</h2>

            <div className="space-y-3">
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold mb-2 text-blue-900">Zoom Range</h3>
                <p className="text-sm text-blue-800">
                  The canvas supports zoom levels from{" "}
                  <strong>10% (0.1x)</strong> to <strong>300% (3.0x)</strong>
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">
                  Toolbar Visibility Threshold
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Hover toolbars are optimized for different zoom levels:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>
                    <strong>Above 20% zoom (0.20x):</strong> Toolbars appear on
                    hover after 1 second dwell time
                  </li>
                  <li>
                    <strong>Below 20% zoom (0.20x):</strong> Toolbars hidden on
                    hover to reduce clutter (but still appear when you select an
                    object)
                  </li>
                  <li>
                    <strong>Compact mode:</strong> When object is narrower than
                    toolbar, shows "Tab | ..." button that zooms to fit
                  </li>
                  <li>
                    Selection indicators (blue outline) remain visible at all
                    zoom levels
                  </li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Interaction Fidelity</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>
                    <strong>All interactions work at any zoom level:</strong>{" "}
                    Selection, dragging, resizing, and rotation
                  </li>
                  <li>
                    <strong>Zoom at cursor:</strong> Cmd/Ctrl+Scroll zooms
                    toward your cursor position
                  </li>
                  <li>
                    <strong>Canvas center zoom:</strong> Zoom controls (buttons)
                    zoom toward canvas center
                  </li>
                  <li>
                    <strong>Zoom step:</strong> Each zoom increment is 25%
                    (0.25x)
                  </li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">
                  Visual Elements at Different Zooms
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>
                    <strong>Always Visible:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Object outlines and content</li>
                      <li>Selection indicators (blue outline)</li>
                      <li>Color tags (dots in top-right corner)</li>
                      <li>Grid pattern (background)</li>
                      <li>Drag handles (for artifacts when selected)</li>
                      <li>Resize handles (for selected resizable objects)</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Conditional (zoom dependent):</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>
                        Hover toolbars (hidden on hover below 20%, but still
                        visible when selected)
                      </li>
                      <li>
                        Compact toolbar mode (when object &lt; 60% of toolbar
                        width)
                      </li>
                      <li>
                        Text readability (may become too small below 50% zoom)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-amber-50 border-amber-200">
                <h3 className="font-semibold mb-2 text-amber-900">
                  Best Practices
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
                  <li>
                    <strong>100% zoom (1.0x):</strong> Ideal for detailed work
                    and content creation
                  </li>
                  <li>
                    <strong>50-75% zoom:</strong> Good for organizing multiple
                    objects
                  </li>
                  <li>
                    <strong>25-35% zoom:</strong> Bird's-eye view for large
                    canvas overview
                  </li>
                  <li>
                    <strong>150-200% zoom:</strong> Close inspection of details
                    or small text
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "resize-behavior",
        title: "Resizing",
        content: (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Resize Behavior</h2>

            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Resizable Objects</h3>
                <p className="text-sm text-gray-600 mb-2">
                  The following object types can be resized:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>✅ Images, Videos, Audio, Documents (artifacts)</li>
                  <li>✅ PDFs</li>
                  <li>✅ Frames</li>
                  <li>
                    ❌ NOT resizable: Text, Shapes, Doodles, Sticky Notes, Links
                  </li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">How to Resize</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>
                    Select an object to show resize handles (8 handles on
                    corners and edges)
                  </li>
                  <li>Click and drag any handle to resize</li>
                  <li>Corner handles resize from corner</li>
                  <li>Edge handles resize from that edge</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Scale Mode</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Hold{" "}
                  <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
                    Shift
                  </kbd>{" "}
                  while resizing to scale from center and maintain aspect ratio.
                </p>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
];
