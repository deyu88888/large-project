import { describe, it, expect } from 'vitest';
import { cn } from '../../../utils/cn';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
    expect(cn('foo', undefined, 'bar', null)).toBe('foo bar');
    expect(cn('foo', false && 'bar', true && 'baz')).toBe('foo baz');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    
    expect(cn(
      'base-class',
      isActive && 'active',
      isDisabled && 'disabled'
    )).toBe('base-class active');
    
    expect(cn(
      'base-class',
      isActive ? 'active' : 'inactive',
      isDisabled ? 'disabled' : 'enabled'
    )).toBe('base-class active enabled');
  });

  it('should properly handle arrays and objects', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
    expect(cn({ foo: true, bar: false })).toBe('foo');
    expect(cn(['foo'], { bar: true, baz: false })).toBe('foo bar');
  });

  it('should properly merge Tailwind classes', () => {
    // Test basic merging
    expect(cn('px-2 py-1', 'px-3')).toBe('py-1 px-3');
    
    // Test conflict resolution with different values
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    
    // Test with conditional classes
    const isError = true;
    expect(cn(
      'text-gray-500',
      isError && 'text-red-500'
    )).toBe('text-red-500');
    
    // Test variants
    expect(cn('hover:text-black', 'hover:text-white')).toBe('hover:text-white');
    
    // Test with complex combinations
    expect(cn(
      'px-2 py-1 text-sm font-medium text-gray-900',
      'hover:bg-gray-100 focus:outline-none',
      'px-4 md:px-6'
    )).toBe('py-1 text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none px-4 md:px-6');
  });

  it('should handle arbitrary values', () => {
    // Test with arbitrary values
    expect(cn(
      'grid grid-cols-1',
      'md:grid-cols-2',
      'lg:grid-cols-[repeat(3,_1fr)]'
    )).toBe('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[repeat(3,_1fr)]');
  });

  it('should handle multiple variants correctly', () => {
    expect(cn(
      'dark:hover:bg-gray-900',
      'dark:hover:bg-blue-900'
    )).toBe('dark:hover:bg-blue-900');
  });
});