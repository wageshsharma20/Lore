// src/lib/api.ts
import { Decision, HeatmapSummary, ADR, MOCK_DECISIONS, MOCK_SUMMARY, MOCK_ADRS } from "./mock-data";

// This points to Person A's FastAPI server, but we will temporarily use mock data
// so you can see the UI without the backend running!
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getSummary(): Promise<HeatmapSummary> {
  // Temporary mock data for UI demo
  return MOCK_SUMMARY;
}

export async function getDecisions(): Promise<Decision[]> {
  // Temporary mock data for UI demo
  return MOCK_DECISIONS;
}

export async function searchDecisions(query: string): Promise<Decision[]> {
  // Temporary mock data for UI demo
  return MOCK_DECISIONS.filter(d => d.title.toLowerCase().includes(query.toLowerCase()));
}

export async function getDecision(id: string): Promise<Decision | undefined> {
  // Temporary mock data for UI demo
  return MOCK_DECISIONS.find(d => d.id === id);
}

// We will wire this up to a button later today!
export async function triggerGitHubSync() {
  return { status: "ok" };
}

export async function getAdrs(): Promise<ADR[]> {
  // Temporary mock data for UI demo
  return MOCK_ADRS;
}

export async function getAdr(id: string): Promise<ADR | undefined> {
  // Temporary mock data for UI demo
  return MOCK_ADRS.find(a => a.id === id);
}

export async function memifyDecision(decisionId: string, adrUrl: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/memify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision_id: decisionId,
        ratified: true,
        adr_url: adrUrl
      })
    });
    if (!res.ok) {
      console.warn("Failed to memify decision on backend:", await res.text());
    }
  } catch (error) {
    console.warn("Backend not reachable for memify (using mock mode):", error);
  }
}