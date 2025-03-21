// postcss.config.test.js
import { describe, it, expect } from 'vitest';
import postcssConfig from '../../../postcss.config.js';

describe('PostCSS Configuration', () => {
  it('should export an object with a plugins property', () => {
    expect(postcssConfig).toBeTypeOf('object');
    expect(postcssConfig).toHaveProperty('plugins');
    expect(postcssConfig.plugins).toBeTypeOf('object');
  });

  it('should include tailwindcss plugin', () => {
    expect(postcssConfig.plugins).toHaveProperty('tailwindcss');
  });

  it('should include autoprefixer plugin', () => {
    expect(postcssConfig.plugins).toHaveProperty('autoprefixer');
  });

  it('should have exactly two plugins configured', () => {
    expect(Object.keys(postcssConfig.plugins).length).toBe(2);
  });

  it('should have empty objects as plugin configurations', () => {
    expect(postcssConfig.plugins.tailwindcss).toEqual({});
    expect(postcssConfig.plugins.autoprefixer).toEqual({});
  });
});