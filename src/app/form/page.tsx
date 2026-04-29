"use client";

import { useState } from "react";

export default function LeadForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    child_age: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          city: form.city,
          child_age: form.child_age ? parseInt(form.child_age) : null,
          notes: form.notes,
          source: "website_form",
          status: "new",
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError("×©×××× ××©××××, × ×¡× ×©××");
      }
    } catch {
      setError("×©××××ª ×××××¨, × ×¡× ×©××");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">ð</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">×ª××× ×¨××!</h2>
          <p className="text-gray-600">×§×××× × ××ª ××¤×¨××× ×©×× ×× ××××¨ ×××× ×××§××.</p>
          <p className="text-gray-500 text-sm mt-4">×¦×××ª ×××©×¨ ×××× ×× ××××× ðª</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">ðï¸</div>
          <h1 className="text-2xl font-bold text-gray-900">×××× ×××©×¨ ××××××</h1>
          <p className="text-gray-500 mt-1">××©×××¨× ×¤×¨××× ×× ××××¨ ×××××!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">×©× ××× *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="××©×¨×× ××©×¨×××"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">×××¤×× *</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="050-0000000"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">×¢××¨</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="×ª× ××××"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">××× ××××/×</label>
            <input
              type="number"
              min="1"
              max="18"
              value={form.child_age}
              onChange={(e) => update("child_age", e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="8"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">××¢×¨××ª</label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              rows={2}
              placeholder="×©××××ª, ××¢××¤××ª..."
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
          >
            {loading ? "×©×××..." : "×©××××ª ×¤×¨×××"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          ××¤×¨××× ×©×× ×××××××× ××× ×××¢××¨× ××¦× ×©×××©×
        </p>
      </div>
    </div>
  );
}
