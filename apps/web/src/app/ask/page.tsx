import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AskPage() {
  const exampleQueries = [
    "Why did we choose PostgreSQL?",
    "Who decided to remove Tailwind?",
    "When did we ban AWS?"
  ];

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
            placeholder="Ask a question about your architecture..." 
            className="w-full p-4 pr-12 text-lg border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
            disabled
          />
          <button className="absolute right-3 top-3 p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-sm text-gray-500 mb-3 font-medium">Try asking:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {exampleQueries.map((query, index) => (
              <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-gray-200 px-3 py-1.5 text-sm font-normal shadow-sm border border-gray-200">
                {query}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
