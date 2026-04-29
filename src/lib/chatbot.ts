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
  menuBody: "איך אפשר לעזות? בחר מהתפריט 👇",
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

// ─── AI Intent Detection ────────────────────────────────────────────

type Intent =
  | "classes"
  | "pricing"
  | "location"
  | "trial"
  | "agent"
  | "greeting"
  | "menu"
  | "unknown";

async function detectIntent(
  text: string,
  cfg: BotConfig
): Promise<{ intent: Intent; classId?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback to basic keyword matching when no API key
    return basicIntentDetection(text, cfg);
  }

  try {
    const classNames = cfg.classes
      .map((c) => `${c.id}: ${c.name}`)
      .join(", ");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 60,
        messages: [
          {
            role: "user",
            content: `אתה מסווג כוונות של לקוחות עבור עסק "${cfg.businessName}".
החוגים: ${classNames}

סווג את ההודעה הבאה לאחת מהקטגוריות: classes, pricing, location, trial, agent, greeting, menu, unknown.
אם הלקוח שואל על חוג ספציפי, החזר גם את ה-id שלו.

הודעת הלקוח: "${text}"

החזר JSON בלבד: {"intent":"...", "classId":"..."} (classId רק אם רלוונטי)`,
          },
        ],
      }),
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    const content = data?.content?.[0]?.text || "";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const validIntents: Intent[] = [
        "classes",
        "pricing",
        "location",
        "trial",
        "agent",
        "greeting",
        "menu",
        "unknown",
      ];
      if (validIntents.includes(parsed.intent)) {
        return {
          intent: parsed.intent,
          classId: parsed.classId || undefined,
        };
      }
    }
  } catch (err) {
    console.warn("[Chatbot] AI intent detection failed, using fallback:", err);
  }

  // Fallback to basic keyword matching
  return basicIntentDetection(text, cfg);
}

