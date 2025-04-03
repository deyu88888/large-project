import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingView } from '../LoadingView';

vi.mock('../CircularLoader', () => ({
  default: () => <div data-testid="mock-circular-loader" />
}));

describe('LoadingView', () => {
  it('renders without crashing', () => {
    render(<LoadingView />);
    const container = screen.getByTestId('mock-circular-loader');
    expect(container).toBeInTheDocument();
  });

  it('renders with correct container styling', () => {
    const { container } = render(<LoadingView />);
    const mainDiv = container.firstChild;
    
    expect(mainDiv).toHaveClass('flex');
    expect(mainDiv).toHaveClass('justify-center');
    expect(mainDiv).toHaveClass('items-center');
    expect(mainDiv).toHaveClass('w-screen');
    expect(mainDiv).toHaveClass('h-screen');
  });

  it('includes CircularLoader component', () => {
    render(<LoadingView />);
    expect(screen.getByTestId('mock-circular-loader')).toBeInTheDocument();
  });

  it('has CircularLoader as a direct child', () => {
    const { container } = render(<LoadingView />);
    const mainDiv = container.firstChild;
    const loaderElement = screen.getByTestId('mock-circular-loader');
    
    expect(mainDiv.firstChild).toBe(loaderElement);
    expect(mainDiv.childNodes.length).toBe(1);
  });
});