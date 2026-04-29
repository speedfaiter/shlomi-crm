import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

// GET /api/bot/config â read current bot config
export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("bot_config")
      .select("*")
      .eq("id", "default")
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error("[Bot Config] GET error:", err);
    // Return hardcoded defaults if table doesn't exist yet
    return NextResponse.json({
      id: "default",
      business_name: "×××©×¨ ×××× ×× ×××××",
      classes: [
        { id: "fitness", name: "×××©×¨ ××××××", ages: "5-8", emoji: "ðª" },
        { id: "gymnastics", name: "××ª×¢××××ª ××ª× ××¢×", ages: "6-10", emoji: "ð¤¸" },
        { id: "martial", name: "×××× ××××ª ×××××", ages: "7-12", emoji: "ð¥" },
        { id: "athletics", name: "××ª××××§× ×§××", ages: "8-14", emoji: "ð" },
        { id: "yoga", name: "×××× ××××××", ages: "5-12", emoji: "ð§" },
      ],
      pricing: {
        once: { label: "×¤×¢× ××©×××¢", price: "250âª/××××©" },
        twice: { label: "×¤×¢×××× ××©×××¢", price: "400âª/××××©" },
        unlimited: { label: "×× ×× ×××¤×©×", price: "550âª/××××©" },
      },
      location: {
        address: "[××× ×¡ ××ª×××ª ×××]",
        hours: "××³-××³ 14:00-20:00 | ××³ 09:00-13:00",
        mapsLink: "[××× ×¡ ×§××©××¨ Google Maps]",
      },
      welcome_message: "×©×××! ð ××¨×××× ××××× ×*×××©×¨ ×××× ×× ×××××*!",
      menu_body: "××× ××¤×©×¨ ××¢×××¨? ×××¨ ×××ª×¤×¨×× ð",
      menu_footer: "×××©×¨ ×××× ×× ××××× ðï¸",
      promo_text: "ð *×××¦×¢ ××¦××¨×¤××ª:*\n××××© ×¨××©×× ×-50% ×× ××!",
    });
  }
}

// PUT /api/bot/config â update bot config
export async function PUT(request: Request) {
  try {
    // API key check
    const authHeader = request.headers.get('authorization');
    const token = process.env.ADMIN_TOKEN;
    if (token && authHeader !== `Bearer ${token}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("bot_config")
      .update({
        business_name: body.business_name,
        classes: body.classes,
        pricing: body.pricing,
        location: body.location,
        welcome_message: body.welcome_message,
        menu_body: body.menu_body,
        menu_footer: body.menu_footer,
        promo_text: body.promo_text,
      })
      .eq("id", "default")
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error("[Bot Config] PUT error:", err);
    return NextResponse.json(
      { error: "Failed to save config" },
      { status: 500 }
    );
  }
}
