// âââ Chatbot Engine v2 â Interactive Buttons & Lists âââââââââââââââââ
// Returns structured WhatsApp Cloud API message objects:
// - text messages
// - interactive buttons (up to 3 buttons)
// - interactive lists (up to 10 rows in sections)
// Works across WhatsApp, Messenger, and Instagram (degrades to text for non-WA)

import { getServiceSupabase } from "./supabase";

// âââ Message Types âââââââââââââââââââââââââââââââââââââââââââââââââââ

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
  buttonText: string; // max 20 chars â the CTA button label
  sections: WAListSection[];
}

export type BotMessage = WATextMessage | WAButtonMessage | WAListMessage;

export interface BotResponse {
  messages: BotMessage[];
  leadCreated?: boolean;
}

// âââ Bot Configuration âââââââââââââââââââââââââââââââââââââââââââââââ

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
  businessName: "×××©×¨ ×××× ×× ×××××",
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
    hours: "××-××³ 14:00-20:00 | ××³ 09:00-13:00",
    mapsLink: "[××× ×¡ ×§××©××¨ Google Maps]",
  },
  welcomeMessage: "×©×××! ð ××¨×××× ××××× ×*×××©×¨ ×××× ×× ×××××*!",
  menuBody: "××× ××¤×©×¨ ××¢×××¨? ×××¨ ×××ª×¤×¨×× ð",
  menuFooter: "×××©×¨ ×××× ×× ××××× ðï¸",
  promoText: "ð *×××¦×¢ ××¦××¨×¤××ª:*\n××××© ×¨××©×× ×-50% ×× ××!",
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

// âââ AI Intent Detection ââââââââââââââââââââââââââââââââââââââââââââ

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
            content: `××ª× ××¡××× ×××× ××ª ×©× ××§××××ª ×¢×××¨ ×¢×¡×§ "${cfg.businessName}".
××××××: ${classNames}

×¡××× ××ª ×××××¢× ×××× ××××ª ×××§××××¨×××ª: classes, pricing, location, trial, agent, greeting, menu, unknown.
×× ×××§×× ×©××× ×¢× ××× ×¡×¤×¦××¤×, ××××¨ ×× ××ª ×-id ×©××.

××××¢×ª ×××§××: "${text}"

××××¨ JSON ××××: {"intent":"...", "classId":"..."} (classId ×¨×§ ×× ×¨×××× ××)`,
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
  if (/^(×©×××|×××|××|hi|hello|start|×××§×¨ ×××|×¢×¨× ×××|×× × ×©××¢)$/i.test(t)) {
    return { intent: "greeting" };
  }

  // Pricing keywords
  if (/××××¨|×¢×××ª|××× (×× )?×¢×××|×ª×¢×¨××£|×× ××|×××¦×¢|×¢×××|×ª×©×××|×× ××/.test(t)) {
    return { intent: "pricing" };
  }

  // Location keywords
  if (/××ª×××ª|×××¤×|×××§××|×××¢×|×©×¢××ª|×¤×ª××|×¡×××¨|××¤×|× ××××|××¨×× ×××¢×/.test(t)) {
    return { intent: "location" };
  }

  // Trial keywords
  if (/× ××¡×××|× ×¡×××|×× ×¡××ª|××××¨×©××|×¨××©××|×××ª×××|×¨××¦× ×××¦××¨×£|××¦××¨×¤××ª/.test(t)) {
    return { intent: "trial" };
  }

  // Agent keywords
  if (/× ×¦××|×××|×× ?×××|×××©×|××××¨ ×¢×|×××¤××|××ª×§×©×¨×|×ª×ª×§×©×¨×/.test(t)) {
    return { intent: "agent" };
  }

  // Menu keywords
  if (/×ª×¤×¨××|menu|××¤×©×¨××××ª|×× ××©|×× ××¤×©×¨/.test(t)) {
    return { intent: "menu" };
  }

  // Check for specific class names
  for (const c of cfg.classes) {
    if (t.includes(c.name) || t.includes(c.id)) {
      return { intent: "classes", classId: c.id };
    }
  }

  // General classes keywords
  if (/×××|×××××|×©××¢××¨|×©××¢××¨××|×¤×¢××××ª|×¤×¢××××××ª|×××××|××××× ××|×§×××¦/.test(t)) {
    return { intent: "classes" };
  }

  return { intent: "unknown" };
}

// âââ Conversation State Machine ââââââââââââââââââââââââââââââââââââââ

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

// âââ Main Entry Point ââââââââââââââââââââââââââââââââââââââââââââââââ

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
  if (text === "menu" || text === "×ªÖ¤×¨××" || text === "0") {
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
          body: "×××××¢× ×©×× ××ª×§××× ð\n× ×¦×× ×××××¨ ×××× ×××§××.",
          buttons: [{ id: "btn_menu", title: "×××¨× ××ª×¤×¨××" }],
        }],
      };
    default:
      return { messages: [buildMainMenu(cfg)] };
  }
}

