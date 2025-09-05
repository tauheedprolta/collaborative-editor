"use client";

import { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";

type Props = {
  editor: Editor | null;
  onEditWithAI: (selectedText: string, mode?: string) => Promise<string>;
};

export default function FloatingToolbar({ editor, onEditWithAI }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [original, setOriginal] = useState("");
  const [suggestion, setSuggestion] = useState("");

  // Ensures this only runs on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setIsVisible(false);
        return;
      }

      const start = editor.view.coordsAtPos(from);
      const end = editor.view.coordsAtPos(to);
      const box = {
        top: Math.min(start.top, end.top),
        left: (start.left + end.left) / 2,
      };

      setCoords({ x: box.left, y: box.top - 40 });
      setIsVisible(true);
    };

    editor.on("selectionUpdate", update);
    return () => {
      editor.off("selectionUpdate", update);
    };
  }, [editor]);

  if (!isMounted || !isVisible) return null;

  const selectedText = editor?.state.doc.textBetween(
    editor.state.selection.from,
    editor.state.selection.to,
    " "
  );

  const handleAIEdit = async (mode: string) => {
    if (!selectedText) return;
    setOriginal(selectedText);

    let prompt = selectedText;
    switch (mode) {
      case "shorten":
        prompt = `Shorten this text but keep the meaning: "${selectedText}"`;
        break;
      case "lengthen":
        prompt = `Expand and elaborate on this text: "${selectedText}"`;
        break;
      case "table":
        prompt = `Convert this text into a simple markdown table: "${selectedText}"`;
        break;
      default:
        prompt = `Please improve this text: "${selectedText}"`;
    }

    const aiSuggestion = await onEditWithAI(prompt);
    setSuggestion(aiSuggestion);
    setIsModalOpen(true);
  };

  const confirmReplace = () => {
    editor?.commands.insertContentAt(
      { from: editor.state.selection.from, to: editor.state.selection.to },
      suggestion
    );
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Floating Toolbar */}
      <div
        style={{
          position: "absolute",
          top: coords.y,
          left: coords.x,
          transform: "translate(-50%, -100%)",
        }}
        className="bg-white border shadow-lg rounded p-2 flex space-x-2 z-50"
      >
        <button
          onClick={() => handleAIEdit("improve")}
          className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Edit with AI
        </button>
        <button
          onClick={() => handleAIEdit("shorten")}
          className="px-2 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
        >
          Shorten
        </button>
        <button
          onClick={() => handleAIEdit("lengthen")}
          className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          Lengthen
        </button>
        <button
          onClick={() => handleAIEdit("table")}
          className="px-2 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
        >
          Convert to Table
        </button>
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-bold mb-2">AI Suggestion</h3>
            <p className="text-sm text-gray-500 mb-2">Original:</p>
            <div className="border rounded p-2 mb-4 bg-gray-50">{original}</div>
            <p className="text-sm text-gray-500 mb-2">Suggestion:</p>
            <div className="border rounded p-2 mb-4 bg-gray-50 whitespace-pre-line">
              {suggestion}
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmReplace}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
