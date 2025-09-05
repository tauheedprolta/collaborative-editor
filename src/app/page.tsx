"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import FloatingToolbar from "./components/FloatingToolbar";

export default function Home() {
  const [messages, setMessages] = useState<{ sender: string; text: string; type?: string }[]>([]);
  const [input, setInput] = useState("");

  // ✅ Initialize TipTap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Start writing here...</p>",
    immediatelyRender: false,
  });

  // ✅ Send message handler
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
        try {
          const res = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: userMessage }),
          });

          const data = await res.json();
          console.log("🔎 Search API response:", data);

          setMessages((prev) => [
            ...prev,
            { sender: "ai", text: `🔎 Web Search Result: ${data.result}`, type: "search" },
          ]);

          // Insert into editor
          editor?.commands.insertContent(
            `<p><strong>🔎 Web Search Result:</strong> ${data.result}</p>`
          );
        } catch (err) {
          console.error("❌ Search API error:", err);
          setMessages((prev) => [
            ...prev,
            { sender: "ai", text: "⚠️ Search API error: could not fetch results" },
          ]);
        }
      } else {
        // Normal AI chat
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userMessage }),
          });

          const data = await res.json();
          console.log("🤖 AI API response:", data);

          setMessages((prev) => [
            ...prev,
            { sender: "ai", text: data.reply || "⚠️ Empty AI response", type: "chat" },
          ]);
        } catch (err) {
          console.error("❌ AI API error:", err);
          setMessages((prev) => [
            ...prev,
            { sender: "ai", text: "⚠️ AI API error: could not fetch response" },
          ]);
        }
      }
    } catch (error) {
      console.error("❌ Unexpected sendMessage error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "⚠️ Unexpected error in sendMessage()" },
      ]);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Editor Section */}
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4">Collaborative Editor</h1>
        <div className="border rounded p-2 h-[80vh] overflow-y-auto bg-white text-black">
          <EditorContent editor={editor} />
        </div>
        <FloatingToolbar editor={editor} />
      </div>

      {/* Chat Sidebar */}
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
