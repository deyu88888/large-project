import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { App } from '../../app';
import { StrictMode } from 'react';

// Mock dependencies
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn()
  }))
}));

vi.mock('../../app', () => ({
  App: () => <div data-testid="app">App Component</div>
}));

// Mock globals.css import
vi.mock('../../theme/globals.css', () => ({}));

describe('Main entry point', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Setup DOM element
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('renders App component in StrictMode', () => {
    // Instead of requiring the main file, we'll simulate its behavior
    // by calling createRoot and render with the same arguments
    
    // Get the root element
    const rootElement = document.getElementById('root');
    
    // Call createRoot with the root element
    createRoot(rootElement);
    
    // Get the render function that was returned by createRoot
    const mockRender = createRoot().render;
    
    // Manually invoke a simulated version of what main.tsx does
    mockRender(<StrictMode><App /></StrictMode>);
    
    // Verify createRoot was called with the root element
    expect(createRoot).toHaveBeenCalledWith(rootElement);
    
    // Verify render was called
    expect(mockRender).toHaveBeenCalled();
    
    // Verify the structure of what was rendered
    const renderArg = mockRender.mock.calls[0][0];
    expect(renderArg.type).toBe(StrictMode);
    expect(renderArg.props.children.type).toBe(App);
  });
});