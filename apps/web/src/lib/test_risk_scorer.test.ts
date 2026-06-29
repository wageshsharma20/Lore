import { describe, it, expect } from 'vitest';
import { getMockHeatmapData } from './riskEngine';

describe('Risk Scorer Engine', () => {
  it('should calculate base risk correctly without silo penalties using weighted formula', async () => {
    const data = await getMockHeatmapData();
    const uiModule = data.find(m => m.id === 'mod-ui');
    
    // UI module factors: codeChurn: 90, complexity: 40, testCoverage: 10, issueVolume: 30, dependencyDepth: 20, age: 30
    // Weighted Sum: (90*0.25) + (10*0.20) + (40*0.15) + (30*0.15) + (20*0.15) + (30*0.10) = 41
    expect(uiModule?.loneContributor).toBeNull();
    expect(uiModule?.overallRisk).toBe(41);
  });

  it('should apply CRITICAL risk (100) if lone contributor is no longer in the active teams table', async () => {
    const data = await getMockHeatmapData();
    const paymentsModule = data.find(m => m.id === 'mod-payments');
    
    // Payments module has loneContributor: "@bob"
    // "@bob" is NOT in ACTIVE_TEAM_MEMBERS fallback
    expect(paymentsModule?.loneContributor).toBe('@bob');
    expect(paymentsModule?.overallRisk).toBe(100);
  });

  it('should apply HIGH risk (+30 penalty, capped at 90) if lone contributor is still active', async () => {
    const data = await getMockHeatmapData();
    const authModule = data.find(m => m.id === 'mod-auth');
    
    // Auth module has loneContributor: "@alice"
    // "@alice" IS in ACTIVE_TEAM_MEMBERS fallback
    // Base risk: (85*0.25) + (20*0.20) + (70*0.15) + (60*0.15) + (40*0.15) + (90*0.10) = 59.75 -> 60
    // 60 + 30 penalty = 90.
    expect(authModule?.loneContributor).toBe('@alice');
    expect(authModule?.overallRisk).toBe(90);
  });
});
