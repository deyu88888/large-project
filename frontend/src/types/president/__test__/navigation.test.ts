import { describe, it, expect } from 'vitest';
import { NavigationItem } from './navigation';

describe('NavigationItem', () => {
  it('should create a valid navigation item', () => {
    const navItem: NavigationItem = {
      text: 'Home',
      path: '/home',
      color: '#ff0000'
    };
    
    expect(navItem).toBeDefined();
    expect(navItem.text).toBe('Home');
    expect(navItem.path).toBe('/home');
    expect(navItem.color).toBe('#ff0000');
  });

  it('should handle empty values', () => {
    const navItem: NavigationItem = {
      text: '',
      path: '',
      color: ''
    };
    
    expect(navItem).toBeDefined();
    expect(navItem.text).toBe('');
    expect(navItem.path).toBe('');
    expect(navItem.color).toBe('');
  });

  it('should match the expected interface structure', () => {
    const navItem = {
      text: 'About',
      path: '/about',
      color: '#00ff00',
      extraProp: 'should not be checked'
    };
    
    // Type assertion to check if the object has the expected properties
    // This test is more about TypeScript validation than runtime testing
    const { text, path, color } = navItem as NavigationItem;
    
    expect(text).toBe('About');
    expect(path).toBe('/about');
    expect(color).toBe('#00ff00');
  });
});