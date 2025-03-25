import { describe, it, expect } from 'vitest';
import { 
  mockStats, 
  mockRecentActivities, 
  mockNotifications, 
  mockSocietySpotlight, 
  mockEventCalendar 
} from '../../mockData.ts';

describe('Mock Data', () => {
  describe('mockStats', () => {
    it('should have the correct structure', () => {
      expect(mockStats).toHaveProperty('total_societies');
      expect(mockStats).toHaveProperty('total_events');
      expect(mockStats).toHaveProperty('pending_approvals');
      expect(mockStats).toHaveProperty('active_members');
    });

    it('should have the correct values', () => {
      expect(mockStats.total_societies).toBe(12);
      expect(mockStats.total_events).toBe(45);
      expect(mockStats.pending_approvals).toBe(3);
      expect(mockStats.active_members).toBe(150);
    });
  });

  describe('mockRecentActivities', () => {
    it('should be an array with correct length', () => {
      expect(Array.isArray(mockRecentActivities)).toBe(true);
      expect(mockRecentActivities).toHaveLength(3);
    });

    it('should have the correct structure', () => {
      mockRecentActivities.forEach(activity => {
        expect(activity).toHaveProperty('description');
        expect(typeof activity.description).toBe('string');
      });
    });

    it('should contain expected activities', () => {
      expect(mockRecentActivities[0].description).toContain('Chess Society');
      expect(mockRecentActivities[1].description).toContain('Photography Club');
      expect(mockRecentActivities[2].description).toContain('Music Society');
    });
  });

  describe('mockNotifications', () => {
    it('should be an array with correct length', () => {
      expect(Array.isArray(mockNotifications)).toBe(true);
      expect(mockNotifications).toHaveLength(3);
    });

    it('should have the correct structure', () => {
      mockNotifications.forEach(notification => {
        expect(notification).toHaveProperty('message');
        expect(typeof notification.message).toBe('string');
      });
    });

    it('should contain expected notifications', () => {
      expect(mockNotifications[0].message).toContain('Debate Society');
      expect(mockNotifications[1].message).toContain('Coding Bootcamp');
      expect(mockNotifications[2].message).toContain('Art Society');
    });
  });

  describe('mockSocietySpotlight', () => {
    it('should have the correct structure', () => {
      expect(mockSocietySpotlight).toHaveProperty('name');
      expect(mockSocietySpotlight).toHaveProperty('description');
      expect(mockSocietySpotlight).toHaveProperty('upcoming_event');
    });

    it('should have the correct values', () => {
      expect(mockSocietySpotlight.name).toBe('Robotics Club');
      expect(mockSocietySpotlight.description).toContain('robotics and AI');
      expect(mockSocietySpotlight.upcoming_event).toContain('Robot Wars');
    });
  });

  describe('mockEventCalendar', () => {
    it('should be an array with correct length', () => {
      expect(Array.isArray(mockEventCalendar)).toBe(true);
      expect(mockEventCalendar).toHaveLength(3);
    });

    it('should have the correct structure', () => {
      mockEventCalendar.forEach(calendarItem => {
        expect(calendarItem).toHaveProperty('date');
        expect(calendarItem).toHaveProperty('event');
        expect(typeof calendarItem.date).toBe('string');
        expect(typeof calendarItem.event).toBe('string');
      });
    });

    it('should contain valid dates in ISO format', () => {
      mockEventCalendar.forEach(calendarItem => {
        expect(calendarItem.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(() => new Date(calendarItem.date)).not.toThrow();
      });
    });

    it('should contain expected events', () => {
      expect(mockEventCalendar[0].event).toBe('Coding Bootcamp');
      expect(mockEventCalendar[1].event).toBe('Robot Wars');
      expect(mockEventCalendar[2].event).toBe('Art Exhibition');
    });
  });
});