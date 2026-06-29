'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="dark bg-black min-h-screen text-white overflow-hidden relative selection:bg-primary/30 selection:text-primary-foreground font-sans">
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Mini Nav */}
      <nav className="absolute top-0 w-full z-50 p-6 flex justify-between items-center max-w-7xl mx-auto left-0 right-0">
        <div className="flex items-center gap-3">
          <span className="w-4 h-4 bg-primary rounded-full animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.8)]"></span>
          <span className="font-extrabold text-2xl tracking-tighter text-white">Lore</span>
        </div>
        <Link 
          href="/dashboard" 
          className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md font-medium text-sm transition-all hover:scale-105"
        >
          Enter Dashboard
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto"
        >
          <Badge variant="outline" className="mb-6 bg-white/5 border-white/10 text-gray-300 backdrop-blur-sm px-4 py-1.5 text-xs tracking-widest uppercase">
            Hackathon Edition v1.0
          </Badge>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-tight">
            Your codebase's <br />
            <span className="bg-gradient-to-r from-primary via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
              memory.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-light mb-12 max-w-2xl mx-auto leading-relaxed">
            Never lose context again. Lore autonomously captures, maps, and guards the architectural decisions that shape your product.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/dashboard">
              <button className="px-8 py-4 rounded-full bg-primary text-white font-bold text-lg hover:bg-primary/90 transition-all shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] hover:scale-105">
                Experience Lore
              </button>
            </Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-medium text-lg hover:bg-white/10 backdrop-blur-sm transition-all hover:scale-105 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"/></svg>
              View GitHub
            </a>
          </div>
        </motion.div>
      </main>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Ask Lore",
              description: "Chat directly with your codebase's architectural history. Powered by a live Knowledge Graph.",
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
              delay: 0.2
            },
            {
              title: "Risk Engine",
              description: "Mathematically detect knowledge silos and risky architectural chokepoints before they become critical.",
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg>,
              delay: 0.4
            },
            {
              title: "PR Interceptor",
              description: "Autonomous governance. Block pull requests that violate historical architectural decisions automatically.",
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></svg>,
              delay: 0.6
            }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: feature.delay }}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl hover:bg-white/10 transition-colors group cursor-default"
            >
              <div className="w-12 h-12 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mb-6 border border-primary/30 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white tracking-tight">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed font-light">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-white/10 py-12 text-center text-gray-500 text-sm">
        <p>© 2026 Lore Inc. Built for the Hackathon.</p>
      </footer>
    </div>
  );
}
