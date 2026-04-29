import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/leads/stats — dashboard summary
export async function GET() {
  const { data: leads, error } = await supabase.from("leads").select("status, follow_up_date, source");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = leads?.length || 0;
  const byStatus: Record<string, number> = {};

  leads?.forEach((lead) => {
    byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
  });

  const today = new Date().toISOString().split("T")[0];
  const followUpsToday = leads?.filter(
    (l) => l.follow_up_date && l.follow_up_date <= today && l.status !== "closed" && l.status !== "not_interested"
  ).length || 0;

  const active = total - (byStatus["closed"] || 0) - (byStatus["not_interested"] || 0);

  const bySource = Object.entries(
    (leads || []).reduce((acc, l) => {
      const key = l.source || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([source, count]) => ({ source, count }));

  const byStatusArr = Object.entries(byStatus).map(([status, count]) => ({ status, count }));

  return NextResponse.json({
    total,
    active,
    closed: byStatus["closed"] || 0,
    not_interested: byStatus["not_interested"] || 0,
    followUpsToday,
    byStatus,
    bySource,
    byStatusArr,
  });
}
