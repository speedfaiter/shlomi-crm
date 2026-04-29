import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

// POST /api/webhooks/ravmesser — receive leads from Rav Messer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Rav Messer typically sends: name, phone, email, and custom fields
    // Adjust field mapping based on your actual Rav Messer form configuration
    const name = body.name || body.full_name || body.שם || "";
    const phone = body.phone || body.טלפון || body.mobile || "";
    const city = body.city || body.עיר || "";
    const childAge = body.child_age || body.גיל_ילד || null;
    const notes = body.notes || body.הערות || "";

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Missing name or phone" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("leads")
      .insert({
        name,
        phone,
        city,
        child_age: childAge ? parseInt(childAge) : null,
        source: "ravmesser",
        status: "new",
        notes: `[רב מסר] ${notes}`.trim(),
        follow_up_date: null,
      })
      .select()
      .single();

    if (error) {
      console.error("Rav Messer webhook error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Set follow_up_date to today so it appears highlighted in the dashboard
    const today = new Date().toISOString().split("T")[0];
    await supabase
      .from("leads")
      .update({ follow_up_date: today })
      .eq("id", data.id);

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error("Rav Messer webhook parse error:", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
