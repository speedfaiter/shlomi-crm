// WhatsApp automation — zero external services
// Uses wa.me direct links: opens WhatsApp with a pre-filled message
// Works on desktop (WhatsApp Web) and mobile (WhatsApp app)

// ─── Hebrew Message Templates ─────────────────────────────────────────

export const TEMPLATES: Record<string, { label: string; build: (name: string) => string }> = {
  welcome: {
    label: "הודעת ברוכים הבאים",
    build: (name) =>
      `שלום ${name}! 👋\nקיבלנו את הפנייה שלך בנוגע לחוגי כושר לילדים.\nנציג שלנו ייצור איתך קשר בהקדם.\nתודה! 🏋️`,
  },
  follow_up_1: {
    label: "מעקב ראשון (יום 1)",
    build: (name) =>
      `היי ${name}, כאן צוות כושר הילדים 💪\nראינו שהשארת פרטים אצלנו — רצינו לשמוע אם יש לך שאלות?\nנשמח לספר על החוגים ולתאם שיעור ניסיון חינם!`,
  },
  follow_up_2: {
    label: "מעקב שני (יום 3)",
    build: (name) =>
      `שלום ${name} 😊\nעדיין לא הספקנו לדבר — רצינו להזכיר שיש לנו שיעורי ניסיון חינם לילדים!\nאם מתאים לך, אפשר לתאם ביום ובשעה שנוחים לך.\nמה אומר/ת?`,
  },
  follow_up_3: {
    label: "מעקב שלישי (יום 7)",
    build: (name) =>
      `היי ${name}, הודעה אחרונה מאיתנו 🙏\nלא רצינו להפריע — רק להזכיר שאנחנו כאן אם תרצה/י לשמוע על החוגים.\nשיהיה לך יום מעולה! ⭐`,
  },
  reminder: {
    label: "תזכורת שיעור ניסיון",
    build: (name) =>
      `שלום ${name}, תזכורת: יש לך שיעור ניסיון שנקבע!\nמחכים לך 💪🏋️`,
  },
};

// The follow-up sequence: template key + days after lead creation
export const FOLLOW_UP_SEQUENCE = [
  { template: "follow_up_1", daysAfter: 1 },
  { template: "follow_up_2", daysAfter: 3 },
  { template: "follow_up_3", daysAfter: 7 },
];

// ─── Phone Normalization (Israel) ─────────────────────────────────────

export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, "");
  // Remove leading + if present
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  }
  // Convert local Israeli number to international
  if (cleaned.startsWith("0")) {
    cleaned = "972" + cleaned.slice(1);
  }
  // If it's just digits without country code, assume Israel
  if (cleaned.length === 9) {
    cleaned = "972" + cleaned;
  }
  return cleaned;
}

// ─── Build wa.me Link ─────────────────────────────────────────────────

export function buildWhatsAppLink(phone: string, message: string): string {
  const normalized = normalizePhone(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encoded}`;
}

// Build a link from a template
export function buildTemplateLink(phone: string, templateKey: string, name: string): string {
  const template = TEMPLATES[templateKey];
  if (!template) return buildWhatsAppLink(phone, "");
  return buildWhatsAppLink(phone, template.build(name));
}
