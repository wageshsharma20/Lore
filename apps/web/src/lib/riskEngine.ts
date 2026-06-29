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

// Simulated data to power the Treemap
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
    // If a module's decisions are entirely by one person, it scores maximum silo risk (100).
    const overallRisk = mod.loneContributor ? 100 : Math.round(baseRisk);

    return { ...mod, overallRisk };
  });
}
