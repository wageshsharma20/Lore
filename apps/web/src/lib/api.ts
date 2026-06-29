// src/lib/api.ts
import { Decision, HeatmapSummary, ADR } from "./mock-data";

// This points to Person A's FastAPI server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getSummary(): Promise<HeatmapSummary> {
  const res = await fetch(`${API_BASE_URL}/api/summary`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch summary from DB");
  return await res.json();
}

export async function getDecisions(): Promise<Decision[]> {
  const res = await fetch(`${API_BASE_URL}/api/decisions`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch decisions from DB");
  return await res.json();
}

export async function getDecision(id: string): Promise<Decision | undefined> {
  const res = await fetch(`${API_BASE_URL}/api/decisions/${id}`, { cache: 'no-store' });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to fetch decision ${id} from DB`);
  return await res.json();
}

// We will wire this up to a button later today!
export async function triggerGitHubSync() {
  const res = await fetch(`${API_BASE_URL}/api/sync`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to trigger sync");
  return await res.json();
}

export async function getAdrs(): Promise<ADR[]> {
  const res = await fetch(`${API_BASE_URL}/api/adrs`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch adrs from DB");
  return await res.json();
}

export async function getAdr(id: string): Promise<ADR | undefined> {
  const res = await fetch(`${API_BASE_URL}/api/adrs/${id}`, { cache: 'no-store' });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to fetch adr ${id} from DB`);
  return await res.json();
}