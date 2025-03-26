import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import PageWithTitle from '../../components/PageWithTitle';
describe('PageWithTitle Component', () => {
    const originalTitle = document.title;
    beforeEach(() => {
        // Reset document title before each test
        document.title = originalTitle;
    });
    afterAll(() => {
        // Restore original document title after all tests
        document.title = originalTitle;
    });
    it('updates document title when mounted', () => {
        // Arrange
        const testTitle = 'Test Page Title';
        // Act
        render(_jsx(PageWithTitle, { title: testTitle, children: _jsx("div", { children: "Test content" }) }));
        // Assert
        expect(document.title).toBe(testTitle);
    });
    it('renders children correctly', () => {
        // Arrange
        const testContent = 'Child content test';
        // Act
        render(_jsx(PageWithTitle, { title: "Any Title", children: _jsx("div", { children: testContent }) }));
        // Assert
        expect(screen.getByText(testContent)).toBeInTheDocument();
    });
    it('updates document title when title prop changes', () => {
        // Arrange
        const initialTitle = 'Initial Title';
        const updatedTitle = 'Updated Title';
        const { rerender } = render(_jsx(PageWithTitle, { title: initialTitle, children: _jsx("div", { children: "Test content" }) }));
        // Assert initial title
        expect(document.title).toBe(initialTitle);
        // Act - rerender with new title
        rerender(_jsx(PageWithTitle, { title: updatedTitle, children: _jsx("div", { children: "Test content" }) }));
        // Assert updated title
        expect(document.title).toBe(updatedTitle);
    });
    it('properly handles dependency array with title', () => {
        // Create a spy for document.title setter
        const titleSetter = vi.fn();
        const originalTitle = document.title;
        // Save original getter/setter
        const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'title');
        // Define our test getter/setter
        Object.defineProperty(document, 'title', {
            configurable: true,
            get: function () { return originalTitle; },
            set: titleSetter
        });
        // Act - render with initial title
        const testTitle = 'Stable Title';
        const { rerender } = render(_jsx(PageWithTitle, { title: testTitle, children: _jsx("div", { children: "Test content" }) }));
        // Clear mock to reset call count after initial render
        titleSetter.mockClear();
        // Act - rerender with same title
        rerender(_jsx(PageWithTitle, { title: testTitle, children: _jsx("div", { children: "Updated content, same title" }) }));
        // Assert - document.title setter should not be called when title hasn't changed
        expect(titleSetter).not.toHaveBeenCalled();
        // Cleanup - restore original behavior
        if (originalDescriptor) {
            Object.defineProperty(document, 'title', originalDescriptor);
        }
        else {
            // If for some reason we can't get the original descriptor, at least set the value back
            document.title = originalTitle;
        }
    });
});
