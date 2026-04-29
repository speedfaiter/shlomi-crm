import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// PUT /api/leads/[id] â update a lead
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  // Filter out undefined values so partial updates don't overwrite existing fields
  const cleanBody = Object.fromEntries(
    Object.entries(body).filter(([_, v]) => v !== undefined)
  );

  const { data, error } = await supabase
    .from("leads")
    .update(cleanBody)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/leads/[id] â delete a lead
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase.from("leads").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
