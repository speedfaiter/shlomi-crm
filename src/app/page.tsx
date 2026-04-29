"use client";

import { useState, useEffect, useCallback } from "react";
import { Lead, LeadStatus, STATUS_LABELS } from "@/lib/types";
import Dashboard from "@/components/Dashboard";
import LeadsTable from "@/components/LeadsTable";
import LeadModal from "@/components/LeadModal";

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (search) params.set("search", search);

    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data);
    setLoading(false);
  }, [filterStatus, search]);

  const fetchStats = async () => {
    const res = await fetch("/api/leads/stats");
    const data = await res.json();
    setStats(data);
  };

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [fetchLeads]);

  const handleSave = async (lead: Partial<Lead>) => {
    if (editingLead) {
      await fetch(`/api/leads/${editingLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
    } else {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
    }
    setModalOpen(false);
    setEditingLead(null);
    fetchLeads();
    fetchStats();
  };

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    await fetch(`/api/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchLeads();
    fetchStats();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק ליד זה?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    fetchLeads();
    fetchStats();
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Dashboard stats={stats} />

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">לידים</h2>
          <button
            onClick={() => {
              setEditingLead(null);
              setModalOpen(true);
            }}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition text-sm"
          >
            + ליד חדש
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="חיפוש לפי שם, טלפון או עיר..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">כל הסטטוסים</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">טוען...</p>
        ) : (
          <LeadsTable
            leads={leads}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onRefresh={() => { fetchLeads(); fetchStats(); }}
          />
        )}
      </div>

      {modalOpen && (
        <LeadModal
          lead={editingLead}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditingLead(null);
          }}
        />
      )}
    </div>
  );
}
