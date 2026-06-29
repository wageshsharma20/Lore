'use client';

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { askLore, AskResponse } from "@/actions/ask";

export default function AskPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);

  const exampleQueries = [
    "Why did we choose PostgreSQL?",
    "Why did we remove Tailwind?",
    "When did we ban AWS?"
  ];

  const handleAsk = async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    setResult(null);
    try {
      const res = await askLore(q);
      setResult(res);
    } catch (e) {
      console.error(e);
      alert("Failed to ask Lore. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-8 max-w-4xl mx-auto min-h-[80vh] flex flex-col justify-center items-center">
      <div className="w-full text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Ask Lore</h1>
        <p className="text-gray-500 text-lg">Chat with your team's engineering history.</p>
      </div>

      <div className="w-full max-w-2xl">
        <div className="relative mb-8">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk(query)}
            placeholder="Ask a question about your architecture..." 
            className="w-full p-4 pr-12 text-lg border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
            disabled={loading}
          />
          <button 
            onClick={() => handleAsk(query)}
            disabled={loading || !query.trim()}
            className="absolute right-3 top-3 p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </div>

        {!result && !loading && (
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-500 mb-3 font-medium">Try asking:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {exampleQueries.map((q, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  onClick={() => handleAsk(q)}
                  className="cursor-pointer hover:bg-gray-200 px-3 py-1.5 text-sm font-normal shadow-sm border border-gray-200"
                >
                  {q}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center my-12">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium">Searching architectural graph...</p>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-gray-200 shadow-lg overflow-hidden">
              <div className="bg-green-50 px-6 py-3 border-b border-green-100 flex items-center justify-between">
                <span className="text-green-800 font-medium flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                  Answer Found
                </span>
                <span className="text-green-700 text-xs font-bold bg-green-200 px-2 py-1 rounded-full">
                  {Math.round(result.confidence * 100)}% Match
                </span>
              </div>
              <CardContent className="p-6">
                <p className="text-xl text-gray-800 mb-6 leading-relaxed">
                  {result.answer}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Made by:</span>
                    <Badge variant="outline" className="bg-white">{result.decision_author}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Date:</span>
                    <span className="font-medium text-gray-700">
                      {new Date(result.decision_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <a 
                      href={result.source_pr_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
                    >
                      View Source PR
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
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
