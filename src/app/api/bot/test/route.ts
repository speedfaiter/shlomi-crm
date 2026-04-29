import { NextRequest, NextResponse } from "next/server";
import { processMessage, BotMessage } from "@/lib/chatbot";

// POST /api/bot/test — test the chatbot locally
export async function POST(req: NextRequest) {
  try {
    const { message, userId } = await req.json();

    const response = await processMessage(
      userId || "test_user",
      message || "",
      "whatsapp"
    );

    // Flatten messages to plain text for the test UI
    const reply = response.messages
      .map((msg) => messageToText(msg))
      .join("\n\n---\n\n");

    return NextResponse.json({
      reply,
      raw: response.messages,
      leadCreated: response.leadCreated,
    });
  } catch (err) {
    console.error("Bot test error:", err);
    return NextResponse.json({ error: "Test failed" }, { status: 500 });
  }
}

function messageToText(msg: BotMessage): string {
  switch (msg.type) {
    case "text":
      return msg.text;

    case "button":
      const btnText = msg.buttons.map((b) => `[${b.title}]`).join("  ");
      return `${msg.body}\n\n${btnText}`;

    case "list":
      const rows = msg.sections
        .flatMap((s) => s.rows)
        .map((r) => `• ${r.title}${r.description ? ` — ${r.description}` : ""}`)
        .join("\n");
      return `${msg.body}\n\n${rows}\n\n📋 ${msg.buttonText}`;

    default:
      return JSON.stringify(msg);
  }
}
