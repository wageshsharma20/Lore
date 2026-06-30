"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/heatmap", label: "Risk Heatmap" },
    { href: "/ask", label: "Ask Lore" },
    { href: "/adrs", label: "ADRs" },
    { href: "/settings", label: "Settings" },
    { href: "/pr-check?pr=123&status=blocked&author=@alice", label: "Demo PR Blocker" },
  ];

  if (pathname === "/") return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#161616]/80 backdrop-blur-2xl">
      <div className="mx-36 px-8">
        <div className="flex items-center h-24">
          <div className="flex-shrink-0 flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <polygon points="4,22 11,16.75 11,2.75 4,8" fill="#0052ff" />
              <polygon points="12,22 20,22 20,10 12,16" fill="#0052ff" />
            </svg>
            <Link href="/dashboard" className="font-['Arial'] font-medium text-3xl tracking-tight text-white">Lore</Link>
          </div>
          <div className="hidden md:flex items-center gap-2 ml-auto mr-6 font-['Arial'] text-lg text-white/40">
            {links.map((link) => {
              const isActive = pathname === link.href || (pathname.startsWith("/pr-check") && link.href.includes("pr-check"));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:text-white hover:bg-white/5"
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
