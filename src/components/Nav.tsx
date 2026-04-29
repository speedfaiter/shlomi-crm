"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "×××××" },
    { href: "/bot", label: "ð¤ ×¦×³×× ×××" },
    { href: "/form", label: "ð ×××¤×¡ ×××××" },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="font-bold text-lg">ðï¸ CRM - × ×××× ×××××</Link>
        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          <span className="text-xl">{menuOpen ? "â" : "â°"}</span>
        </button>
        {/* Desktop nav */}
        <div className="hidden md:flex gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1 rounded ${
                pathname === l.href
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`block py-2 ${
                pathname === l.href
                  ? "text-blue-700 font-semibold"
                  : "text-gray-600"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
