"use client";

import { use } from "react";
import { getDecision } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function DecisionDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  const { data: decision, isLoading } = useQuery({
    queryKey: ['decision', resolvedParams.id],
    queryFn: () => getDecision(resolvedParams.id)
  });

  if (isLoading) return <div className="p-8 text-center">Loading decision...</div>;

  if (!decision) {
    return <div className="p-8 text-red-500">Decision not found!</div>;
  }

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <Link href="/decisions" className="text-sm text-blue-500 hover:underline mb-6 inline-block">
        &larr; Back to all decisions
      </Link>
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3">{decision.title}</h1>
        <div className="flex items-center gap-3">
          <Badge>{decision.decision_type}</Badge>
          <span className="text-gray-500">By <b className="text-black">{decision.author}</b> on {decision.date}</span>
        </div>
      </div>

      <section className="bg-gray-50 p-6 mb-8 border border-gray-100">
        <h2 className="text-lg font-semibold mb-2">What was decided?</h2>
        <p className="text-gray-700 leading-relaxed">{decision.what}</p>
      </section>

      <section className="bg-blue-50 p-6 mb-8 border border-blue-100">
        <h2 className="text-lg font-semibold mb-2 text-blue-900">Why was this decided? (The Reason)</h2>
        <p className="text-blue-800 italic leading-relaxed">"{decision.reason}"</p>
      </section>

      <section>
        <h3 className="font-semibold mb-3 text-gray-700">Contributors & Reviewers</h3>
        <div className="flex gap-2">
          {decision.contributors.map(contributor => (
            <Badge key={contributor} variant="secondary">{contributor}</Badge>
          ))}
        </div>
      </section>
      
      <div className="mt-16 pt-8 border-t border-gray-200 text-sm text-gray-500">
        Source PR: <a href={decision.source_pr_url} className="underline hover:text-black">{decision.source_pr_url}</a>
      </div>
    </main>
  );
}