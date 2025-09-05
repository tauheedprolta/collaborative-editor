"use client";

import { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";

type Props = {
  editor: Editor | null;
  onEditWithAI: (selectedText: string) => Promise<string>;
};

export default function FloatingToolbar({ editor, onEditWithAI }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [original, setOriginal] = useState("");
  const [suggestion, setSuggestion] = useState("");

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

  if (!isVisible) return null;

  const selectedText = editor?.state.doc.textBetween(
    editor.state.selection.from,
    editor.state.selection.to,
    " "
  );

  const handleAIEdit = async () => {
    if (!selectedText) return;
    setOriginal(selectedText);

    const aiSuggestion = await onEditWithAI(selectedText);
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
        className="bg-white border shadow-lg rounded p-2 flex space-x-2"
      >
        <button
          onClick={handleAIEdit}
          className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Edit with AI
        </button>
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-2">AI Suggestion</h3>
            <p className="text-sm text-gray-500 mb-2">Original:</p>
            <div className="border rounded p-2 mb-4">{original}</div>
            <p className="text-sm text-gray-500 mb-2">Suggestion:</p>
            <div className="border rounded p-2 mb-4">{suggestion}</div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmReplace}
                className="px-3 py-1 bg-green-500 text-white rounded"
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
