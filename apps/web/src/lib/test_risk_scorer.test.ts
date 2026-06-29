import { describe, it, expect } from 'vitest';
import { getMockHeatmapData } from './riskEngine';

describe('Risk Scorer Engine', () => {
  it('should calculate base risk correctly without silo penalties', () => {
    const data = getMockHeatmapData();
    const uiModule = data.find(m => m.id === 'mod-ui');
    
    // UI module factors: codeChurn: 90, complexity: 40, testCoverage: 10, issueVolume: 30, dependencyDepth: 20, age: 30
    // Sum = 220. Average = 220 / 6 = 36.666 -> 37
    expect(uiModule?.loneContributor).toBeNull();
    expect(uiModule?.overallRisk).toBe(37);
  });

  it('should apply CRITICAL risk (100) if lone contributor is no longer in the active teams table', () => {
    const data = getMockHeatmapData();
    const paymentsModule = data.find(m => m.id === 'mod-payments');
    
    // Payments module has loneContributor: "@bob"
    // "@bob" is NOT in ACTIVE_TEAM_MEMBERS (which is ["@alice", "@charlie", "@dave"])
    expect(paymentsModule?.loneContributor).toBe('@bob');
    expect(paymentsModule?.overallRisk).toBe(100);
  });

  it('should apply HIGH risk (+30 penalty, capped at 90) if lone contributor is still active', () => {
    const data = getMockHeatmapData();
    const authModule = data.find(m => m.id === 'mod-auth');
    
    // Auth module has loneContributor: "@alice"
    // "@alice" IS in ACTIVE_TEAM_MEMBERS. 
    // Base risk: sum(85, 70, 20, 60, 40, 90) = 365 / 6 = 60.83 -> 61
    // 61 + 30 penalty = 91, but wait, the math capped it at 90.
    expect(authModule?.loneContributor).toBe('@alice');
    expect(authModule?.overallRisk).toBe(90);
  });
});
