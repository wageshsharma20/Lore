export interface ModuleRiskData {
  id: string;
  name: string;
  size: number; // e.g., lines of code or complexity (determines box size)
  factors: {
    codeChurn: number; // 0-100
    complexity: number; // 0-100
    testCoverage: number; // 0-100 (inverted for risk, i.e., 100 means 0% coverage)
    issueVolume: number; // 0-100
    dependencyDepth: number; // 0-100
    age: number; // 0-100
  };
  loneContributor: string | null; // e.g., "@alice" or null
  overallRisk: number; // 0-100 calculated
}

export function calculateLoneContributor(decisions: { author: string; date: string }[]): string | null {
  // Sort decisions by date descending
  const sorted = [...decisions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Need at least 10 decisions to trigger the silo condition
  if (sorted.length < 10) return null;
  
  const last10 = sorted.slice(0, 10);
  const primaryAuthor = last10[0].author;
  
  // Check if every single one of the last 10 decisions traces back to the exact same author
  const isSilo = last10.every(d => d.author === primaryAuthor);
  
  return isSilo ? primaryAuthor : null;
}

// Mock Teams Table: Active employees
const ACTIVE_TEAM_MEMBERS = ["@alice", "@charlie", "@dave"]; // Notice @bob is missing (left the company)

// Simulated data to power the Treemap (until Person A finishes the graph query API)
export function getMockHeatmapData(): ModuleRiskData[] {
  const modules: Omit<ModuleRiskData, 'overallRisk'>[] = [
    {
      id: "mod-auth",
      name: "Authentication",
      size: 1200,
      factors: { codeChurn: 85, complexity: 70, testCoverage: 20, issueVolume: 60, dependencyDepth: 40, age: 90 },
      loneContributor: "@alice", // This triggers the silo condition
    },
    {
      id: "mod-ui",
      name: "UI Components",
      size: 3500,
      factors: { codeChurn: 90, complexity: 40, testCoverage: 10, issueVolume: 30, dependencyDepth: 20, age: 30 },
      loneContributor: null,
    },
    {
      id: "mod-db",
      name: "Database Layer",
      size: 2800,
      factors: { codeChurn: 30, complexity: 90, testCoverage: 60, issueVolume: 20, dependencyDepth: 80, age: 95 },
      loneContributor: null,
    },
    {
      id: "mod-api",
      name: "API Gateway",
      size: 1800,
      factors: { codeChurn: 60, complexity: 55, testCoverage: 30, issueVolume: 45, dependencyDepth: 50, age: 60 },
      loneContributor: null,
    },
    {
      id: "mod-payments",
      name: "Payments Integration",
      size: 900,
      factors: { codeChurn: 10, complexity: 85, testCoverage: 80, issueVolume: 15, dependencyDepth: 95, age: 75 },
      loneContributor: "@bob", // Another silo
    },
    {
      id: "mod-analytics",
      name: "Analytics Service",
      size: 2100,
      factors: { codeChurn: 40, complexity: 50, testCoverage: 40, issueVolume: 60, dependencyDepth: 30, age: 50 },
      loneContributor: null,
    },
  ];

  return modules.map(mod => {
    // 6 factors calculation
    const f = mod.factors;
    const baseRisk = (f.codeChurn + f.complexity + f.testCoverage + f.issueVolume + f.dependencyDepth + f.age) / 6;
    
    // Lone-contributor silo risk calculation
    let overallRisk = Math.round(baseRisk);
    
    if (mod.loneContributor) {
      // If the sole contributor is absent from the teams table (left the company), jump to CRITICAL risk (100).
      // Otherwise, they are still at the company, so it's a HIGH risk (+30 penalty, capped at 90).
      const hasLeftCompany = !ACTIVE_TEAM_MEMBERS.includes(mod.loneContributor);
      overallRisk = hasLeftCompany ? 100 : Math.min(overallRisk + 30, 90);
    }

    return { ...mod, overallRisk };
  });
}
