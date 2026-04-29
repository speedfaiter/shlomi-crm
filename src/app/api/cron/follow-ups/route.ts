import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { FOLLOW_UP_SEQUENCE, buildTemplateLink } from "@/lib/whatsapp";

// GET/POST /api/cron/follow-ups
// Checks which leads need follow-up based on their creation date and follow_up_count.
// Sets their follow_up_date to today so they appear highlighted in the dashboard.
// No external WhatsApp service needed — the user sends messages via wa.me links.

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const flagged: Array<{ id: string; name: string; phone: string; step: string; waLink: string }> = [];

  // Get active leads that haven't opted out
  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .in("status", ["new", "contacted", "interested"])
    .eq("whatsapp_opt_out", false)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const lead of leads || []) {
    const createdAt = new Date(lead.created_at);
    const daysSinceCreation = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Find which step they should be on
    const nextStep = FOLLOW_UP_SEQUENCE.find(
      (step, index) => index === lead.follow_up_count && daysSinceCreation >= step.daysAfter
    );

    if (!nextStep) continue;

    // Set follow_up_date to today so it shows as "needs follow-up" in the UI
    await supabase
      .from("leads")
      .update({ follow_up_date: today })
      .eq("id", lead.id);

    flagged.push({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      step: nextStep.template,
      waLink: buildTemplateLink(lead.phone, nextStep.template, lead.name),
    });
  }

  return NextResponse.json({
    flagged: flagged.length,
    leads: flagged,
    timestamp: now.toISOString(),
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
