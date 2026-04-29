// ─── Chatbot Engine v2 — Interactive Buttons & Lists ─────────────────
// Returns structured WhatsApp Cloud API message objects:
// - text messages
// - interactive buttons (up to 3 buttons)
// - interactive lists (up to 10 rows in sections)
// Works across WhatsApp, Messenger, and Instagram (degrades to text for non-WA)

import { getServiceSupabase } from "./supabase";

// ─── Message Types ───────────────────────────────────────────────────

export interface WATextMessage {
  type: "text";
  text: string;
}

export interface WAButton {
  id: string;
  title: string; // max 20 chars
}

export interface WAButtonMessage {
  type: "button";
  body: string;
  footer?: string;
  buttons: WAButton[]; // max 3
}

export interface WAListRow {
  id: string;
  title: string; // max 24 chars
  description?: string; // max 72 chars
}

export interface WAListSection {
  title: string;
  rows: WAListRow[];
}

export interface WAListMessage {
  type: "list";
  body: string;
  footer?: string;
  buttonText: string; // max 20 chars — the CTA button label
  sections: WAListSection[];
}

export type BotMessage = WATextMessage | WAButtonMessage | WAListMessage;

export interface BotResponse {
  messages: BotMessage[];
  leadCreated?: boolean;
}

// ─── Bot Configuration ───────────────────────────────────────────────

export interface BotConfig {
  businessName: string;
  classes: Array<{ id: string; name: string; ages: string; emoji: string }>;
  pricing: {
    once: { label: string; price: string };
    twice: { label: string; price: string };
    unlimited: { label: string; price: string };
  };
  location: {
    address: string;
    hours: string;
    mapsLink: string;
  };
  welcomeMessage: string;
  menuBody: string;
  menuFooter: string;
  promoText: string;
}

// Hardcoded defaults (used as fallback)
const DEFAULT_CONFIG: BotConfig = {
  businessName: "כושר וחינוך ילדים",
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
  welcomeMessage: "שלום! 👋 ברוכים הבאים ל*כושר וחינוך ילדים*!",
  menuBody: "איך אפשר לעזור? בחר מהתפריט 👇",
  menuFooter: "כושר וחינוך ילדים 🏋️",
  promoText: "🎁 *מבצע הצטרפות:*\nחודש ראשון ב-50% הנחה!",
};

// Exported for the bot config page (read-only)
export const BOT_CONFIG = DEFAULT_CONFIG;

// Cache config in memory for 60 seconds
let cachedConfig: BotConfig | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000;

async function loadConfig(): Promise<BotConfig> {
  if (cachedConfig && Date.now() - cacheTime < CACHE_TTL) {
    return cachedConfig;
  }
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("bot_config")
      .select("*")
      .eq("id", "default")
      .single();

    if (error || !data) throw error || new Error("No config");

    cachedConfig = {
      businessName: data.business_name,
      classes: data.classes,
      pricing: data.pricing,
      location: data.location,
      welcomeMessage: data.welcome_message,
      menuBody: data.menu_body,
      menuFooter: data.menu_footer,
      promoText: data.promo_text,
    };
    cacheTime = Date.now();
    return cachedConfig;
  } catch {
    console.warn("[Chatbot] Failed to load config from DB, using defaults");
    return DEFAULT_CONFIG;
  }
}

// ─── Conversation State Machine ──────────────────────────────────────

export type ConversationState =
  | "idle"
  | "menu"
  | "class_info"
  | "collect_name"
  | "collect_phone"
  | "collect_child_age"
  | "collect_city"
  | "agent";

interface ConversationData {
  state: ConversationState;
  selectedClass?: string;
  name?: string;
  phone?: string;
  child_age?: string;
  city?: string;
}

const conversations = new Map<string, ConversationData>();

function getConv(userId: string): ConversationData {
  return conversations.get(userId) || { state: "idle" };
}

