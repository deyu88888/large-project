import { describe, it, expect } from 'vitest';
import {
  SocietyRouteParams,
  SocietyStudentRouteParams,
  SocietyEventRouteParams,
  StudentRouteParams,
  FilteredSocietyParams,
  ManageSocietyParams
} from '../routeParams';

describe('Route Params Types', () => {
  it('should create valid SocietyRouteParams object', () => {
    const params: SocietyRouteParams = {
      society_id: 'soc123'
    };
    
    expect(params.society_id).toBe('soc123');
    expect(Object.keys(params).length).toBe(1);
  });

  it('should create valid SocietyStudentRouteParams object', () => {
    const params: SocietyStudentRouteParams = {
      society_id: 'soc123',
      student_id: 'std456'
    };
    
    expect(params.society_id).toBe('soc123');
    expect(params.student_id).toBe('std456');
    expect(Object.keys(params).length).toBe(2);
  });

  it('should create valid SocietyEventRouteParams object', () => {
    const params: SocietyEventRouteParams = {
      society_id: 'soc123',
      event_id: 'evt789'
    };
    
    expect(params.society_id).toBe('soc123');
    expect(params.event_id).toBe('evt789');
    expect(Object.keys(params).length).toBe(2);
  });

  it('should create valid StudentRouteParams object', () => {
    const params: StudentRouteParams = {
      student_id: 'std456'
    };
    
    expect(params.student_id).toBe('std456');
    expect(Object.keys(params).length).toBe(1);
  });

  it('should create valid FilteredSocietyParams object with filter', () => {
    const paramsUpcoming: FilteredSocietyParams = {
      society_id: 'soc123',
      filter: 'upcoming'
    };
    
    expect(paramsUpcoming.society_id).toBe('soc123');
    expect(paramsUpcoming.filter).toBe('upcoming');
    
    const paramsPrevious: FilteredSocietyParams = {
      society_id: 'soc123',
      filter: 'previous'
    };
    
    expect(paramsPrevious.filter).toBe('previous');
    
    const paramsPending: FilteredSocietyParams = {
      society_id: 'soc123',
      filter: 'pending'
    };
    
    expect(paramsPending.filter).toBe('pending');
  });

  it('should create valid FilteredSocietyParams object without filter', () => {
    const params: FilteredSocietyParams = {
      society_id: 'soc123'
    };
    
    expect(params.society_id).toBe('soc123');
    expect(params.filter).toBeUndefined();
  });

  it('should create valid ManageSocietyParams object', () => {
    const params: ManageSocietyParams = {
      society_id: 'soc123'
    };
    
    expect(params.society_id).toBe('soc123');
    expect(Object.keys(params).length).toBe(1);
  });
});