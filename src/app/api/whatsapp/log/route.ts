import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/whatsapp/log — log that a WhatsApp message was sent via wa.me
export async function POST(req: NextRequest) {
  try {
    const { leadId, template } = await req.json();

    if (!leadId) {
      return NextResponse.json({ error: "leadId required" }, { status: 400 });
    }

    // Log the message
    await supabase.from("follow_up_log").insert({
      lead_id: leadId,
      message_type: "manual",
      template: template || "custom",
      status: "sent",
    });

    // Update lead follow-up tracking
    await supabase
      .from("leads")
      .update({
        follow_up_count: (await supabase.from("leads").select("follow_up_count").eq("id", leadId).single()).data?.follow_up_count + 1 || 1,
        last_follow_up_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("WhatsApp log error:", err);
    return NextResponse.json({ error: "Failed to log" }, { status: 500 });
  }
}