function setConv(userId: string, data: Partial<ConversationData>) {
  const current = getConv(userId);
  conversations.set(userId, { ...current, ...data });
}

// ─── Main Entry Point ────────────────────────────────────────────────

export async function processMessage(
  userId: string,
  message: string,
  platform: "whatsapp" | "messenger" | "instagram"
): Promise<BotResponse> {
  const text = message.trim();
  const conv = getConv(userId);
  const cfg = await loadConfig();

  // Global commands
  if (text === "menu" || text === "תפריט" || text === "0") {
    setConv(userId, { state: "menu" });
    return { messages: [buildMainMenu(cfg)] };
  }

  // Route by state
  switch (conv.state) {
    case "idle":
      return handleIdle(userId, text, cfg);
    case "menu":
      return handleMenuSelection(userId, text, cfg);
    case "class_info":
      return handleClassInfo(userId, text, cfg);
    case "collect_name":
      return handleCollectName(userId, text);
    case "collect_phone":
      return handleCollectPhone(userId, text);
    case "collect_child_age":
      return handleCollectChildAge(userId, text);
    case "collect_city":
      return handleCollectCity(userId, text, platform, cfg);
    case "agent":
      return {
        messages: [{
          type: "button",
          body: "ההודעה שלך התקבלה 🙏\nנציג יחזור אליך בהקדם.",
          buttons: [{ id: "btn_menu", title: "חזרה לתפריט" }],
        }],
      };
    default:
      return { messages: [buildMainMenu(cfg)] };
  }
}

// ─── Idle / First Contact ────────────────────────────────────────────

function handleIdle(userId: string, text: string, cfg: BotConfig): BotResponse {
  setConv(userId, { state: "menu" });

  return {
    messages: [
      {
        type: "text",
        text: cfg.welcomeMessage,
      },
      buildMainMenu(cfg),
    ],
  };
}

// ─── Main Menu (Interactive List) ────────────────────────────────────

function buildMainMenu(cfg: BotConfig): WAListMessage {
  return {
    type: "list",
    body: cfg.menuBody,
    footer: cfg.menuFooter,
    buttonText: "📋 תפריט ראשי",
    sections: [
      {
        title: "מידע",
        rows: [
          { id: "menu_classes", title: "🏋️ החוגים שלנו", description: "מידע על כל החוגים והגילאים" },
          { id: "menu_pricing", title: "💰 מחירון", description: "מחירים ומבצעים" },
          { id: "menu_location", title: "📍 מיקום ושעות", description: "כתובת ושעות פעילות" },
        ],
      },
      {
        title: "פעולות",
        rows: [
          { id: "menu_trial", title: "🎯 שיעור ניסיון חינם", description: "הרשם עכשיו לשיעור ניסיון!" },
          { id: "menu_agent", title: "👨‍💼 דבר עם נציג", description: "קבל מענה אישי מנציג שלנו" },
        ],
      },
    ],
  };
}

// ─── Menu Selection Handler ──────────────────────────────────────────

function handleMenuSelection(userId: string, text: string, cfg: BotConfig): BotResponse {
  const selection = text.toLowerCase();

  if (selection === "menu_classes" || selection === "1") {
    setConv(userId, { state: "class_info" });
    return { messages: [buildClassesList(cfg)] };
  }

  if (selection === "menu_pricing" || selection === "2") {
    return { messages: [buildPricingMessage(cfg)] };
  }

  if (selection === "menu_trial" || selection === "3") {
    setConv(userId, { state: "collect_name" });
    return {
      messages: [{
        type: "text",
        text: "מעולה! 🎉 בואו נתאם שיעור ניסיון חינם!\n\nמה השם המלא שלך?",
      }],
    };
  }

  if (selection === "menu_location" || selection === "4") {
    return { messages: [buildLocationMessage(cfg)] };
  }

  if (selection === "menu_agent" || selection === "5") {
    setConv(userId, { state: "agent" });
    return {
      messages: [{
        type: "button",
        body: "👨‍💼 מעביר אותך לנציג...\nנחזור אליך בהקדם!\n\nבינתיים אפשר לשלוח כל שאלה.",
        buttons: [{ id: "btn_menu", title: "חזרה לתפריט" }],
      }],
    };
  }

  if (selection === "btn_menu") {
    setConv(userId, { state: "menu" });
    return { messages: [buildMainMenu(cfg)] };
  }

  if (/שלום|היי|הי|^hi$|^hello$|^start$/i.test(text)) {
    return handleIdle(userId, text, cfg);
  }

  return {
    messages: [{
      type: "button",
      body: "לא הבנתי 😅\nבחר אפשרות מהתפריט:",
      buttons: [
        { id: "btn_menu", title: "📋 תפריט ראשי" },
      ],
    }],
  };
}

