'use client';

export interface AskResponse {
  answer: string;
  decision_author: string;
  decision_date: string;
  source_pr_url: string;
  confidence: number;
}

export async function askLore(query: string): Promise<AskResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // In a real implementation, this would fetch from Person A's /api/ask endpoint
  // For now, we mock responses based on the query to allow frontend polish
  
  const q = query.toLowerCase();
  
  if (q.includes('tailwind')) {
    return {
      answer: "We removed Tailwind CSS because it was causing severe bundle bloat and class conflicts across our micro-frontends.",
      decision_author: "@alice",
      decision_date: "2024-06-03",
      source_pr_url: "https://github.com/tarot-club-hackathons/lore/pull/12",
      confidence: 0.98
    };
  }

  if (q.includes('postgres') || q.includes('database')) {
    return {
      answer: "PostgreSQL was chosen over MongoDB because our data model for the graph heavily relies on ACID compliance and strict relational integrity.",
      decision_author: "@bob",
      decision_date: "2024-01-15",
      source_pr_url: "https://github.com/tarot-club-hackathons/lore/pull/2",
      confidence: 0.95
    };
  }

  // Fallback response
  return {
    answer: "Based on our architectural history, this decision was made to optimize system performance and maintainability.",
    decision_author: "@charlie",
    decision_date: "2023-11-20",
    source_pr_url: "https://github.com/tarot-club-hackathons/lore/pull/1",
    confidence: 0.75
  };
}
