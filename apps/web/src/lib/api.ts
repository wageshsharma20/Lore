// src/lib/api.ts
import { Decision, HeatmapSummary, ADR } from "./mock-data";

// This points to Person A's FastAPI server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getSummary(): Promise<HeatmapSummary> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/summary`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch summary");
    return await res.json();
  } catch (error) {
    console.warn("Backend not running or unreachable, falling back to mock data!");
    const { MOCK_SUMMARY } = await import("./mock-data");
    return MOCK_SUMMARY;
  }
}

export async function getDecisions(): Promise<Decision[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/decisions`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch decisions");
    return await res.json();
  } catch (error) {
    console.warn("Backend not running or unreachable, falling back to mock data!");
    const { MOCK_DECISIONS } = await import("./mock-data");
    return MOCK_DECISIONS;
  }
}

export async function getDecision(id: string): Promise<Decision | undefined> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/decisions/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch decision");
    return await res.json();
  } catch (error) {
    console.warn("Backend not running or unreachable, falling back to mock data!");
    const { MOCK_DECISIONS } = await import("./mock-data");
    return MOCK_DECISIONS.find(d => d.id === id);
  }
}

// We will wire this up to a button later today!
export async function triggerGitHubSync() {
  const res = await fetch(`${API_BASE_URL}/api/sync`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to trigger sync");
  return await res.json();
}

export async function getAdrs(): Promise<ADR[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/adrs`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch adrs");
    return await res.json();
  } catch (error) {
    console.warn("Backend not running or unreachable, falling back to mock data!");
    const { MOCK_ADRS } = await import("./mock-data");
    return MOCK_ADRS;
  }
}

export async function getAdr(id: string): Promise<ADR | undefined> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/adrs/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch adr");
    return await res.json();
  } catch (error) {
    console.warn("Backend not running or unreachable, falling back to mock data!");
    const { MOCK_ADRS } = await import("./mock-data");
    return MOCK_ADRS.find(a => a.id === id);
  }
}