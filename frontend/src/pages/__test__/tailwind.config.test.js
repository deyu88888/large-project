import { describe, it, expect } from 'vitest';
import tailwindConfig from '../../../tailwind.config.js';

describe('Tailwind CSS Configuration', () => {
  it('should have the correct content paths', () => {
    expect(tailwindConfig.content).toEqual([
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ]);
  });

  it('should have a theme object with extend property', () => {
    expect(tailwindConfig.theme).toBeDefined();
    expect(tailwindConfig.theme.extend).toBeDefined();
    expect(typeof tailwindConfig.theme.extend).toBe('object');
  });

  it('should have an empty plugins array', () => {
    expect(Array.isArray(tailwindConfig.plugins)).toBe(true);
    expect(tailwindConfig.plugins.length).toBe(0);
  });

  it('should export the config as default', () => {
    expect(tailwindConfig).toBeDefined();
  });

  it('should not have any unexpected properties', () => {
    const allowedProperties = ['content', 'theme', 'plugins'];
    const configProperties = Object.keys(tailwindConfig);
    
    configProperties.forEach(property => {
      expect(allowedProperties).toContain(property);
    });
  });
});