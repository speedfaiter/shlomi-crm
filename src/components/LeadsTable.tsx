"use client";

import { useState } from "react";
import { Lead, LeadStatus, STATUS_LABELS, STATUS_COLORS, SOURCE_LABELS } from "@/lib/types";
import WhatsAppButton from "./WhatsAppButton";

interface LeadsTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
  onRefresh?: () => void;
}

type SortKey = "name" | "phone" | "city" | "source" | "status" | "created_at";

export default function LeadsTable({ leads, onEdit, onDelete, onStatusChange, onRefresh }: LeadsTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");

  if (leads.length === 0) {
    return <p className="text-center text-gray-400 py-8">אין לידים להצגה</p>;
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("he-IL");
  };

  const isOverdue = (followUp: string | null) => {
    if (!followUp) return false;
    return new Date(followUp) <= new Date();
  };

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortBy !== key) return "";
    return sortOrder === "asc" ? " ▲" : " ▼";
  };

  const sorted = [...leads].sort((a, b) => {
    const aVal = (a as any)[sortBy] || "";
    const bVal = (b as any)[sortBy] || "";
    return sortOrder === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === leads.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leads.map(l => l.id)));
    }
  };

  const handleBulkStatusChange = () => {
    if (!bulkStatus) return;
    selected.forEach(id => {
      onStatusChange(id, bulkStatus as LeadStatus);
    });
    setSelected(new Set());
    setBulkStatus("");
  };

  function exportCSV() {
    const headers = ["שם", "טלפון", "עיר", "מקור", "סטטוס", "תאריך"];
    const rows = leads.map(l => [l.name, l.phone, l.city, l.source, l.status, l.created_at?.split("T")[0]]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <button
          onClick={exportCSV}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
        >
          ייצוא CSV
        </button>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <span className="text-sm font-medium">{selected.size} נבחרו</span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">שנה סטטוס...</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button
              onClick={handleBulkStatusChange}
              disabled={!bulkStatus}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
            >
              החל
            </button>
          </div>
        )}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="py-3 px-2">
              <input
                type="checkbox"
                checked={selected.size === leads.length && leads.length > 0}
                onChange={toggleSelectAll}
              />
            </th>
            <th className="text-right py-3 px-2 font-medium cursor-pointer select-none" onClick={() => handleSort("name")}>שם{sortIndicator("name")}</th>
            <th className="text-right py-3 px-2 font-medium cursor-pointer select-none" onClick={() => handleSort("phone")}>טלפון{sortIndicator("phone")}</th>
            <th className="text-right py-3 px-2 font-medium hidden md:table-cell cursor-pointer select-none" onClick={() => handleSort("city")}>עיר{sortIndicator("city")}</th>
            <th className="text-right py-3 px-2 font-medium hidden md:table-cell">גיל ילד</th>
            <th className="text-right py-3 px-2 font-medium hidden lg:table-cell cursor-pointer select-none" onClick={() => handleSort("source")}>מקור{sortIndicator("source")}</th>
            <th className="text-right py-3 px-2 font-medium cursor-pointer select-none" onClick={() => handleSort("status")}>סטטוס{sortIndicator("status")}</th>
            <th className="text-right py-3 px-2 font-medium hidden lg:table-cell">מעקב</th>
            <th className="text-right py-3 px-2 font-medium hidden xl:table-cell">הערות</th>
            <th className="text-right py-3 px-2 font-medium">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((lead) => (
            <tr key={lead.id} className={`border-b hover:bg-gray-50 transition ${selected.has(lead.id) ? "bg-blue-50" : ""}`}>
              <td className="py-3 px-2">
                <input
                  type="checkbox"
                  checked={selected.has(lead.id)}
                  onChange={() => toggleSelect(lead.id)}
                />
              </td>
              <td className="py-3 px-2 font-medium">{lead.name}</td>
              <td className="py-3 px-2">
                <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                  {lead.phone}
                </a>
              </td>
              <td className="py-3 px-2 hidden md:table-cell">{lead.city || "—"}</td>
              <td className="py-3 px-2 hidden md:table-cell">{lead.child_age || "—"}</td>
              <td className="py-3 px-2 hidden lg:table-cell">
                {SOURCE_LABELS[lead.source] || lead.source}
              </td>
              <td className="py-3 px-2">
                <select
                  value={lead.status}
                  onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
                  className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[lead.status]}`}
                >
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-3 px-2 hidden lg:table-cell">
                <span className={isOverdue(lead.follow_up_date) ? "text-red-600 font-medium" : ""}>
                  {formatDate(lead.follow_up_date)}
                </span>
              </td>
              <td className="py-3 px-2 hidden xl:table-cell max-w-[150px] truncate" title={lead.notes}>
                {lead.notes || "—"}
              </td>
              <td className="py-3 px-2">
                <div className="flex gap-1">
                  <WhatsAppButton lead={lead} onSent={onRefresh} />
                  <button
                    onClick={() => onEdit(lead)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition"
                  >
                    ערוך
                  </button>
                  <button
                    onClick={() => onDelete(lead.id)}
                    className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded transition"
                  >
                    מחק
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
