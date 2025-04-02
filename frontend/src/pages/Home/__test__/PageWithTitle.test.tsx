import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import PageWithTitle from '../../../components/PageWithTitle';

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
    render(
      <PageWithTitle title={testTitle}>
        <div>Test content</div>
      </PageWithTitle>
    );
    
    // Assert
    expect(document.title).toBe(testTitle);
  });

  it('renders children correctly', () => {
    // Arrange
    const testContent = 'Child content test';
    
    // Act
    render(
      <PageWithTitle title="Any Title">
        <div>{testContent}</div>
      </PageWithTitle>
    );
    
    // Assert
    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it('updates document title when title prop changes', () => {
    // Arrange
    const initialTitle = 'Initial Title';
    const updatedTitle = 'Updated Title';
    const { rerender } = render(
      <PageWithTitle title={initialTitle}>
        <div>Test content</div>
      </PageWithTitle>
    );
    
    // Assert initial title
    expect(document.title).toBe(initialTitle);
    
    // Act - rerender with new title
    rerender(
      <PageWithTitle title={updatedTitle}>
        <div>Test content</div>
      </PageWithTitle>
    );
    
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
      get: function() { return originalTitle; },
      set: titleSetter
    });
    
    // Act - render with initial title
    const testTitle = 'Stable Title';
    const { rerender } = render(
      <PageWithTitle title={testTitle}>
        <div>Test content</div>
      </PageWithTitle>
    );
    
    // Clear mock to reset call count after initial render
    titleSetter.mockClear();
    
    // Act - rerender with same title
    rerender(
      <PageWithTitle title={testTitle}>
        <div>Updated content, same title</div>
      </PageWithTitle>
    );
    
    // Assert - document.title setter should not be called when title hasn't changed
    expect(titleSetter).not.toHaveBeenCalled();
    
    // Cleanup - restore original behavior
    if (originalDescriptor) {
      Object.defineProperty(document, 'title', originalDescriptor);
    } else {
      // If for some reason we can't get the original descriptor, at least set the value back
      document.title = originalTitle;
    }
  });
});