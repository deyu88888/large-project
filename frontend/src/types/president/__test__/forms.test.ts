import { describe, it, expect } from 'vitest';
import type { FormData } from '../forms';

describe('FormData interface', () => {
  it('should create a valid FormData object', () => {
    const validFormData: FormData = {
      title: 'Employee of the Month',
      description: 'Recognition for outstanding performance',
      location: 'Main Conference Room',
      date: '2025-04-15',
      start_time: '14:00',
      duration: '1h'
    };

    expect(validFormData).toBeDefined();
    expect(validFormData.title).toBe('Employee of the Month');
    expect(validFormData.description).toBe('Recognition for outstanding performance');
    expect(validFormData.location).toBe('Main Conference Room');
    expect(validFormData.date).toBe('2025-04-15');
    expect(validFormData.start_time).toBe('14:00');
    expect(validFormData.duration).toBe('1h');
  });

  it('should validate all required properties exist', () => {
    const formData: FormData = {
      title: 'Team Achievement Award',
      description: 'Recognizing teamwork and collaboration',
      location: 'Virtual Meeting',
      date: '2025-05-20',
      start_time: '10:30',
      duration: '30m'
    };

    // Check that all required properties are present
    const requiredProps = ['title', 'description', 'location', 'date', 'start_time', 'duration'];
    for (const prop of requiredProps) {
      expect(formData).toHaveProperty(prop);
    }
  });

  it('should work with minimal valid data', () => {
    const minimalFormData: FormData = {
      title: 'Quick Recognition',
      description: '',
      location: 'Office',
      date: '2025-04-01',
      start_time: '09:00',
      duration: '15m'
    };

    expect(minimalFormData).toBeDefined();
    // Even with empty description, object should be valid
    expect(Object.keys(minimalFormData).length).toBe(6);
  });
});