// ─── Classes List ────────────────────────────────────────────────────

function buildClassesList(cfg: BotConfig): WAListMessage {
  return {
    type: "list",
    body: "🏋️ *החוגים שלנו*\n\nכל החוגים כוללים:\n✅ מאמנים מוסמכים\n✅ קבוצות קטנות\n✅ שיעור ניסיון חינם\n\nבחר חוג לפרטים נוספים:",
    footer: "בחר חוג מהרשימה 👇",
    buttonText: "📋 רשימת חוגים",
    sections: [
      {
        title: "החוגים",
        rows: cfg.classes.map((c) => ({
          id: `class_${c.id}`,
          title: `${c.emoji} ${c.name}`,
          description: `גילאי ${c.ages}`,
        })),
      },
    ],
  };
}

function handleClassInfo(userId: string, text: string, cfg: BotConfig): BotResponse {
  const selection = text.toLowerCase();

  const classMatch = cfg.classes.find(
    (c) => selection === `class_${c.id}` || selection === c.id
  );

  if (classMatch) {
    return {
      messages: [{
        type: "button",
        body: `${classMatch.emoji} *${classMatch.name}*\n\nגילאי: ${classMatch.ages}\n\n📅 ימים: א׳, ג׳, ה׳\n🕐 שעות: לפי קבוצות גיל\n👥 קבוצות קטנות עד 12 ילדים\n🏆 מאמנים מוסמכים עם ניסיון\n\n✨ שיעור ניסיון ראשון — חינם!`,
        footer: cfg.businessName,
        buttons: [
          { id: "menu_trial", title: "🎯 שיעור ניסיון" },
          { id: "menu_pricing", title: "💰 מחירון" },
          { id: "btn_menu", title: "📋 תפריט ראשי" },
        ],
      }],
    };
  }

  if (selection === "menu_trial" || selection === "menu_pricing" || selection === "btn_menu") {
    setConv(userId, { state: "menu" });
    return handleMenuSelection(userId, text, cfg);
  }

  return { messages: [buildClassesList(cfg)] };
}

// ─── Pricing ─────────────────────────────────────────────────────────

function buildPricingMessage(cfg: BotConfig): WAButtonMessage {
  const p = cfg.pricing;
  return {
    type: "button",
    body: `💰 *מחירון*\n\n📌 ${p.once.label} — ${p.once.price}\n📌 ${p.twice.label} — ${p.twice.price}\n📌 ${p.unlimited.label} — ${p.unlimited.price}\n\n${cfg.promoText}`,
    footer: cfg.businessName,
    buttons: [
      { id: "menu_trial", title: "🎯 שיעור ניסיון" },
      { id: "menu_classes", title: "🏋️ החוגים" },
      { id: "btn_menu", title: "📋 תפריט ראשי" },
    ],
  };
}

// ─── Location ────────────────────────────────────────────────────────

