"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

type Props = {
  onReady?: (editor: any) => void;
};

export default function Editor({ onReady }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Start writing here...</p>",
    immediatelyRender: false,
  });

  // Pass editor instance to parent (page.tsx)
  useEffect(() => {
    if (editor && onReady) {
      onReady(editor);
    }
  }, [editor, onReady]);

  return (
    <div className="border rounded p-2 h-[80vh] overflow-y-auto bg-white text-black">
      <EditorContent editor={editor} />
    </div>
  );
}
