"use client";

import { useState } from "react";
import StarterKit from "@tiptap/starter-kit";
import { useEditor, EditorContent } from "@tiptap/react";
import Editor from "../components/Editor";
import FloatingToolbar from "../components/FloatingToolbar";

export default function Home() {
  const [messages, setMessages] = useState<
    { sender: string; text: string; type?: string }[]
  >([]);
  const [input, setInput] = useState("");

  // ✅ Initialize TipTap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Start writing here...</p>",
    immediatelyRender: false,
  });

  // ✅ AI edit handler (for FloatingToolbar)
  const handleEditWithAI = async (selectedText: string): Promise<string> => {
    if (!selectedText.trim()) return "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Please improve this text: "${selectedText}"`,
        }),
      });

      const data = await res.json();
      return data.reply || selectedText;
    } catch (error) {
      console.error("AI edit error:", error);
      return selectedText;
    }
  };

  // ✅ Send message handler (chat + search + AI)
  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    const userMessage = input;
    setInput("");

    try {
      // 🔎 If user asks to search
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
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: `🔎 Web Search Result: ${data.result}`, type: "search" },
        ]);

        editor?.commands.insertContent(
          `<p><strong>🔎 Web Search Result:</strong> ${data.result}</p>`
        );
      } else {
        // 🤖 Normal AI chat
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage }),
        });

        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: data.reply || "⚠️ Empty AI response", type: "chat" },
        ]);
      }
    } catch (err) {
      console.error("❌ sendMessage error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "⚠️ Error: could not fetch response" },
      ]);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* 📝 Editor Section */}
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4">Collaborative Editor</h1>
        <div className="border rounded p-2 h-[80vh] overflow-y-auto bg-white text-black relative">
          <EditorContent editor={editor} />
          {editor && (
            <FloatingToolbar editor={editor} onEditWithAI={handleEditWithAI} />
          )}
        </div>
      </div>

      {/* 💬 Chat Sidebar */}
      <div className="w-1/3 bg-white text-black flex flex-col border-l">
        <h2 className="text-lg font-bold p-2">AI Chat</h2>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded ${
                msg.sender === "user"
                  ? "text-blue-600 font-bold"
                  : "bg-green-100 text-black"
              }`}
            >
              <span className="font-semibold">{msg.sender}:</span> {msg.text}
            </div>
          ))}
        </div>
        <div className="p-2 flex border-t">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border p-2 rounded-l text-black"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 rounded-r"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
