import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StrictMode } from 'react';
// Create mock for render function
const mockRender = vi.fn();
// Mock createRoot to return an object with the mockRender function
vi.mock('react-dom/client', () => ({
    createRoot: vi.fn(() => ({
        render: mockRender
    }))
}));
// Mock App component
const MockApp = vi.fn(() => _jsx("div", { "data-testid": "app", children: "App Component" }));
vi.mock('../../app', () => ({
    App: MockApp
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
    it('renders App component in StrictMode', async () => {
        // Import the main module - this is what actually executes the code in main.tsx
        await import('../../main');
        // Get the root element that should have been used
        const rootElement = document.getElementById('root');
        // Import createRoot to check if it was called correctly
        const { createRoot } = await import('react-dom/client');
        // Verify createRoot was called with the root element
        expect(createRoot).toHaveBeenCalledWith(rootElement);
        // Verify render was called
        expect(mockRender).toHaveBeenCalled();
        // Verify the structure of what was rendered
        const renderArg = mockRender.mock.calls[0][0];
        expect(renderArg.type).toBe(StrictMode);
        expect(renderArg.props.children.type).toBe(MockApp);
    });
});
