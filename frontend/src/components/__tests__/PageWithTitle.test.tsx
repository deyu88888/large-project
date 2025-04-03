import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import PageWithTitle from '../PageWithTitle';

describe('PageWithTitle Component', () => {
  const originalTitle = document.title;
  
  beforeEach(() => {
    document.title = originalTitle;
  });

  afterAll(() => {
    document.title = originalTitle;
  });

  it('updates document title when mounted', () => {
    const testTitle = 'Test Page Title';
    render(
      <PageWithTitle title={testTitle}>
        <div>Test content</div>
      </PageWithTitle>
    );
    expect(document.title).toBe(testTitle);
  });

  it('renders children correctly', () => {
    const testContent = 'Child content test';
    render(
      <PageWithTitle title="Any Title">
        <div>{testContent}</div>
      </PageWithTitle>
    );
    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it('updates document title when title prop changes', () => {
    const initialTitle = 'Initial Title';
    const updatedTitle = 'Updated Title';
    const { rerender } = render(
      <PageWithTitle title={initialTitle}>
        <div>Test content</div>
      </PageWithTitle>
    );
    expect(document.title).toBe(initialTitle);
    rerender(
      <PageWithTitle title={updatedTitle}>
        <div>Test content</div>
      </PageWithTitle>
    );
    expect(document.title).toBe(updatedTitle);
  });

  it('properly handles dependency array with title', () => {
    const titleSetter = vi.fn();
    const originalTitle = document.title;
    const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'title');
    Object.defineProperty(document, 'title', {
      configurable: true,
      get: function() { return originalTitle; },
      set: titleSetter
    });
    const testTitle = 'Stable Title';
    const { rerender } = render(
      <PageWithTitle title={testTitle}>
        <div>Test content</div>
      </PageWithTitle>
    );
    titleSetter.mockClear();
    rerender(
      <PageWithTitle title={testTitle}>
        <div>Updated content, same title</div>
      </PageWithTitle>
    );
    expect(titleSetter).not.toHaveBeenCalled();
    if (originalDescriptor) {
      Object.defineProperty(document, 'title', originalDescriptor);
    } else {
      document.title = originalTitle;
    }
  });
});