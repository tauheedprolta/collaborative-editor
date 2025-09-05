"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import FloatingToolbar from "../components/floatingtoolbar";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string; type?: string }[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Start writing here...</p>",
    immediatelyRender: false,
  });

  // AI edit handler (used by floating toolbar)
  const handleEditWithAI = async (prompt: string): Promise<string> => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });

      const data = await res.json();
      return data.reply;
    } catch (error) {
      console.error("AI edit error:", error);
      return prompt;
    }
  };

  // Chat + Web Search handler
  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    const userMessage = input;
    setInput("");

    try {
      // Detect search queries
      if (
        userMessage.toLowerCase().includes("find") ||
        userMessage.toLowerCase().includes("search")
      ) {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: userMessage }),
        });

        const data = await res.json();

        // Show in chat with label
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: `🔎 Web Search Result: ${data.result}`, type: "search" },
        ]);

        // Insert into editor
        editor?.commands.insertContent(
          `<p><strong>🔎 Web Search Result:</strong> ${data.result}</p>`
        );
      } else {
        // Normal AI chat
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage }),
        });

        const data = await res.json();
        setMessages((prev) => [...prev, { sender: "ai", text: data.reply, type: "chat" }]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "⚠️ Error: could not reach AI or search API" },
      ]);
    }
  };

  // 🚀 Prevent hydration mismatch
  if (!isMounted) {
    return <p className="p-6">Loading editor...</p>;
  }

  return (
    <div className="flex h-screen">
      {/* Editor Section */}
      <div className="flex-1 p-6 relative">
        <h1 className="text-2xl font-bold mb-4">Collaborative Editor</h1>
        <div className="relative border rounded-lg p-4 h-[80vh] overflow-y-auto">
          <EditorContent editor={editor} />
          <FloatingToolbar editor={editor} onEditWithAI={handleEditWithAI} />
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="w-80 border-l p-4 bg-white flex flex-col">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">AI Chat</h2>
        <div className="flex-1 border rounded p-2 mb-4 overflow-y-auto bg-gray-50">
          {messages.map((msg, i) => (
            <p
              key={i}
              className={`mb-2 ${
                msg.sender === "user"
                  ? "text-blue-700"
                  : msg.type === "search"
                  ? "text-gray-900 bg-yellow-100 px-2 py-1 rounded"
                  : "text-gray-800 bg-green-100 px-2 py-1 rounded"
              }`}
            >
              <strong>{msg.sender}:</strong> {msg.text}
            </p>
          ))}
        </div>
        <div className="flex">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border rounded-l px-2 py-1 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
