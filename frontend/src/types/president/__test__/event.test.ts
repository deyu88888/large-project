import { describe, it, expect } from 'vitest';
import { Event, EventDetail, RouteParams, EventData } from './event';

describe('Event Types', () => {
  describe('Event interface', () => {
    it('should create an Event object with all required properties', () => {
      const event: Event = {
        id: 1,
        title: 'Test Event',
        date: '2025-04-15',
        start_time: '14:00',
        status: 'upcoming',
        hosted_by: 123,
        main_description: 'This is the main description',
        description: 'This is a detailed description',
        location: 'Test Location',
        duration: '2 hours',
        max_capacity: 50,
        current_attendees: [1, 2, 3]
      };

      expect(event).toBeDefined();
      expect(event.id).toBe(1);
      expect(event.title).toBe('Test Event');
      expect(event.date).toBe('2025-04-15');
      expect(event.status).toBe('upcoming');
      expect(event.current_attendees.length).toBe(3);
    });
  });

  describe('EventDetail interface', () => {
    it('should create an EventDetail object with all required properties', () => {
      const eventDetail: EventDetail = {
        id: 1,
        title: 'Test Event',
        description: 'This is a detailed description',
        location: 'Test Location',
        date: '2025-04-15',
        start_time: '14:00',
        duration: '2 hours',
        status: 'upcoming'
      };

      expect(eventDetail).toBeDefined();
      expect(eventDetail.id).toBe(1);
      expect(eventDetail.title).toBe('Test Event');
      expect(eventDetail.description).toBe('This is a detailed description');
      expect(eventDetail.location).toBe('Test Location');
    });
  });

  describe('RouteParams interface', () => {
    it('should handle RouteParams with society_id', () => {
      const params: RouteParams = {
        society_id: '123'
      };

      expect(params).toBeDefined();
      expect(params.society_id).toBe('123');
      expect(params.event_id).toBeUndefined();
    });

    it('should handle RouteParams with event_id', () => {
      const params: RouteParams = {
        event_id: '456'
      };

      expect(params).toBeDefined();
      expect(params.event_id).toBe('456');
      expect(params.society_id).toBeUndefined();
    });

    it('should handle RouteParams with both society_id and event_id', () => {
      const params: RouteParams = {
        society_id: '123',
        event_id: '456'
      };

      expect(params).toBeDefined();
      expect(params.society_id).toBe('123');
      expect(params.event_id).toBe('456');
    });
  });

  describe('EventData interface', () => {
    it('should create an EventData object with required properties', () => {
      const eventData: EventData = {
        title: 'Test Event',
        main_description: 'This is the main description',
        date: '2025-04-15',
        start_time: '14:00',
        duration: '2 hours',
        location: 'Test Location',
        max_capacity: 50,
        extra_modules: [],
        participant_modules: [],
        is_participant: false,
        is_member: true,
        event_id: 1,
        hosted_by: 123,
        current_attendees: []
      };

      expect(eventData).toBeDefined();
      expect(eventData.title).toBe('Test Event');
      expect(eventData.max_capacity).toBe(50);
      expect(eventData.is_participant).toBe(false);
      expect(eventData.is_member).toBe(true);
    });

    it('should handle optional cover_image_url property', () => {
      const eventData: EventData = {
        title: 'Test Event',
        main_description: 'This is the main description',
        date: '2025-04-15',
        start_time: '14:00',
        duration: '2 hours',
        location: 'Test Location',
        max_capacity: 50,
        cover_image_url: 'https://example.com/image.jpg',
        extra_modules: [],
        participant_modules: [],
        is_participant: false,
        is_member: true,
        event_id: 1,
        hosted_by: 123,
        current_attendees: []
      };

      expect(eventData).toBeDefined();
      expect(eventData.cover_image_url).toBe('https://example.com/image.jpg');
      expect(eventData.cover_image_file).toBeUndefined();
    });

    it('should handle optional cover_image_file property', () => {
      const mockFile = new File([''], 'filename.png', { type: 'image/png' });
      const eventData: EventData = {
        title: 'Test Event',
        main_description: 'This is the main description',
        date: '2025-04-15',
        start_time: '14:00',
        duration: '2 hours',
        location: 'Test Location',
        max_capacity: 50,
        cover_image_file: mockFile,
        extra_modules: [],
        participant_modules: [],
        is_participant: false,
        is_member: true,
        event_id: 1,
        hosted_by: 123,
        current_attendees: []
      };

      expect(eventData).toBeDefined();
      expect(eventData.cover_image_file).toBe(mockFile);
      expect(eventData.cover_image_url).toBeUndefined();
    });
  });
});