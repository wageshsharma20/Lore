export function MinimalFooter() {
  const year = new Date().getFullYear();

  const company = [
    {
      title: "GitHub",
      href: "https://github.com/tarot-club-hackathons/lore",
    },
    {
      title: "Docs",
      href: "#",
    },
  ];

  const resources = [
    {
      title: "Pricing",
      href: "#",
    },
    {
      title: "Status",
      href: "#",
    },
  ];

  return (
    <footer className="relative bg-[#111111]">
      <div className="bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent)] mx-36 md:border-x border-white/10">
        <div className="grid grid-cols-6 gap-6 pt-64 pb-48 px-12">
          <div className="col-span-6 flex flex-col gap-5 md:col-span-4">
            <div className="flex items-center gap-4 opacity-80">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <polygon points="4,22 11,16.75 11,2.75 4,8" fill="#0052ff" />
                <polygon points="12,22 20,22 20,10 12,16" fill="#0052ff" />
              </svg>
              <span className="font-serif font-medium text-5xl tracking-tight text-white">
                Lore
              </span>
            </div>
            <div>
              <p className="text-white/50 font-medium mb-2 tracking-tight text-lg">
                Lore — Codebase Memory for Engineering Teams
              </p>
              <p className="font-light text-white/30 text-base">
                Built with Cognee · FastAPI · Next.js · Gemini
              </p>
            </div>
          </div>
          <div className="col-span-3 w-full md:col-span-1">
            <span className="text-white/30 mb-4 block text-base font-mono uppercase tracking-widest">
              Resources
            </span>
            <div className="flex flex-col gap-4">
              {resources.map(({ href, title }, i) => (
                <a
                  key={i}
                  className="w-max text-lg text-white/50 duration-200 hover:text-white hover:underline"
                  href={href}
                >
                  {title}
                </a>
              ))}
            </div>
          </div>
          <div className="col-span-3 w-full md:col-span-1">
            <span className="text-white/30 mb-4 block text-base font-mono uppercase tracking-widest">
              Company
            </span>
            <div className="flex flex-col gap-4">
              {company.map(({ href, title }, i) => (
                <a
                  key={i}
                  className="w-max text-lg text-white/50 duration-200 hover:text-white hover:underline"
                  href={href}
                >
                  {title}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white/10 h-px w-full" />
        <div className="flex flex-col justify-between gap-2 pt-8 pb-12">
          <p className="text-white/30 text-center text-lg font-light">
            © {year} Lore. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