function buildLocationMessage(cfg: BotConfig): WAButtonMessage {
  const loc = cfg.location;
  return {
    type: "button",
    body: `📍 *מיקום ושעות פעילות*\n\n🏠 כתובת: ${loc.address}\n🕐 ${loc.hours}\n🚫 שבת: סגור\n\n🗺 ${loc.mapsLink}`,
    footer: cfg.businessName,
    buttons: [
      { id: "menu_trial", title: "🎯 שיעור ניסיון" },
      { id: "btn_menu", title: "📋 תפריט ראשי" },
    ],
  };
}

// ─── Trial Booking Flow (Conversational) ─────────────────────────────

function handleCollectName(userId: string, text: string): BotResponse {
  setConv(userId, { state: "collect_phone", name: text });
  return {
    messages: [{
      type: "text",
      text: `נעים מאוד ${text}! 😊\n\n📱 מה מספר הטלפון שלך?`,
    }],
  };
}

function handleCollectPhone(userId: string, text: string): BotResponse {
  const cleaned = text.replace(/[\s\-()]/g, "");
  if (!/^(\+?972|0)\d{8,9}$/.test(cleaned) && !/^\d{9,10}$/.test(cleaned)) {
    return {
      messages: [{
        type: "text",
        text: "🤔 המספר לא נראה תקין.\nנסה שוב בפורמט: 050-1234567",
      }],
    };
  }

  setConv(userId, { state: "collect_child_age", phone: cleaned });
  return {
    messages: [{
      type: "button",
      body: "👶 מה הגיל של הילד/ה?",
      buttons: [
        { id: "age_5_7", title: "5-7" },
        { id: "age_8_10", title: "8-10" },
        { id: "age_11_14", title: "11-14" },
      ],
    }],
  };
}

function handleCollectChildAge(userId: string, text: string): BotResponse {
  const ageMap: Record<string, string> = {
    age_5_7: "5-7",
    age_8_10: "8-10",
    age_11_14: "11-14",
  };
  const age = ageMap[text] || text;

  setConv(userId, { state: "collect_city", child_age: age });
  return {
    messages: [{
      type: "text",
      text: "🏙️ מאיזו עיר את/ה?",
    }],
  };
}

async function handleCollectCity(
  userId: string,
  text: string,
  platform: string,
  cfg: BotConfig
): Promise<BotResponse> {
  const conv = getConv(userId);
  const data = { ...conv, city: text };

  let leadSaved = false;
  try {
    const supabase = getServiceSupabase();
    await supabase.from("leads").insert({
      name: data.name || "",
      phone: data.phone || "",
      city: data.city || "",
      child_age: data.child_age ? parseInt(data.child_age) : null,
      source: platform,
      status: "interested",
      notes: `[צ׳אט בוט ${platform}] הרשמה לשיעור ניסיון. User: ${userId}`,
      follow_up_date: new Date().toISOString().split("T")[0],
    });
    leadSaved = true;
  } catch (err) {
    console.error("[Chatbot] Failed to save lead:", err);
  }

  setConv(userId, { state: "menu" });

  return {
    leadCreated: leadSaved,
    messages: [
      {
        type: "text",
        text: `✅ *נרשמת בהצלחה!*\n\n📋 סיכום:\n👤 שם: ${data.name}\n📱 טלפון: ${data.phone}\n👶 גיל: ${data.child_age}\n🏙️ עיר: ${data.city}\n\nנחזור אליך תוך 24 שעות לתיאום יום ושעה.\nתודה רבה! 💪`,
      },
      {
        type: "button",
        body: "רוצה לראות עוד משהו?",
        buttons: [
          { id: "menu_classes", title: "🏋️ החוגים" },
          { id: "menu_pricing", title: "💰 מחירון" },
          { id: "btn_menu", title: "📋 תפריט ראשי" },
        ],
      },
    ],
  };
}

// ─── Utility: Get Welcome Message ────────────────────────────────────

export async function getWelcomeMessage(): Promise<string> {
  const cfg = await loadConfig();
  return cfg.welcomeMessage;
}

