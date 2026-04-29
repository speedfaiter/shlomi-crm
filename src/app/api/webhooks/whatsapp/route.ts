import { NextRequest, NextResponse } from "next/server";
import {
  processMessage,
  BotMessage,
  WAButtonMessage,
  WAListMessage,
} from "@/lib/chatbot";

// ─── WhatsApp Cloud API Webhook — Interactive Messages ───────────────
//
// Supports:
// - Text messages
// - Interactive reply buttons (up to 3)
// - Interactive list messages (sections with rows)
// - Button/list callback handling
//
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

const GRAPH_API = "https://graph.facebook.com/v18.0";

// ─── GET: Verification Challenge ─────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[WA] Webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ─── POST: Incoming Messages ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value || {};

        // Skip status updates (delivered, read, etc.)
        if (!value.messages) continue;

        const phoneNumberId = value.metadata?.phone_number_id;
        const messages = value.messages || [];

        for (const msg of messages) {
          const from = msg.from;
          const incomingText = extractMessageText(msg);

          if (!from || !incomingText) continue;

          console.log(`[WA] ${from}: "${incomingText}" (type: ${msg.type})`);

          // Mark as read
          await markAsRead(phoneNumberId, msg.id);

          // Send typing indicator
          await sendTypingIndicator(phoneNumberId, from);

          // Process through chatbot engine
          const response = await processMessage(from, incomingText, "whatsapp");

          // Send all response messages
          for (const botMsg of response.messages) {
            await sendMessage(phoneNumberId, from, botMsg);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[WA] Webhook error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// ─── Extract Text from Any Message Type ──────────────────────────────

function extractMessageText(msg: any): string {
  switch (msg.type) {
    case "text":
      return msg.text?.body || "";

    case "interactive":
      // Button reply
      if (msg.interactive?.type === "button_reply") {
        return msg.interactive.button_reply.id;
      }
      // List reply
      if (msg.interactive?.type === "list_reply") {
        return msg.interactive.list_reply.id;
      }
      return "";

    case "button":
      // Template quick reply button
      return msg.button?.text || msg.button?.payload || "";

    // Images, audio, etc. — treat as "need help"
    case "image":
    case "audio":
    case "video":
    case "document":
      return "media_received";

    case "location":
      return "location_received";

    default:
      return "";
  }
}

// ─── Send Message (Text / Buttons / List) ────────────────────────────

async function sendMessage(phoneNumberId: string, to: string, msg: BotMessage) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token || !phoneNumberId) {
    console.log("[WA] Missing credentials, skipping send");
    return;
  }

  let payload: any;

  switch (msg.type) {
    case "text":
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: true, body: msg.text },
      };
      break;

    case "button":
      payload = buildButtonPayload(to, msg);
      break;

    case "list":
      payload = buildListPayload(to, msg);
      break;
  }

  try {
    const res = await fetch(`${GRAPH_API}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error("[WA] Send failed:", JSON.stringify(result));
    } else {
      console.log("[WA] Sent:", msg.type, "to", to);
    }
  } catch (err) {
    console.error("[WA] Send error:", err);
  }
}

// ─── Build Interactive Button Payload ────────────────────────────────

function buildButtonPayload(to: string, msg: WAButtonMessage) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: msg.body },
      ...(msg.footer ? { footer: { text: msg.footer } } : {}),
      action: {
        buttons: msg.buttons.map((btn) => ({
          type: "reply",
          reply: {
            id: btn.id,
            title: btn.title.slice(0, 20), // WhatsApp limit: 20 chars
          },
        })),
      },
    },
  };
}

// ─── Build Interactive List Payload ──────────────────────────────────

function buildListPayload(to: string, msg: WAListMessage) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: msg.body },
      ...(msg.footer ? { footer: { text: msg.footer } } : {}),
      action: {
        button: msg.buttonText.slice(0, 20), // WhatsApp limit: 20 chars
        sections: msg.sections.map((section) => ({
          title: section.title.slice(0, 24),
          rows: section.rows.map((row) => ({
            id: row.id,
            title: row.title.slice(0, 24),
            ...(row.description ? { description: row.description.slice(0, 72) } : {}),
          })),
        })),
      },
    },
  };
}

// ─── Mark Message as Read ────────────────────────────────────────────

async function markAsRead(phoneNumberId: string, messageId: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token || !phoneNumberId) return;

  try {
    await fetch(`${GRAPH_API}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });
  } catch {
    // Best effort
  }
}

// ─── Typing Indicator ────────────────────────────────────────────────

async function sendTypingIndicator(phoneNumberId: string, to: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token || !phoneNumberId) return;

  try {
    await fetch(`${GRAPH_API}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "reaction",
        reaction: { message_id: "", emoji: "" },
      }),
    });
  } catch {
    // Best effort — typing indicator is optional
  }
}