function basicIntentDetection(
  text: string,
  cfg: BotConfig
): { intent: Intent; classId?: string } {
  const t = text.toLowerCase();

  // Greeting
  if (/^(שלום|היי|הי|hi|hello|start|בוקר טוב|ערב טוב|מה נשמע)$/i.test(t)) {
    return { intent: "greeting" };
  }

  // Pricing keywords
  if (/מחיר|עלות|כמה (זה )? עולה|תעריף|הנחה|מבצצע|עולה|תשלום|מנוי/.test(t)) {
    return { intent: "pricing" };
  }

  // Location keywords
  if (/כתובת|איפה|מיקום|הגעה|שעות|פתוח|סגור|מפה|ניווט|דרכי הגעה/.test(t)) {
    return { intent: "location" };
  }

  // Trial keywords
  if (/ניסיון|נסיון|לנסות|להירשם|הרשמה|רישום|להתחיל|רוצה להצטרף|הצטרפות/.test(t)) {
    return { intent: "trial" };
  }

  // Agent keywords
  if (/נציג|אדם|בן ?אדם|אישי|לדבר עם|טלפון|התקשרו|תתקשרו/.test(t)) {
    return { intent: "agent" };
  }

  // Menu keywords
  if (/תפריט|menu|אפשרויות|מה יש|מה אפשר/.test(t)) {
    return { intent: "menu" };
  }

  // Check for specific class names
  for (const c of cfg.classes) {
    if (t.includes(c.name) || t.includes(c.id)) {
      return { intent: "classes", classId: c.id };
    }
  }

  // General classes keywords
  if (/חוג|חוגים|שיעור|שיעורים|פעילות|פעילויות|אימון|אימונים|קבוצ/.test(t)) {
    return { intent: "classes" };
  }

  return { intent: "unknown" };
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

const conversations = new Map<string, ConversationData & { lastActivity?: number }>();

const CONV_TTL = 30 * 60 * 1000; // 30 min
function cleanupConversations() {
  const now = Date.now();
  const keysToDelete: string[] = [];
  conversations.forEach((conv, key) => {
    if (now - (conv.lastActivity || 0) > CONV_TTL) keysToDelete.push(key);
  });
  keysToDelete.forEach((k) => conversations.delete(k));
}

function getConv(userId: string): ConversationData {
  return conversations.get(userId) || { state: "idle" };
}

function setConv(userId: string, data: Partial<ConversationData>) {
  const current = getConv(userId);
  conversations.set(userId, { ...current, ...data, lastActivity: Date.now() });
}

// ─── Main Entry Point ────────────────────────────────────────────────

export async function processMessage(
  userId: string,
  message: string,
  platform: "whatsapp" | "messenger" | "instagram"
): Promise<BotResponse> {
  if (conversations.size > 500) cleanupConversations();

  const text = message.trim();
  const conv = getConv(userId);
  const cfg = await loadConfig();

  // Global commands
  if (text === "menu" || text === "ת֤ריט" || text === "0") {
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

async function handleIdle(userId: string, text: string, cfg: BotConfig): Promise<BotResponse> {
  // Try AI intent detection on first message
  const { intent, classId } = await detectIntent(text, cfg);

  if (intent !== "unknown" && intent !== "greeting") {
    // User asked something specific — route directly
    setConv(userId, { state: "menu" });
    return routeByIntent(userId, intent, classId, cfg);
  }

  // Default: show welcome + menu
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

async function handleMenuSelection(userId: string, text: string, cfg: BotConfig): Promise<BotResponse> {
  // Handle button/list callbacks AND free text
  const selection = text.toLowerCase();

  // Classes
  if (selection === "menu_classes" || selection === "1") {
    setConv(userId, { state: "class_info" });
    return { messages: [buildClassesList(cfg)] };
  }

  // Pricing
  if (selection === "menu_pricing" || selection === "2") {
    return { messages: [buildPricingMessage(cfg)] };
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
    return { messages: [buildLocationMessage(cfg)] };
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
    return { messages: [buildMainMenu(cfg)] };
  }

  // ─── AI Intent Detection for free text ────────────────────────────
  const { intent, classId } = await detectIntent(text, cfg);

  if (intent !== "unknown") {
    return routeByIntent(userId, intent, classId, cfg);
  }

  // Truly unknown — show menu
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

// ─── Route by Detected Intent ───────────────────────────────────────

function routeByIntent(
  userId: string,
  intent: Intent,
  classId: string | undefined,
  cfg: BotConfig
): BotResponse {
  switch (intent) {
    case "classes":
      if (classId) {
        const classMatch = cfg.classes.find((c) => c.id === classId);
        if (classMatch) {
          setConv(userId, { state: "class_info" });
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
      }
      setConv(userId, { state: "class_info" });
      return { messages: [buildClassesList(cfg)] };

    case "pricing":
      return { messages: [buildPricingMessage(cfg)] };

    case "location":
      return { messages: [buildLocationMessage(cfg)] };

    case "trial":
      setConv(userId, { state: "collect_name" });
      return {
        messages: [{
          type: "text",
          text: "מעולה! 🎉 בואו נתאם שיעור ניסיון חינם!\n\nמה השם המלא שלך?",
        }],
      };

    case "agent":
      setConv(userId, { state: "agent" });
      return {
        messages: [{
          type: "button",
          body: "👨‍💼 מעביר אותך לנציג...\nנחזות אליך בהקדם!\n\nבינתיים אפשר לשלוח כל שאלה.",
          buttons: [{ id: "btn_menu", title: "חזרה לתפריט" }],
        }],
      };

    case "greeting":
      setConv(userId, { state: "menu" });
      return {
        messages: [
          { type: "text", text: cfg.welcomeMessage },
          buildMainMenu(cfg),
        ],
      };

    case "menu":
      setConv(userId, { state: "menu" });
      return { messages: [buildMainMenu(cfg)] };

    default:
      return { messages: [buildMainMenu(cfg)] };
  }
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

async function handleClassInfo(userId: string, text: string, cfg: BotConfig): Promise<BotResponse> {
  const selection = text.toLowerCase();

  // Check if user selected a specific class
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

  // Handle button callbacks from class detail view
  if (selection === "menu_trial" || selection === "menu_pricing" || selection === "btn_menu") {
    setConv(userId, { state: "menu" });
    return handleMenuSelection(userId, text, cfg);
  }

  // Back to class list
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
  platform: string,
  cfg: BotConfig
): Promise<BotResponse> {
  const conv = getConv(userId);
  const data = { ...conv, city: text };

  // Save lead to Supabase (with one retry)
  let leadSaved = false;
  const supabase = getServiceSupabase();
  const leadPayload = {
    name: data.name || "",
    phone: data.phone || "",
    city: data.city || "",
    child_age: data.child_age ? parseInt(data.child_age) : null,
    source: platform,
    status: "interested",
    notes: `[צ׳אט בוט ${platform}] הרשמה לשיעור ניסיון. User: ${userId}`,
    follow_up_date: new Date().toISOString().split("T")[0],
  };

  try {
    const { error } = await supabase.from("leads").insert(leadPayload);
    if (error) throw error;
    leadSaved = true;
  } catch (err) {
    console.warn("[Chatbot] Lead save failed, retrying in 1s:", err);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      const { error } = await supabase.from("leads").insert(leadPayload);
      if (error) throw error;
      leadSaved = true;
    } catch (retryErr) {
      console.error("[Chatbot] Lead save retry also failed:", retryErr);
    }
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

export async function getWelcomeMessage(): Promise<string> {
  const cfg = await loadConfig();
  return cfg.welcomeMessage;
}
