import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    console.log("📩 Incoming message:", message);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo", // you can also try "anthropic/claude-3-opus"
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();
    console.log("📤 OpenRouter response:", data);

    // Handle both formats: "message.content" or "text"
    const reply =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text ||
      "⚠️ No response from AI";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("❌ OpenRouter API error:", error);
    return NextResponse.json({ reply: "Error talking to AI" }, { status: 500 });
  }
}
