// This endpoint is kept as a no-op placeholder.
// WhatsApp messages are now sent via wa.me direct links in the browser.
// See /api/whatsapp/log for message logging.

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    info: "WhatsApp messages are sent via wa.me links. Use /api/whatsapp/log to log sends.",
  });
}
