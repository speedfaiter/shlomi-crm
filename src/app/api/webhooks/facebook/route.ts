// Facebook Lead Ads webhook — kept as placeholder
// Leads from Facebook/Instagram now come through:
// 1. Public form at /form (share link in bio/posts)
// 2. Messenger/Instagram chatbot (see /api/webhooks/messenger)

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    info: "Use /form for lead capture or /api/webhooks/messenger for chatbot",
  });
}

export async function POST() {
  return NextResponse.json({
    info: "Use /form for lead capture or /api/webhooks/messenger for chatbot",
  });
}
