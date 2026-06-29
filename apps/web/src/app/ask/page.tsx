'use client';

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { askLore, AskResponse } from "@/actions/ask";

export default function AskPage() {
  const [query, setQuery] = useState("");
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [result, setResult] = useState<AskResponse | null>(null);

  const exampleQueries = [
    "Why did we choose PostgreSQL?",
    "Who decided to remove Tailwind?",
    "When did we ban AWS?"
  ];

  const handleAsk = async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setLoadingStep("Searching decision graph…");
    setResult(null);
    
    // Progressive loading text sequence
    const timer1 = setTimeout(() => setLoadingStep("Found 3 related decisions…"), 1500);
    const timer2 = setTimeout(() => setLoadingStep("Generating answer…"), 3500);

    try {
      const res = await askLore(q);
      setResult(res);
    } catch (e) {
      console.error(e);
      alert("Failed to ask Lore. Please try again.");
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setLoadingStep("");
    }
  };

  return (
    <main className="p-8 max-w-4xl mx-auto min-h-[80vh] flex flex-col justify-center items-center relative">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] z-[-1]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] z-[-1]"></div>

      <div className="w-full text-center mb-10">
        <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent drop-shadow-md">Ask Lore</h1>
        <p className="text-gray-400 text-xl font-light">Chat with your team's engineering history.</p>
      </div>

      <div className="w-full max-w-2xl">
        <div className="relative mb-10 group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk(query)}
            placeholder="Ask a question about your architecture..." 
            className="relative w-full p-5 pr-14 text-lg bg-black/60 backdrop-blur-xl border border-white/10 text-white placeholder-gray-500 rounded-2xl shadow-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            disabled={!!loadingStep}
          />
          <button 
            onClick={() => handleAsk(query)}
            disabled={!!loadingStep || !query.trim()}
            className="absolute right-4 top-4 p-2 bg-primary/90 text-white rounded-xl hover:bg-primary hover:scale-105 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </div>

        {!result && !loadingStep && (
          <div className="flex flex-col items-center animate-in fade-in duration-700">
            <p className="text-sm text-gray-500 mb-4 font-medium tracking-widest uppercase">Try asking:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {exampleQueries.map((q, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  onClick={() => handleAsk(q)}
                  className="cursor-pointer bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 text-sm font-light border border-white/10 hover:border-primary/50 transition-all shadow-sm"
                >
                  {q}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {loadingStep && (
          <div className="flex justify-center my-12 animate-in fade-in duration-500">
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/50 border-b-transparent animate-[spin_1.5s_linear_infinite_reverse]"></div>
              </div>
              <p className="text-primary font-medium text-lg tracking-wide animate-pulse">
                {loadingStep}
              </p>
            </div>
          </div>
        )}

        {result && !loadingStep && (
          <div className="mt-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <Card className="bg-black/40 backdrop-blur-2xl border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="bg-emerald-500/10 px-6 py-4 border-b border-emerald-500/20 flex items-center justify-between shadow-[inset_0_-1px_0_rgba(16,185,129,0.2)]">
                <span className="text-emerald-400 font-medium flex items-center gap-3 drop-shadow-[0_0_5px_rgba(52,211,153,0.6)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                  Answer Found in Memory
                </span>
                <span className="text-emerald-300 text-xs font-bold bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  {Math.round(result.confidence * 100)}% Match
                </span>
              </div>
              <CardContent className="p-8">
                <p className="text-xl text-gray-200 mb-8 leading-relaxed font-light">
                  {result.answer}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400 bg-white/5 p-5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 uppercase text-xs tracking-wider">Made by</span>
                    <Badge variant="outline" className="bg-primary/20 text-primary-foreground border-primary/30 py-1">{result.decision_author}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 uppercase text-xs tracking-wider">Date</span>
                    <span className="font-medium text-gray-300">
                      {new Date(result.decision_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <a 
                      href={result.source_pr_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-primary hover:text-white hover:underline flex items-center gap-1.5 font-medium transition-colors"
                    >
                      View Source PR
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
