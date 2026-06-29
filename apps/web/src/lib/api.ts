// src/lib/api.ts
import { components } from "./api-types";
import { PRCheckResult, MOCK_PR_CHECKS } from "./mock-data";
import { MOCK_DECISIONS, MOCK_SUMMARY, MOCK_ADRS } from "./mock-data";

// Extract types from the generated OpenAPI schema
export type Decision = components["schemas"]["Decision"];
export type HeatmapSummary = components["schemas"]["HeatmapSummary"];
export type ADR = components["schemas"]["ADR"];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getSummary(): Promise<HeatmapSummary> {
  const res = await fetch(`${API_BASE_URL}/api/summary`);
  if (!res.ok) throw new Error("Failed to fetch heatmap summary");
  return res.json();
}

export async function getDecisions(): Promise<Decision[]> {
  const res = await fetch(`${API_BASE_URL}/api/decisions`);
  if (!res.ok) throw new Error("Failed to fetch decisions");
  return res.json();
}

export async function searchDecisions(query: string): Promise<Decision[]> {
  const res = await fetch(`${API_BASE_URL}/api/decisions?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Failed to search decisions");
  return res.json();
}

export async function getDecision(id: string): Promise<Decision | undefined> {
  const res = await fetch(`${API_BASE_URL}/api/decisions/${id}`);
  if (!res.ok) throw new Error("Failed to fetch decision");
  return res.json();
}

export async function getAdrs(): Promise<ADR[]> {
  const res = await fetch(`${API_BASE_URL}/api/adrs`);
  if (!res.ok) throw new Error("Failed to fetch ADRs");
  return res.json();
}

export async function getAdr(id: string): Promise<ADR | undefined> {
  const res = await fetch(`${API_BASE_URL}/api/adrs/${id}`);
  if (!res.ok) throw new Error("Failed to fetch ADR");
  return res.json();
}

export async function getPrCheck(prNumber: string): Promise<PRCheckResult | undefined> {
  // Temporary mock data for UI demo
  return MOCK_PR_CHECKS.find(c => c.pr_number === prNumber);
}

export async function triggerGitHubSync() {
  const res = await fetch(`${API_BASE_URL}/api/sync`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to trigger GitHub sync");
  return res.json();
}

export async function memifyDecision(decisionId: string, adrUrl: string) {
  const res = await fetch(`${API_BASE_URL}/adrs/${decisionId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      decision_id: decisionId,
      ratified: true,
      adr_url: adrUrl
    })
  });
  if (!res.ok) throw new Error("Failed to memify decision");
  return res.json();
}

export async function isActiveTeamMember(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/api/members/${encodeURIComponent(id)}/active`);
  if (!res.ok) {
    throw new Error("Failed to check team member status");
  }
  return await res.json();
}