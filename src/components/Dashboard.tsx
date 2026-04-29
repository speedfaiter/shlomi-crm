"use client";

interface DashboardProps {
  stats: {
    total: number;
    active: number;
    closed: number;
    not_interested: number;
    followUpsToday: number;
    byStatus: Record<string, number>;
    bySource?: { source: string; count: number }[];
    byStatusArr?: { status: string; count: number }[];
  } | null;
}

export default function Dashboard({ stats }: DashboardProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { label: "סה״כ לידים", value: stats.total, color: "text-gray-900", bg: "bg-white" },
    { label: "פעילים", value: stats.active, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "סגורים", value: stats.closed, color: "text-green-600", bg: "bg-green-50" },
    { label: "לא מעוניינים", value: stats.not_interested, color: "text-red-600", bg: "bg-red-50" },
    { label: "מעקב להיום", value: stats.followUpsToday, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const statusColors: Record<string, string> = {
    new: "bg-blue-500",
    interested: "bg-yellow-500",
    trial: "bg-purple-500",
    paying: "bg-green-500",
    closed: "bg-green-600",
    not_interested: "bg-red-500",
  };

  const statusLabels: Record<string, string> = {
    new: "חדש",
    interested: "מעוניין",
    trial: "ניסיון",
    paying: "משלם",
    closed: "סגור",
    not_interested: "לא מעוניין",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} rounded-lg shadow-sm border p-4`}
          >
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.bySource && stats.bySource.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">התפלגות לפי מקור</h3>
            {stats.bySource.map((s) => (
              <div key={s.source} className="flex items-center gap-2 mb-2" dir="rtl">
                <span className="w-24 text-sm text-right truncate">{s.source}</span>
                <div className="flex-1 bg-gray-100 rounded h-6">
                  <div
                    className="bg-blue-500 rounded h-6 transition-all"
                    style={{ width: `${Math.max((s.count / stats.total) * 100, 2)}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-left">{s.count}</span>
              </div>
            ))}
          </div>
        )}

        {stats.byStatusArr && stats.byStatusArr.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">התפלגות לפי סטטוס</h3>
            {stats.byStatusArr.map((s) => (
              <div key={s.status} className="flex items-center gap-2 mb-2" dir="rtl">
                <span className="w-24 text-sm text-right truncate">{statusLabels[s.status] || s.status}</span>
                <div className="flex-1 bg-gray-100 rounded h-6">
                  <div
                    className={`${statusColors[s.status] || "bg-gray-500"} rounded h-6 transition-all`}
                    style={{ width: `${Math.max((s.count / stats.total) * 100, 2)}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-left">{s.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
