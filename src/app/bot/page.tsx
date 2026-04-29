"use client";

import { useState } from "react";
import { BOT_CONFIG } from "@/lib/chatbot";

export default function BotConfigPage() {
  const [testMessage, setTestMessage] = useState("");
  const [chatLog, setChatLog] = useState<Array<{ role: string; text: string }>>([]);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    if (!testMessage.trim()) return;
    setTesting(true);

    // Add user message to log
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">🤖 הגדרות צ׳אט בוט</h2>
        <a href="/" className="text-sm text-primary hover:underline">← חזרה ללידים</a>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-sm text-gray-600">WhatsApp</p>
          <p className="text-lg font-bold text-green-700">
            {process.env.NEXT_PUBLIC_WHATSAPP_CONNECTED === "true" ? "מחובר ✓" : "ממתין לחיבור"}
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

      {/* Bot Flow Preview */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="font-semibold mb-3">תפריט הבוט (אינטראקטיבי)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">הודעת ברכה:</p>
            <pre className="bg-gray-50 rounded-lg p-3 text-sm whitespace-pre-wrap text-gray-700 max-h-40 overflow-y-auto">
              {`שלום! 👋 ברוכים הבאים ל*${BOT_CONFIG.businessName}*!`}
            </pre>
          </div>
          <div className="space-y-3">
            {[
              { key: "🏋️ החוגים שלנו", desc: "רשימה אינטראקטיבית עם כל החוגים" },
              { key: "💰 מחירון", desc: "מחירים + כפתורי ניווט" },
              { key: "🎯 שיעור ניסיון חינם", desc: "תהליך איסוף פרטים → שמירה כליד" },
              { key: "📍 מיקום ושעות", desc: "כתובת ושעות + כפתורים" },
              { key: "👨‍💼 דבר עם נציג", desc: "העברה לנציג + כפתור חזרה" },
            ].map((item) => (
              <div key={item.key}>
                <p className="text-sm font-medium text-gray-700">{item.key}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 p-2 bg-green-50 rounded-lg">
          <p className="text-xs text-green-700">
            ✨ הבוט משתמש ב-<strong>כפתורים אינטראקטיביים</strong> ו<strong>רשימות</strong> של WhatsApp — לא רק טקסט רגיל
          </p>
        </div>
      </div>

      {/* Trial Booking Flow */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="font-semibold mb-3">תהליך תיאום שיעור ניסיון (אפשרות 3)</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">שם</span>
          <span>→</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">טלפון</span>
          <span>→</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">גיל ילד</span>
          <span>→</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">עיר</span>
          <span>→</span>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">✓ נשמר כליד ב-CRM</span>
        </div>
      </div>

      {/* Test Chat */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="font-semibold mb-3">🧪 בדיקת הבוט</h3>
        <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto mb-3 space-y-2">
          {chatLog.length === 0 && (
            <p className="text-gray-400 text-sm text-center mt-8">שלח הודעה לבדיקה...</p>
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
      </div>

      {/* Setup Guide */}
      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
        <h3 className="font-semibold mb-2">📋 מדריך חיבור</h3>
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
    </div>
  );
}
