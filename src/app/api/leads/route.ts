import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/leads — list all leads
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    // Escape special PostgREST/SQL pattern chars to prevent injection
    const sanitized = search
      .replace(/\\/g, "\\\\")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_");
    query = query.or(`name.ilike.%${sanitized}%,phone.ilike.%${sanitized}%,city.ilike.%${sanitized}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/leads — create a new lead
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: body.name,
      phone: body.phone,
      city: body.city || "",
      child_age: body.child_age || null,
      source: body.source || "manual",
      status: body.status || "new",
      notes: body.notes || "",
      follow_up_date: body.follow_up_date || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send lead data to Make webhook for Responder.live
  try {
    fetch('https://hook.us2.make.com/wre0tg4wfeqm9vgg75tfxuztkr45335p', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        city: data.city,
        child_age: data.child_age,
        source: data.source,
        status: data.status,
        notes: data.notes,
        created_at: data.created_at
      })
    });
  } catch (webhookError) {
    console.error('Make webhook error:', webhookError);
  }

  return NextResponse.json(data, { status: 201 });
}
