"use client";

import { useState } from "react";
import { Lead, LeadStatus, STATUS_LABELS, SOURCE_LABELS } from "@/lib/types";

interface LeadModalProps {
  lead: Lead | null;
  onSave: (data: Partial<Lead>) => void;
  onClose: () => void;
}

export default function LeadModal({ lead, onSave, onClose }: LeadModalProps) {
  const [form, setForm] = useState({
    name: lead?.name || "",
    phone: lead?.phone || "",
    city: lead?.city || "",
    child_age: lead?.child_age?.toString() || "",
    source: lead?.source || "manual",
    status: lead?.status || ("new" as LeadStatus),
    notes: lead?.notes || "",
    follow_up_date: lead?.follow_up_date || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      child_age: form.child_age ? parseInt(form.child_age) : null,
      follow_up_date: form.follow_up_date || null,
    });
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {lead ? "עריכת ליד" : "ליד חדש"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="שם מלא"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">טלפון *</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="050-0000000"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">עיר</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">גיל ילד</label>
              <input
                type="number"
                min="1"
                max="18"
                value={form.child_age}
                onChange={(e) => update("child_age", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מקור</label>
              <select
                value={form.source}
                onChange={(e) => update("source", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תאריך מעקב</label>
            <input
              type="date"
              value={form.follow_up_date}
              onChange={(e) => update("follow_up_date", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={3}
              placeholder="הערות חופשיות..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition text-sm font-medium"
            >
              {lead ? "עדכן" : "הוסף ליד"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