// âââ Idle / First Contact ââââââââââââââââââââââââââââââââââââââââââââ

async function handleIdle(userId: string, text: string, cfg: BotConfig): Promise<BotResponse> {
  // Try AI intent detection on first message
  const { intent, classId } = await detectIntent(text, cfg);

  if (intent !== "unknown" && intent !== "greeting") {
    // User asked something specific â route directly
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

// âââ Main Menu (Interactive List) ââââââââââââââââââââââââââââââââââââ

function buildMainMenu(cfg: BotConfig): WAListMessage {
  return {
    type: "list",
    body: cfg.menuBody,
    footer: cfg.menuFooter,
    buttonText: "ð ×ªÖ¤×¨×× ×¨××©×",
    sections: [
      {
        title: "××××¢",
        rows: [
          { id: "menu_classes", title: "ðï¸ ×××××× ×©×× ×", description: "××××¢ ×¢× ×× ×××××× ××××××××" },
          { id: "menu_pricing", title: "ð° ××××¨××", description: "××××¨×× ××××¦×¢××" },
          { id: "menu_location", title: "ð ×××§×× ××©×¢××ª", description: "××ª×××ª ××©×¢××ª ×¤×¢××××ª" },
        ],
      },
      {
        title: "×¤×¢××××ª",
        rows: [
          { id: "menu_trial", title: "ð¯ ×©××¢××¨ × ××¡××× ××× ×", description: "××¨×©× ×¢××©×× ××©××¢××¨ × ××¡×××!" },
          { id: "menu_agent", title: "ð¨âð¼ ×××¨ ×¢× × ×¦××", description: "×§×× ××¢× × ×××©× ×× ×¦×× ×©×× ×" },
        ],
      },
    ],
  };
}

// âââ Menu Selection Handler ââââââââââââââââââââââââââââââââââââââââââ

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
        text: "××¢×××! ð ×××× × ×ª×× ×©××¢××¨ × ××¡××× ××× ×!\n\n×× ××©× ×××× ×©××?",
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
        body: "ð¨âð¼ ××¢×××¨ ×××ª× ×× ×¦××...\n× ××××¨ ×××× ×××§××!\n\n××× ×ª××× ××¤×©×¨ ××©××× ×× ×©×××.",
        buttons: [{ id: "btn_menu", title: "×××¨× ××ªÖ¤×¨××" }],
      }],
    };
  }

  // Back to menu from buttons
  if (selection === "btn_menu") {
    setConv(userId, { state: "menu" });
    return { messages: [buildMainMenu(cfg)] };
  }

  // âââ AI Intent Detection for free text ââââââââââââââââââââââââââââ
  const { intent, classId } = await detectIntent(text, cfg);

  if (intent !== "unknown") {
    return routeByIntent(userId, intent, classId, cfg);
  }

  // Truly unknown â show menu
  return {
    messages: [{
      type: "button",
      body: "×× ××× ×ª× ð\n×××¨ ××¤×©×¨××ª ×××ªÖ¤×¨××:",
      buttons: [
        { id: "btn_menu", title: "ð ×ª×¤×¨×× ×¨××©×" },
      ],
    }],
  };
}

