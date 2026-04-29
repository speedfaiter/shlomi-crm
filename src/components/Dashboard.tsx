"use client";

interface DashboardProps {
  stats: {
    total: number;
    active: number;
    closed: number;
    not_interested: number;
    followUpsToday: number;
    byStatus: Record<string, number>;
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

  return (
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
  );
}
