"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface ClassItem {
  id: string;
  name: string;
  ages: string;
  emoji: string;
}

interface BotConfigData {
  business_name: string;
  classes: ClassItem[];
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
  welcome_message: string;
  menu_body: string;
  menu_footer: string;
  promo_text: string;
}

export default function BotConfigPage() {
  const [config, setConfig] = useState<BotConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Test chat
  const [testMessage, setTestMessage] = useState("");
  const [chatLog, setChatLog] = useState<Array<{ role: string; text: string }>>([]);
  const [testing, setTesting] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/bot/config");
      const data = await res.json();
      setConfig(data);
    } catch {
      setError("שגיאה בטעינת ההגדרות");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  const handleSave = async () => {
    if (!config) return;
    if (!config.business_name.trim()) {
      setError("שם העסק לא יכול להיות ריק");
      return;
    }
    setSaving(true);
    setSaved(false);
    setSaveMsg("");
    setError("");

    try {
      const res = await fetch("/api/bot/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setSaveMsg("נשמר בהצלחה!");
      setTimeout(() => { setSaved(false); setSaveMsg(""); }, 3000);
    } catch {
      setError("שגיאה בשמירת ההגדרות");
    } finally {
      setSaving(false);
    }
  };

  const updateClass = (index: number, field: keyof ClassItem, value: string) => {
    if (!config) return;
    const updated = [...config.classes];
    updated[index] = { ...updated[index], [field]: value };
    setConfig({ ...config, classes: updated });
  };

  const addClass = () => {
    if (!config) return;
    const newId = `class_${Date.now()}`;
    setConfig({
      ...config,
      classes: [...config.classes, { id: newId, name: "", ages: "", emoji: "🏋️" }],
    });
  };

  const removeClass = (index: number) => {
    if (!config) return;
    const updated = config.classes.filter((_, i) => i !== index);
    setConfig({ ...config, classes: updated });
  };

  const handleTest = async () => {
    if (!testMessage.trim()) return;
    setTesting(true);
    setChatLog((prev) => [...prev, { role: "user", text: testMessage }]);

    try {
      const res = await fetch("/api/bot/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: testMessage, userId: "test_user" }),
      });
      const data = await res.json();
      setChatLog((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch {
      setChatLog((prev) => [...prev, { role: "bot", text: "שגיאה בבדיקה" }]);
    }

    setTestMessage("");
    setTesting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">טוען הגדרות...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error || "שגיאה בטעינה"}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">הגדרות צ׳אט בוט</h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-600 text-sm font-medium">נשמר בהצלחה!</span>}
          {error && <span className="text-red-600 text-sm">{error}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-dark transition text-sm disabled:opacity-50 font-medium"
          >
            {saving ? "שומר..." : "שמור שינויים"}
          </button>
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700">חזרה ללידים →</a>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-sm text-gray-600">WhatsApp</p>
          <p className="text-lg font-bold text-green-700">
            {process.env.NEXT_PUBLIC_WHATSAPP_CONNECTED === "true" ? "מחובר" : "ממתין לחיבור"}
          </p>
          <p className="text-xs text-gray-500 mt-1">/api/webhooks/whatsapp</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-sm text-gray-600">Messenger</p>
          <p className="text-lg font-bold text-blue-700">ממתין לחיבור</p>
          <p className="text-xs text-gray-500 mt-1">/api/webhooks/messenger</p>
        </div>
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <p className="text-sm text-gray-600">Instagram</p>
          <p className="text-lg font-bold text-purple-700">ממתין לחיבור</p>
          <p className="text-xs text-gray-500 mt-1">דרך webhook של Messenger</p>
        </div>
      </div>

      {/* Business Name */}
      <Section title="שם העסק">
        <input
          type="text"
          value={config.business_name}
          onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="שם העסק"
        />
      </Section>

      {/* Messages */}
      <Section title="הודעות הבוט">
        <div className="space-y-4">
          <Field label="הודעת ברכה (כשלקוח כותב לראשונה)">
            <textarea
              value={config.welcome_message}
              onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm h-20 resize-y"
              dir="rtl"
            />
          </Field>
          <Field label="טקסט תפריט ראשי">
            <input
              type="text"
              value={config.menu_body}
              onChange={(e) => setConfig({ ...config, menu_body: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </Field>
          <Field label="כיתוב תחתון (footer)">
            <input
              type="text"
              value={config.menu_footer}
              onChange={(e) => setConfig({ ...config, menu_footer: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </Field>
          <Field label="טקסט מבצע (מופיע במחירוס)">
            <textarea
              value={config.promo_text}
              onChange={(e) => setConfig({ ...config, promo_text: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm h-20 resize-y"
              dir="rtl"
            />
          </Field>
        </div>
      </Section>

      {/* Classes */}
      <Section title="חוגים" action={
        <button onClick={addClass} className="text-sm text-primary hover:underline font-medium">
          + הוסף חוג
        </button>
      }>
        <div className="space-y-3">
          {config.classes.map((cls, i) => (
            <div key={cls.id} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
              <input
                type="text"
                value={cls.emoji}
                onChange={(e) => updateClass(i, "emoji", e.target.value)}
                className="w-12 border rounded-lg px-2 py-2 text-sm text-center"
                title="אימוג׳י"
              />
              <input
                type="text"
                value={cls.name}
                onChange={(e) => updateClass(i, "name", e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                placeholder="שם החוג"
              />
              <input
                type="text"
                value={cls.ages}
                onChange={(e) => updateClass(i, "ages", e.target.value)}
                className="w-24 border rounded-lg px-3 py-2 text-sm"
                placeholder="גילאים"
              />
              <button
                onClick={() => removeClass(i)}
                className="text-red-400 hover:text-red-600 px-2 py-2 text-lg"
                title="מחק חוג"
              >
                ×
              </button>
            </div>
          ))}
          {config.classes.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">אין חוגים. לחץ &quot;הוסף חוג&quot; להתחיל.</p>
          )}
        </div>
      </Section>

      {/* Pricing */}
      <Section title="מחירון">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["once", "twice", "unlimited"] as const).map((tier) => (
            <div key={tier} className="bg-gray-50 rounded-lg p-3 space-y-2">
              <input
                type="text"
                value={config.pricing[tier].label}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    pricing: {
                      ...config.pricing,
                      [tier]: { ...config.pricing[tier], label: e.target.value },
                    },
                  })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="תיאור"
              />
              <input
                type="text"
                value={config.pricing[tier].price}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    pricing: {
                      ...config.pricing,
                      [tier]: { ...config.pricing[tier], price: e.target.value },
                    },
                  })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm font-medium"
                placeholder="מחיר"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Location */}
      <Section title="מיקום ושעות">
        <div className="space-y-3">
          <Field label="כתובת">
            <input
              type="text"
              value={config.location.address}
              onChange={(e) =>
                setConfig({
                  ...config,
                  location: { ...config.location, address: e.target.value },
                })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="כתובת העסק"
            />
          </Field>
          <Field label="שעות פעילות">
            <input
              type="text"
              value={config.location.hours}
              onChange={(e) =>
                setConfig({
                  ...config,
                  location: { ...config.location, hours: e.target.value },
                })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="א׳-ה׳ 14:00-20:00"
            />
          </Field>
          <Field label="קישור Google Maps">
            <input
              type="text"
              value={config.location.mapsLink}
              onChange={(e) =>
                setConfig({
                  ...config,
                  location: { ...config.location, mapsLink: e.target.value },
                })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="https://maps.google.com/..."
              dir="ltr"
            />
          </Field>
        </div>
      </Section>

      {/* Trial Booking Flow Preview */}
      <Section title="תהליך תיאום שיעור ניסיון">
        <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">שם</span>
          <span>→</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">טלפון</span>
          <span>→</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">גיל ילד</span>
          <span>→</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">עיר</span>
          <span>→</span>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">נשמר כליד ב-CRM</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          תהליך זה אוטומטי ולא ניתן לשינוי מכאן. שנה דרך הקוד אם צריך.
        </p>
      </Section>

      {/* Test Chat */}
      <Section title="בדיקת הבוט">
        <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto mb-3 space-y-2">
          {chatLog.length === 0 && (
            <p className="text-gray-400 text-sm text-center mt-8">שלח הודע׋ לבדיקה...</p>
          )}
          {chatLog.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-100 text-blue-900"
                    : "bg-green-100 text-green-900"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTest()}
            placeholder="שלח הודעה לבוט..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={handleTest}
            disabled={testing || !testMessage.trim()}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition text-sm disabled:opacity-50"
          >
            שלח
          </button>
        </div>
      </Section>

      {/* Setup Guide */}
      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
        <h3 className="font-semibold mb-2">מדריך חיבור</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>WhatsApp Business:</strong></p>
          <ol className="list-decimal list-inside mr-4 space-y-1 text-gray-600">
            <li>צור אפליקציה ב-<a href="https://developers.facebook.com" target="_blank" className="text-primary hover:underline">developers.facebook.com</a></li>
            <li>הוסף מוצר WhatsApp</li>
            <li>הגדר webhook URL: <code className="bg-gray-100 px-1 rounded">/api/webhooks/whatsapp</code></li>
            <li>העתק את ה-Access Token ל-.env.local</li>
          </ol>
          <p className="mt-3"><strong>Messenger + Instagram:</strong></p>
          <ol className="list-decimal list-inside mr-4 space-y-1 text-gray-600">
            <li>באותה אפליקציה, הוסף מוצר Messenger</li>
            <li>חבר את דף הפייסבוק + חשבון אינסטגרם</li>
            <li>הגדר webhook URL: <code className="bg-gray-100 px-1 rounded">/api/webhooks/messenger</code></li>
            <li>העתק את Page Access Token ל-.env.local</li>
          </ol>
        </div>
      </div>

      {/* Save floating button for mobile */}
      {saveMsg && (
        <div className="toast-success">{saveMsg}</div>
      )}
      <div className="fixed bottom-6 right-6 md:hidden">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white px-6 py-3 rounded-full shadow-lg hover:bg-primary-dark transition disabled:opacity-50 font-medium"
        >
          {saving ? "שומר..." : "שמור"}
        </button>
      </div>
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────────────────

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