// âââ Route by Detected Intent âââââââââââââââââââââââââââââââââââââââ

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
              body: `${classMatch.emoji} *${classMatch.name}*\n\n×××××: ${classMatch.ages}\n\nð ××××: ××³, ××³, ××³\nð ×©×¢××ª: ××¤× ×§×××¦××ª ×××\nð¥ ×§×××¦××ª ×§×× ××ª ×¢× 12 ×××××\nð ×××× ×× ×××¡×××× ×¢× × ××¡×××\n\nâ¨ ×©××¢××¨ × ××¡××× ×¨××©×× â ××× ×!`,
              footer: cfg.businessName,
              buttons: [
                { id: "menu_trial", title: "ð¯ ×©××¢××¨ × ××¡×××" },
                { id: "menu_pricing", title: "ð° ××××¨××" },
                { id: "btn_menu", title: "ð ×ª×¤×¨×× ×¨××©×" },
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
          text: "××¢×××! ð ×××× × ×ª×× ×©××¢××¨ × ××¡××× ××× ×!\n\n×× ××©× ×××× ×©××?",
        }],
      };

    case "agent":
      setConv(userId, { state: "agent" });
      return {
        messages: [{
          type: "button",
          body: "ð¨âð¼ ××¢×××¨ ×××ª× ×× ×¦××...\n× ××××¨ ×××× ×××§××!\n\n××× ×ª××× ××¤×©×¨ ××©××× ×× ×©×××.",
          buttons: [{ id: "btn_menu", title: "×××¨× ××ª×¤×¨××" }],
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

// âââ Classes List ââââââââââââââââââââââââââââââââââââââââââââââââââââ

function buildClassesList(cfg: BotConfig): WAListMessage {
  return {
    type: "list",
    body: "ðï¸ *×××××× ×©×× ×*\n\n×× ×××××× ××××××:\nâ ×××× ×× ×××¡××××\nâ ×§×××¦××ª ×§×× ××ª\nâ ×©××¢××¨ × ××¡××× ××× ×\n\n×××¨ ××× ××¤×¨××× × ××¡×¤××:",
    footer: "×××¨ ××× ×××¨×©××× ð",
    buttonText: "ð ×¨×©×××ª ×××××",
    sections: [
      {
        title: "××××××",
        rows: cfg.classes.map((c) => ({
          id: `class_${c.id}`,
          title: `${c.emoji} ${c.name}`,
          description: `××××× ${c.ages}`,
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
        body: `${classMatch.emoji} *${classMatch.name}*\n\n×××××: ${classMatch.ages}\n\nð ××××: ××³, ××³, ××³\nð ×©×¢××ª: ××¤× ×§×××¦××ª ×××\nð¥ ×§×××¦××ª ×§×× ××ª ×¢× 12 ×××××\nð ×××× ×× ×××¡×××× ×¢× × ××¡×××\n\nâ¨ ×©××¢××¨ × ××¡××× ×¨××©×× â ××× ×!`,
        footer: cfg.businessName,
        buttons: [
          { id: "menu_trial", title: "ð¯ ×©××¢××¨ × ××¡×××" },
          { id: "menu_pricing", title: "ð° ××××¨××" },
          { id: "btn_menu", title: "ð ×ª×¤×¨×× ×¨××©×" },
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

// âââ Pricing âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function buildPricingMessage(cfg: BotConfig): WAButtonMessage {
  const p = cfg.pricing;
  return {
    type: "button",
    body: `ð° *××××¨××*\n\nð ${p.once.label} â ${p.once.price}\nð ${p.twice.label} â ${p.twice.price}\nð ${p.unlimited.label} â ${p.unlimited.price}\n\n${cfg.promoText}`,
    footer: cfg.businessName,
    buttons: [
      { id: "menu_trial", title: "ð¯ ×©××¢××¨ × ××¡×××" },
      { id: "menu_classes", title: "ðï¸ ××××××" },
      { id: "btn_menu", title: "ð ×ª×¤×¨×× ×¨××©×" },
    ],
  };
}

// âââ Location ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function buildLocationMessage(cfg: BotConfig): WAButtonMessage {
  const loc = cfg.location;
  return {
    type: "button",
    body: `ð *×××§×× ××©×¢××ª ×¤×¢××××ª*\n\nð  ××ª×××ª: ${loc.address}\nð ${loc.hours}\nð« ×©××ª: ×¡×××¨\n\nðº ${loc.mapsLink}`,
    footer: cfg.businessName,
    buttons: [
      { id: "menu_trial", title: "ð¯ ×©××¢××¨ × ××¡×××" },
      { id: "btn_menu", title: "ð ×ª×¤×¨×× ×¨××©×" },
    ],
  };
}

// âââ Trial Booking Flow (Conversational) âââââââââââââââââââââââââââââ

function handleCollectName(userId: string, text: string): BotResponse {
  setConv(userId, { state: "collect_phone", name: text });
  return {
    messages: [{
      type: "text",
      text: `× ×¢×× ×××× ${text}! ð\n\nð± ×× ××¡×¤×¨ ××××¤×× ×©××?`,
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
        text: "ð¤ ×××¡×¤×¨ ×× × ×¨×× ×ª×§××.\n× ×¡× ×©×× ××¤××¨××: 050-1234567",
      }],
    };
  }

  setConv(userId, { state: "collect_child_age", phone: cleaned });
  return {
    messages: [{
      type: "button",
      body: "ð¶ ×× ×××× ×©× ××××/×?",
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
      text: "ðï¸ ××××× ×¢××¨ ××ª/×?",
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
    notes: `[×¦×³×× ××× ${platform}] ××¨×©×× ××©××¢××¨ × ××¡×××. User: ${userId}`,
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
        text: `â *× ×¨×©××ª ×××¦×××!*\n\nð ×¡××××:\nð¤ ×©×: ${data.name}\nð± ×××¤××: ${data.phone}\nð¶ ×××: ${data.child_age}\nðï¸ ×¢××¨: ${data.city}\n\n× ××××¨ ×××× ×ª×× 24 ×©×¢××ª ××ª×××× ××× ××©×¢×.\n×ª××× ×¨××! ðª`,
      },
      {
        type: "button",
        body: "×¨××¦× ××¨×××ª ×¢×× ××©××?",
        buttons: [
          { id: "menu_classes", title: "ðï¸ ××××××" },
          { id: "menu_pricing", title: "ð° ××××¨××" },
          { id: "btn_menu", title: "ð ×ª×¤×¨×× ×¨××©×" },
        ],
      },
    ],
  };
}

// âââ Utility: Get Welcome Message ââââââââââââââââââââââââââââââââââââ

export async function getWelcomeMessage(): Promise<string> {
  const cfg = await loadConfig();
  return cfg.welcomeMessage;
}
