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

export const BOT_CONFIG = {
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
};

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

  // Global commands
  if (text === "menu" || text === "תפריט" || text === "0") {
    setConv(userId, { state: "menu" });
    return { messages: [buildMainMenu()] };
  }

  // Route by state
  switch (conv.state) {
    case "idle":
      return handleIdle(userId, text);
    case "menu":
      return handleMenuSelection(userId, text);
    case "class_info":
      return handleClassInfo(userId, text);
    case "collect_name":
      return handleCollectName(userId, text);
    case "collect_phone":
      return handleCollectPhone(userId, text);
    case "collect_child_age":
      return handleCollectChildAge(userId, text);
    case "collect_city":
      return handleCollectCity(userId, text, platform);
    case "agent":
      return {
        messages: [{
          type: "button",
          body: "ההודעה שלך התקבלה 🙏\nנציג יחזור אליך בהקדם.",
          buttons: [{ id: "btn_menu", title: "חזרה לתפריט" }],
        }],
      };
    default:
      return { messages: [buildMainMenu()] };
  }
}

// ─── Idle / First Contact ────────────────────────────────────────────

function handleIdle(userId: string, text: string): BotResponse {
  setConv(userId, { state: "menu" });

  return {
    messages: [
      {
        type: "text",
        text: `שלום! 👋 ברוכים הבאים ל*${BOT_CONFIG.businessName}*!`,
      },
      buildMainMenu(),
    ],
  };
}

// ─── Main Menu (Interactive List) ────────────────────────────────────

function buildMainMenu(): WAListMessage {
  return {
    type: "list",
    body: "איך אפשר לעזור? בחר מהתפריט 👇",
    footer: "כושר וחינוך ילדים 🏋️",
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

function handleMenuSelection(userId: string, text: string): BotResponse {
  // Handle button/list callbacks AND free text
  const selection = text.toLowerCase();

  // Classes
  if (selection === "menu_classes" || selection === "1") {
    setConv(userId, { state: "class_info" });
    return { messages: [buildClassesList()] };
  }

  // Pricing
  if (selection === "menu_pricing" || selection === "2") {
    return { messages: [buildPricingMessage()] };
  }

  // Trial
  if (selection === "menu_trial" || selection === "3") {
    setConv(userId, { state: "collect_name" });
    return {
      messages: [{
        type: "text",
        text: "מעולה! 🎉 בואו נתאם שיעור ניסיון חינם!\n\nמה השם המלא שלך?",
      }],
    };
  }

  // Location
  if (selection === "menu_location" || selection === "4") {
    return { messages: [buildLocationMessage()] };
  }

  // Agent
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

  // Back to menu from buttons
  if (selection === "btn_menu") {
    setConv(userId, { state: "menu" });
    return { messages: [buildMainMenu()] };
  }

  // Greeting
  if (/שלום|היי|הי|^hi$|^hello$|^start$/i.test(text)) {
    return handleIdle(userId, text);
  }

  // Unknown
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

function buildClassesList(): WAListMessage {
  return {
    type: "list",
    body: "🏋️ *החוגים שלנו*\n\nכל החוגים כוללים:\n✅ מאמנים מוסמכים\n✅ קבוצות קטנות\n✅ שיעור ניסיון חינם\n\nבחר חוג לפרטים נוספים:",
    footer: "בחר חוג מהרשימה 👇",
    buttonText: "📋 רשימת חוגים",
    sections: [
      {
        title: "החוגים",
        rows: BOT_CONFIG.classes.map((c) => ({
          id: `class_${c.id}`,
          title: `${c.emoji} ${c.name}`,
          description: `גילאי ${c.ages}`,
        })),
      },
    ],
  };
}

function handleClassInfo(userId: string, text: string): BotResponse {
  const selection = text.toLowerCase();

  // Check if user selected a specific class
  const classMatch = BOT_CONFIG.classes.find(
    (c) => selection === `class_${c.id}` || selection === c.id
  );

  if (classMatch) {
    return {
      messages: [{
        type: "button",
        body: `${classMatch.emoji} *${classMatch.name}*\n\nגילאי: ${classMatch.ages}\n\n📅 ימים: א׳, ג׳, ה׳\n🕐 שעות: לפי קבוצות גיל\n👥 קבוצות קטנות עד 12 ילדים\n🏆 מאמנים מוסמכים עם ניסיון\n\n✨ שיעור ניסיון ראשון — חינם!`,
        footer: BOT_CONFIG.businessName,
        buttons: [
          { id: "menu_trial", title: "🎯 שיעור ניסיון" },
          { id: "menu_pricing", title: "💰 מחירון" },
          { id: "btn_menu", title: "📋 תפריט ראשי" },
        ],
      }],
    };
  }

  // Handle button callbacks from class detail view
  if (selection === "menu_trial" || selection === "menu_pricing" || selection === "btn_menu") {
    setConv(userId, { state: "menu" });
    return handleMenuSelection(userId, text);
  }

  // Back to class list
  return { messages: [buildClassesList()] };
}

// ─── Pricing ─────────────────────────────────────────────────────────

function buildPricingMessage(): WAButtonMessage {
  const p = BOT_CONFIG.pricing;
  return {
    type: "button",
    body: `💰 *מחירון*\n\n📌 ${p.once.label} — ${p.once.price}\n📌 ${p.twice.label} — ${p.twice.price}\n📌 ${p.unlimited.label} — ${p.unlimited.price}\n\n🎁 *מבצע הצטרפות:*\nחודש ראשון ב-50% הנחה!`,
    footer: BOT_CONFIG.businessName,
    buttons: [
      { id: "menu_trial", title: "🎯 שיעור ניסיון" },
      { id: "menu_classes", title: "🏋️ החוגים" },
      { id: "btn_menu", title: "📋 תפריט ראשי" },
    ],
  };
}

// ─── Location ────────────────────────────────────────────────────────

function buildLocationMessage(): WAButtonMessage {
  const loc = BOT_CONFIG.location;
  return {
    type: "button",
    body: `📍 *מיקום ושעות פעילות*\n\n🏠 כתובת: ${loc.address}\n🕐 ${loc.hours}\n🚫 שבת: סגור\n\n🗺 ${loc.mapsLink}`,
    footer: BOT_CONFIG.businessName,
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
  // Basic phone validation
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
  // Accept button IDs or free text
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
  platform: string
): Promise<BotResponse> {
  const conv = getConv(userId);
  const data = { ...conv, city: text };

  // Save lead to Supabase
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

  // Reset conversation
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

export function getWelcomeMessage(): string {
  return `שלום! 👋 ברוכים הבאים ל*${BOT_CONFIG.businessName}*!`;
}
