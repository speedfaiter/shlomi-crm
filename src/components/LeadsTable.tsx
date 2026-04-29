"use client";

import { Lead, LeadStatus, STATUS_LABELS, STATUS_COLORS, SOURCE_LABELS } from "@/lib/types";
import WhatsAppButton from "./WhatsAppButton";

interface LeadsTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
  onRefresh?: () => void;
}

export default function LeadsTable({ leads, onEdit, onDelete, onStatusChange, onRefresh }: LeadsTableProps) {
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="text-right py-3 px-2 font-medium">שם</th>
            <th className="text-right py-3 px-2 font-medium">טלפון</th>
            <th className="text-right py-3 px-2 font-medium hidden md:table-cell">עיר</th>
            <th className="text-right py-3 px-2 font-medium hidden md:table-cell">גיל ילד</th>
            <th className="text-right py-3 px-2 font-medium hidden lg:table-cell">מקור</th>
            <th className="text-right py-3 px-2 font-medium">סטטוס</th>
            <th className="text-right py-3 px-2 font-medium hidden lg:table-cell">מעקב</th>
            <th className="text-right py-3 px-2 font-medium hidden xl:table-cell">הערות</th>
            <th className="text-right py-3 px-2 font-medium">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b hover:bg-gray-50 transition">
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
