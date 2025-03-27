import { describe, it, expect } from 'vitest';
import { Member, PendingMember } from '../member';

describe('Member interface', () => {
  it('should create a valid Member object', () => {
    const member: Member = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      username: 'johndoe'
    };

    expect(member).toBeDefined();
    expect(member.id).toBe(1);
    expect(member.first_name).toBe('John');
    expect(member.last_name).toBe('Doe');
    expect(member.username).toBe('johndoe');
  });

  it('should have the correct property types', () => {
    const member: Member = {
      id: 123,
      first_name: 'Jane',
      last_name: 'Smith',
      username: 'janesmith'
    };

    expect(typeof member.id).toBe('number');
    expect(typeof member.first_name).toBe('string');
    expect(typeof member.last_name).toBe('string');
    expect(typeof member.username).toBe('string');
  });
});

describe('PendingMember interface', () => {
  it('should create a valid PendingMember object', () => {
    const pendingMember: PendingMember = {
      id: 2,
      first_name: 'Alice',
      last_name: 'Johnson',
      username: 'alicej'
    };

    expect(pendingMember).toBeDefined();
    expect(pendingMember.id).toBe(2);
    expect(pendingMember.first_name).toBe('Alice');
    expect(pendingMember.last_name).toBe('Johnson');
    expect(pendingMember.username).toBe('alicej');
  });

  it('should have the correct property types', () => {
    const pendingMember: PendingMember = {
      id: 456,
      first_name: 'Bob',
      last_name: 'Brown',
      username: 'bobbrown'
    };

    expect(typeof pendingMember.id).toBe('number');
    expect(typeof pendingMember.first_name).toBe('string');
    expect(typeof pendingMember.last_name).toBe('string');
    expect(typeof pendingMember.username).toBe('string');
  });
});

describe('Member and PendingMember equivalence', () => {
  it('should allow assigning a PendingMember to a Member variable', () => {
    const pendingMember: PendingMember = {
      id: 3,
      first_name: 'Charlie',
      last_name: 'Davis',
      username: 'charlied'
    };
    
    // This should work because the interfaces have the same shape
    const member: Member = pendingMember;
    
    expect(member).toEqual(pendingMember);
  });
});