import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM - ניהול לידים",
  description: "מערכת ניהול לידים לעסק כושר וחינוך ילדים",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
                🏋️ CRM - ניהול לידים
              </a>
              <nav className="flex gap-4 text-sm">
                <a href="/" className="text-gray-600 hover:text-gray-900">לידים</a>
                <a href="/bot" className="text-gray-600 hover:text-gray-900">🤖 צ׳אט בוט</a>
                <a href="/form" target="_blank" className="text-gray-600 hover:text-gray-900">📋 טופס לידים</a>
              </nav>
            </div>
            <span className="text-sm text-gray-500">כושר וחינוך ילדים</span>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
