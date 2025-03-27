import { describe, it, expect } from 'vitest';
import {
  Society,
  SocietyData,
  FilterType,
  FilterOption
} from '../society';

describe('Society', () => {
  it('should correctly create a Society object', () => {
    const society: Society = {
      id: 1,
      name: 'Chess Club',
      customProperty: 'custom value'
    };

    expect(society.id).toBe(1);
    expect(society.name).toBe('Chess Club');
    expect(society.customProperty).toBe('custom value');
  });
});

describe('SocietyData', () => {
  it('should correctly create a SocietyData object', () => {
    const societyData: SocietyData = {
      name: 'Photography Club',
      category: 'Arts',
      social_media_links: {
        instagram: 'https://instagram.com/photo_club',
        twitter: 'https://twitter.com/photo_club'
      },
      membership_requirements: 'Open to all students',
      upcoming_projects_or_plans: 'Exhibition in May',
      description: 'A club for photography enthusiasts',
      tags: ['arts', 'photography', 'creative']
    };

    expect(societyData.name).toBe('Photography Club');
    expect(societyData.category).toBe('Arts');
    expect(societyData.social_media_links.instagram).toBe('https://instagram.com/photo_club');
    expect(societyData.membership_requirements).toBe('Open to all students');
    expect(societyData.tags).toHaveLength(3);
    expect(societyData.tags).toContain('photography');
  });

  it('should allow optional id field in SocietyData', () => {
    const societyData: SocietyData = {
      id: 5,
      name: 'Debate Club',
      category: 'Academic',
      social_media_links: {},
      membership_requirements: 'None',
      upcoming_projects_or_plans: 'Weekly debates',
      description: 'A club for debate enthusiasts',
      tags: ['academic', 'debate']
    };

    expect(societyData.id).toBe(5);
  });

  it('should allow optional icon field in SocietyData', () => {
    const societyData: SocietyData = {
      name: 'Gaming Club',
      category: 'Entertainment',
      social_media_links: {},
      membership_requirements: 'None',
      upcoming_projects_or_plans: 'Tournament',
      description: 'A club for gamers',
      tags: ['gaming'],
      icon: 'gaming-icon.png'
    };

    expect(societyData.icon).toBe('gaming-icon.png');
  });
});

describe('FilterType', () => {
  it('should correctly validate FilterType values', () => {
    const upcoming: FilterType = 'upcoming';
    const previous: FilterType = 'previous';
    const pending: FilterType = 'pending';
    
    expect(upcoming).toBe('upcoming');
    expect(previous).toBe('previous');
    expect(pending).toBe('pending');
  });
});

describe('FilterOption', () => {
  it('should correctly create FilterOption objects', () => {
    const filterOption: FilterOption = {
      label: 'Upcoming Events',
      value: 'upcoming',
      color: '#4CAF50'
    };

    expect(filterOption.label).toBe('Upcoming Events');
    expect(filterOption.value).toBe('upcoming');
    expect(filterOption.color).toBe('#4CAF50');
  });
});