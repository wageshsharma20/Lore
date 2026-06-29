// src/lib/mock-data.ts

export type Decision = {
  id: string;
  title: string;
  decision_type: "architecture" | "library" | "infrastructure" | "removal";
  what: string;
  reason: string;               // The "why"
  author: string;               // Who championed it (Crucial for attribution)
  contributors: string[];       // Who reviewed it (Crucial for knowledge silos)
  date: string;                 // When it was merged
  affected_systems: string[];
  source_pr_url: string;
};

export const SHOW_EMPTY_STATE = false;

export const MOCK_DECISIONS: Decision[] = SHOW_EMPTY_STATE ? [] : [
  {
    id: "dec_1",
    title: "Remove Tailwind CSS",
    decision_type: "removal",
    what: "Removed Tailwind CSS from the web app.",
    reason: "Bundle size was getting too large, shifting to standard CSS modules to improve load times.",
    author: "@alice",
    contributors: ["@bob", "@charlie"],
    date: "2026-06-03",
    affected_systems: ["frontend"],
    source_pr_url: "https://github.com/myorg/lore/pull/12"
  },
  {
    id: "dec_2",
    title: "Adopt Next.js App Router",
    decision_type: "architecture",
    what: "Migrated from Pages router to App router.",
    reason: "To leverage React Server Components for better initial page loads.",
    author: "@david",
    contributors: ["@alice"],
    date: "2026-06-15",
    affected_systems: ["frontend"],
    source_pr_url: "https://github.com/myorg/lore/pull/45"
  }
];

export type HeatmapSummary = {
  total_decisions: number;
  red_silos: number;
  yellow_warnings: number;
  green_healthy: number;
};

export const MOCK_SUMMARY: HeatmapSummary = SHOW_EMPTY_STATE 
  ? { total_decisions: 0, red_silos: 0, yellow_warnings: 0, green_healthy: 0 }
  : {
      total_decisions: 124,
      red_silos: 2,         // Modules only 1 person understands!
      yellow_warnings: 5,
      green_healthy: 117
    };

export type ADR = {
  id: string;
  title: string;
  status: "Draft" | "Approved";
  author: string;
  date: string;
  content: string;
};

export const MOCK_ADRS: ADR[] = SHOW_EMPTY_STATE ? [] : [
  {
    id: "adr_1",
    title: "Migration to Postgres for relational data",
    status: "Approved",
    author: "@charlie",
    date: "2026-06-18",
    content: "# Context\nWe need a reliable relational database for user data.\n\n# Decision\nWe will use PostgreSQL.\n\n# Consequences\nBetter data integrity, but requires setup."
  },
  {
    id: "adr_2",
    title: "Implement Celery for async tasks",
    status: "Draft",
    author: "@alice",
    date: "2026-06-27",
    content: "# Context\nLong running AI extraction tasks are blocking the web server.\n\n# Decision\nWe will adopt Celery with a Redis broker.\n\n# Consequences\nIncreased infrastructure complexity, but significantly better UI responsiveness."
  }
];

export type PRCheckResult = {
  pr_number: string;
  status: 'passed' | 'blocked';
  author: string;
  reason: string;
  conflict_path: string | null;
  original_decision_id: string;
};

export const MOCK_PR_CHECKS: PRCheckResult[] = [
  {
    pr_number: "101",
    status: "blocked",
    author: "@alice",
    reason: "We removed Tailwind CSS because it was causing severe bundle bloat and class conflicts across our micro-frontends.",
    conflict_path: "(PR #101: Add Tailwind) -> CONFLICTS WITH -> (Decision: Remove Tailwind CSS)",
    original_decision_id: "dec_1"
  },
  {
    pr_number: "102",
    status: "passed",
    author: "@system",
    reason: "No architectural conflicts found.",
    conflict_path: null,
    original_decision_id: "none"
  }
];