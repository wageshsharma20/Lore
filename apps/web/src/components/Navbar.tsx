"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/heatmap", label: "Risk Heatmap" },
    { href: "/ask", label: "Ask Lore" },
    { href: "/adrs", label: "ADRs" },
    { href: "/settings", label: "Settings" },
    // Example for PR check to easily demo it
    { href: "/pr-check?pr=123&status=blocked&author=@alice", label: "Demo PR Blocker" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center gap-2">
            <span className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]"></span>
            <Link href="/" className="font-bold text-xl tracking-tight text-white">Lore</Link>
          </div>
          <div className="hidden md:flex items-center space-x-1">
            {links.map((link) => {
              const isActive = pathname === link.href || (pathname.startsWith("/pr-check") && link.href.includes("pr-check"));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
