import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

// GET /api/bot/config — read current bot config
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
      business_name: "כושר וחינוך ילדים",
      classes: [
        { id: "fitness", name: "כושר לילדים", ages: "5-8", emoji: "💪" },
        { id: "gymnastics", name: "התעמלות ותנועה", ages: "6-10", emoji: "🤸" },
        { id: "martial", name: "אומנויות לחימה", ages: "7-12", emoji: "🥋" },
        { id: "athletics", name: "אתלטיקה קלה", ages: "8-14", emoji: "🏃" },
        { id: "yoga", name: "יוגה לילדים", ages: "5-12", emoji: "🧘" },
      ],
      pricing: {
        once: { label: "פעם בשבוע", price: "250₪/חודש" },
        twice: { label: "פעמיים בשבוע", price: "400₪/חודש" },
        unlimited: { label: "מנוי חופשי", price: "550₪/חודש" },
      },
      location: {
        address: "[הכנס כתובת כאן]",
        hours: "א׳-ה׳ 14:00-20:00 | ו׳ 09:00-13:00",
        mapsLink: "[הכנס קישור Google Maps]",
      },
      welcome_message: "שלום! 👋 ברוכים הבאים ל*כושר וחינוך ילדים*!",
      menu_body: "איך אפשר לעזור? בחר מהתפריט 👇",
      menu_footer: "כושר וחינוך ילדים 🏋️",
      promo_text: "🎁 *מבצע הצטרפות:*\nחודש ראשון ב-50% הנחה!",
    });
  }
}

// PUT /api/bot/config — update bot config
export async function PUT(request: Request) {
  try {
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
