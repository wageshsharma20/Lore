'use client';

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

import { motion } from "framer-motion";

export default function AskPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamError, setStreamError] = useState<boolean>(false);
  const [lastQuery, setLastQuery] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const exampleQueries = [
    "Why did we choose PostgreSQL?",
    "Who decided to remove Tailwind?",
    "When did we ban AWS?"
  ];

  // Cleanup pending requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingStep, isTyping]);

  const handleAsk = async (q: string) => {
    if (!q.trim() || isTyping || loadingStep) return;
    
    setStreamError(false);
    setLastQuery(q);

    // If retrying, don't duplicate the user's message
    const isRetry = messages.length > 0 && messages[messages.length - 1].role === 'assistant' && streamError;
    let newMessages = [...messages];
    
    if (isRetry) {
      // Remove the previous error message
      newMessages.pop(); 
    } else {
      newMessages.push({ role: 'user', content: q });
    }
    
    setMessages(newMessages);
    setQuery("");
    setLoadingStep("Connecting to Lore...");
    setIsTyping(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const res = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) throw new Error("Failed to connect to chat API");
      if (!res.body) throw new Error("No readable stream");

      // Add a placeholder message for the assistant
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (!dataStr.trim()) continue;
            
            try {
              const eventData = JSON.parse(dataStr);
              
              // Handle BOTH our original spec (type/message) and Person A's new spec (status/chunk)
              const isStatus = eventData.type === 'status' || eventData.status !== undefined;
              const isChunk = eventData.type === 'chunk' || eventData.chunk !== undefined;
              const isDone = eventData.type === 'done' || eventData.status === 'Complete';

              if (isDone) {
                setLoadingStep("");
                break;
              } else if (isStatus) {
                setLoadingStep(eventData.message || eventData.status);
              } else if (isChunk) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg.role === 'assistant') {
                    lastMsg.content += (eventData.text || eventData.chunk);
                  }
                  return updated;
                });
              }
            } catch (e) {
              console.error("Failed to parse SSE JSON:", e);
            }
          }
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log("Fetch aborted");
        return;
      }
      console.error(e);
      setStreamError(true);
      setMessages((prev) => [...prev, { role: 'assistant', content: '❌ Sorry, I encountered a network error while trying to reach the Lore backend.' }]);
    } finally {
      setLoadingStep("");
      setIsTyping(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto h-[calc(100vh-80px)] flex flex-col relative pt-8">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] z-[-1]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] z-[-1]"></div>

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="w-full text-center mb-10">
            <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent drop-shadow-md">Ask Lore</h1>
            <p className="text-gray-400 text-xl font-light">Chat with your team's engineering history.</p>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-center"
          >
            <p className="text-sm text-gray-500 mb-4 font-medium tracking-widest uppercase">Try asking:</p>
            <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
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
          </motion.div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto mb-4 p-4 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-5 shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-primary/90 text-white rounded-br-none' 
                  : 'bg-black/60 backdrop-blur-xl border border-white/10 text-gray-200 rounded-bl-none'
              }`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lore</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed font-light">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {loadingStep && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl p-4 bg-black/40 backdrop-blur-xl border border-white/5 rounded-bl-none flex items-center gap-4">
                <div className="relative w-6 h-6">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
                  <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                </div>
                <p className="text-primary text-sm font-medium tracking-wide animate-pulse">
                  {loadingStep}
                </p>
              </div>
            </div>
          )}
          
          {streamError && (
            <div className="flex justify-center mt-2 mb-4">
              <button 
                onClick={() => handleAsk(lastQuery)}
                className="bg-red-500/20 text-red-300 border border-red-500/50 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2 text-sm shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Retry Connection
              </button>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="p-4 bg-transparent shrink-0">
        <div className="relative max-w-4xl mx-auto group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk(query)}
            placeholder="Ask a question or follow-up..." 
            className="relative w-full p-5 pr-14 text-lg bg-black/80 backdrop-blur-xl border border-white/10 text-white placeholder-gray-500 rounded-2xl shadow-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            disabled={isTyping}
          />
          <button 
            onClick={() => handleAsk(query)}
            disabled={isTyping || !query.trim()}
            className="absolute right-4 top-4 p-2 bg-primary/90 text-white rounded-xl hover:bg-primary hover:scale-105 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </div>
      </div>
    </main>
  );
}
