import { describe, it, expect } from 'vitest';
import { Award } from '../award';

describe('Award Interface', () => {
  it('should create a valid award object', () => {
    const award: Award = {
      id: 1,
      rank: 'Gold',
      title: 'Best Performance',
      description: 'Awarded for outstanding performance',
      is_custom: false
    };

    expect(award).toBeDefined();
    expect(award.id).toBe(1);
    expect(award.rank).toBe('Gold');
    expect(award.title).toBe('Best Performance');
    expect(award.description).toBe('Awarded for outstanding performance');
    expect(award.is_custom).toBe(false);
  });

  it('should handle custom awards', () => {
    const customAward: Award = {
      id: 2,
      rank: 'Special',
      title: 'Innovation Award',
      description: 'Awarded for innovative ideas',
      is_custom: true
    };

    expect(customAward.is_custom).toBe(true);
  });

  it('should accept numeric IDs', () => {
    const awards: Award[] = [
      {
        id: 1,
        rank: 'Gold',
        title: 'First Place',
        description: 'Winner',
        is_custom: false
      },
      {
        id: 2,
        rank: 'Silver',
        title: 'Second Place',
        description: 'Runner-up',
        is_custom: false
      }
    ];

    expect(awards[0].id).toBeLessThan(awards[1].id);
    expect(awards).toHaveLength(2);
  });
});