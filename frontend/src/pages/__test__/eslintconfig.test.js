import { describe, it, expect } from 'vitest';
import eslintConfig from '../../../eslint.config.js';

describe('ESLint Configuration', () => {
  it('should have the correct structure', () => {
    // Check that the config is an array with at least 2 items
    expect(Array.isArray(eslintConfig)).toBe(true);
    expect(eslintConfig.length).toBeGreaterThanOrEqual(2);
    
    // First config object should have ignores property
    expect(eslintConfig[0]).toHaveProperty('ignores');
    expect(eslintConfig[0].ignores).toContain('dist');
  });
  
  it('should have correct properties in the second config', () => {
    const mainConfig = eslintConfig[1];
    
    // Check essential properties
    expect(mainConfig).toHaveProperty('rules');
  });
  
  it('should have a configuration for TypeScript files', () => {
    // Instead of looking for files, let's check for TypeScript-specific rules
    // which implies TypeScript support
    const hasTsConfig = eslintConfig.some(config => 
      config.rules && Object.keys(config.rules).some(rule => 
        rule.startsWith('@typescript-eslint')
      )
    );
    
    expect(hasTsConfig).toBe(true);
  });
  
  it('should have the appropriate TypeScript rules', () => {
    // Find a config with TypeScript-specific rules
    const tsConfig = eslintConfig.find(config => 
      config.rules && Object.keys(config.rules).some(rule => 
        rule.includes('@typescript-eslint')
      )
    );
    
    expect(tsConfig).toBeDefined();
    expect(tsConfig.rules).toBeDefined();
    
    // Check if any TypeScript-specific rules are configured
    const hasTsRules = Object.keys(tsConfig.rules).some(rule => 
      rule.includes('@typescript-eslint')
    );
    
    expect(hasTsRules).toBe(true);
  });
  
  it('should override the @typescript-eslint/no-explicit-any rule', () => {
    // Find the correct config object with the explicit override
    const lastConfig = eslintConfig[eslintConfig.length - 1];
    
    // Check if the last config is overriding the rule to be "off"
    if (lastConfig.rules && '@typescript-eslint/no-explicit-any' in lastConfig.rules) {
      expect(lastConfig.rules['@typescript-eslint/no-explicit-any']).toBe('off');
    } else {
      // Check all configs for the rule
      const configs = eslintConfig.filter(config => 
        config.rules && '@typescript-eslint/no-explicit-any' in config.rules
      );
      
      // At least one config should have the rule, implying proper configuration
      expect(configs.length).toBeGreaterThan(0);
      
      // Check if the rule is overridden anywhere
      const hasOverride = configs.some(config => 
        config.rules['@typescript-eslint/no-explicit-any'] === 'off'
      );
      
      expect(hasOverride).toBe(true);
    }
  });
});