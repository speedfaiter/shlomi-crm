import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { processMessage, BotMessage } from "@/lib/chatbot";

// âââ Messenger + Instagram Webhook âââââââââââââââââââââââââââââââââââ
// Handles both platforms. Supports quick reply buttons (Messenger).
// Lists degrade to text with numbered options on Messenger/Instagram.

const GRAPH_API = "https://graph.facebook.com/v18.0";

// GET â Verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.MESSENGER_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST â Incoming messages
export async function POST(req: NextRequest) {
  try {
    // Signature verification
    const signature = req.headers.get('x-hub-signature-256');
    const appSecret = process.env.META_APP_SECRET;
    if (appSecret && signature) {
      const rawBody = await req.clone().text();
      const hmac = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
      if (signature !== `sha256=${hmac}`) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const body = await req.json();
    const entries = body.entry || [];

    for (const entry of entries) {
      const events = entry.messaging || [];

      for (const event of events) {
        const senderId = event.sender?.id;
        if (!senderId) continue;

        // Extract text from message or postback
        const text = event.message?.text
          || event.message?.quick_reply?.payload
          || event.postback?.payload
          || "";

        if (!text) continue;

        const platform = isInstagram(event) ? "instagram" : "messenger";
        console.log(`[${platform}] ${senderId}: "${text}"`);

        // Process
        const response = await processMessage(senderId, text, platform);

        // Send replies
        for (const msg of response.messages) {
          await sendMessengerMessage(senderId, msg);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Messenger] Error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

function isInstagram(event: any): boolean {
  return !!event.sender?.id && !!event.recipient?.id && event.sender.id.length > 15;
}

// âââ Send Message (with Quick Replies for buttons) âââââââââââââââââââ

async function sendMessengerMessage(recipientId: string, msg: BotMessage) {
  const token = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
  if (!token) return;

  let payload: any;

  switch (msg.type) {
    case "text":
      payload = {
        recipient: { id: recipientId },
        message: { text: msg.text },
      };
      break;

    case "button":
      // Messenger: use quick_replies (up to 13)
      payload = {
        recipient: { id: recipientId },
        message: {
          text: msg.body + (msg.footer ? `\n\n${msg.footer}` : ""),
          quick_replies: msg.buttons.map((btn) => ({
            content_type: "text",
            title: btn.title.slice(0, 20),
            payload: btn.id,
          })),
        },
      };
      break;

    case "list":
      // Messenger: degrade list to text with quick replies
      const listText = msg.body + "\n\n" +
        msg.sections
          .flatMap((s) => s.rows)
          .map((row) => `${row.title}${row.description ? ` â ${row.description}` : ""}`)
          .join("\n");

      const quickReplies = msg.sections
        .flatMap((s) => s.rows)
        .slice(0, 13) // Messenger limit
        .map((row) => ({
          content_type: "text",
          title: row.title.slice(0, 20),
          payload: row.id,
        }));

      payload = {
        recipient: { id: recipientId },
        message: {
          text: listText + (msg.footer ? `\n\n${msg.footer}` : ""),
          quick_replies: quickReplies,
        },
      };
      break;
  }

  try {
    const res = await fetch(
      `${GRAPH_API}/me/messages?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error("[Messenger] Send failed:", err);
    }
  } catch (err) {
    console.error("[Messenger] Send error:", err);
  }
}
