import { describe, it, expect } from 'vitest';
import { 
  RoleOption, 
  RouteParams, 
  StudentIdParam, 
  ManageSocietyEventsParams, 
  SocietyIdParams 
} from '../role';

describe('Role interfaces', () => {
  it('should create a valid RoleOption object', () => {
    const roleOption: RoleOption = {
      key: 'admin',
      label: 'Administrator'
    };
    
    expect(roleOption.key).toBe('admin');
    expect(roleOption.label).toBe('Administrator');
  });

  it('should create a valid RouteParams object', () => {
    const routeParams: RouteParams = {
      society_id: 'soc123',
      student_id: 'std456'
    };
    
    expect(routeParams.society_id).toBe('soc123');
    expect(routeParams.student_id).toBe('std456');
  });

  it('should create a valid StudentIdParam object', () => {
    const studentIdParam: StudentIdParam = {
      student_id: 'std789'
    };
    
    expect(studentIdParam.student_id).toBe('std789');
  });

  it('should create valid ManageSocietyEventsParams objects with different filters', () => {
    // Without filter
    const paramsNoFilter: ManageSocietyEventsParams = {
      society_id: 'soc123'
    };
    
    expect(paramsNoFilter.society_id).toBe('soc123');
    expect(paramsNoFilter.filter).toBeUndefined();
    
    // With upcoming filter
    const paramsUpcoming: ManageSocietyEventsParams = {
      society_id: 'soc123',
      filter: 'upcoming'
    };
    
    expect(paramsUpcoming.society_id).toBe('soc123');
    expect(paramsUpcoming.filter).toBe('upcoming');
    
    // With previous filter
    const paramsPrevious: ManageSocietyEventsParams = {
      society_id: 'soc456',
      filter: 'previous'
    };
    
    expect(paramsPrevious.society_id).toBe('soc456');
    expect(paramsPrevious.filter).toBe('previous');
    
    // With pending filter
    const paramsPending: ManageSocietyEventsParams = {
      society_id: 'soc789',
      filter: 'pending'
    };
    
    expect(paramsPending.society_id).toBe('soc789');
    expect(paramsPending.filter).toBe('pending');
  });

  it('should create a valid SocietyIdParams object', () => {
    const societyIdParams: SocietyIdParams = {
      society_id: 'soc123'
    };
    
    expect(societyIdParams.society_id).toBe('soc123');
  });
});