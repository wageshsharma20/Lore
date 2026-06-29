import { describe, it, expect } from 'vitest';
import { calculateLoneContributor } from '../riskEngine';

describe('calculateLoneContributor', () => {
  it('returns null if there are fewer than 10 decisions', () => {
    const decisions = Array.from({ length: 9 }).map((_, i) => ({
      author: '@alice',
      date: `2024-06-0${i + 1}`
    }));
    
    expect(calculateLoneContributor(decisions)).toBeNull();
  });

  it('returns the author if the last 10 decisions share the same author (Silo Risk)', () => {
    const decisions = Array.from({ length: 15 }).map((_, i) => ({
      author: '@alice',
      date: `2024-06-${(i + 1).toString().padStart(2, '0')}`
    }));
    
    expect(calculateLoneContributor(decisions)).toBe('@alice');
  });

  it('returns null if the last 10 decisions have mixed authors', () => {
    const decisions = Array.from({ length: 15 }).map((_, i) => ({
      author: i === 5 ? '@bob' : '@alice', // Inject @bob in the middle of the last 10
      date: `2024-06-${(i + 1).toString().padStart(2, '0')}`
    }));
    
    expect(calculateLoneContributor(decisions)).toBeNull();
  });

  it('sorts properly and evaluates only the 10 most recent decisions', () => {
    const decisions = [
      ...Array.from({ length: 10 }).map((_, i) => ({
        author: '@alice',
        date: `2024-07-${(i + 1).toString().padStart(2, '0')}`
      })),
      ...Array.from({ length: 5 }).map((_, i) => ({
        author: '@bob',
        date: `2024-06-${(i + 1).toString().padStart(2, '0')}` // older decisions
      }))
    ];
    
    // The most recent 10 are all alice, so it should flag alice despite bob's older commits
    expect(calculateLoneContributor(decisions)).toBe('@alice');
  });
});
