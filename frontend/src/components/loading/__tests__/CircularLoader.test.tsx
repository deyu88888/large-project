import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import CircularLoader from '../CircularLoader';
import { cn } from '../../../utils/cn';

vi.mock('../../../utils/cn', () => ({
  cn: vi.fn((...inputs) => inputs.join(' '))
}));

describe('CircularLoader', () => {
  it('renders without crashing', () => {
    const { container } = render(<CircularLoader />);
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('applies default classes to the svg element', () => {
    const { container } = render(<CircularLoader />);
    const svgElement = container.querySelector('svg');
    expect(svgElement).toHaveClass('text-gray-200');
    expect(svgElement).toHaveClass('w-20');
    expect(svgElement).toHaveClass('h-20');
    expect(svgElement).toHaveClass('animate-spin');
    expect(svgElement).toHaveClass('dark:text-gray-600');
    expect(svgElement).toHaveClass('fill-indigo-700');
  });

  it('applies custom className to both container div and svg element', () => {
    const customClass = 'custom-test-class';
    const { container } = render(<CircularLoader className={customClass} />);
    
    const svgElement = container.querySelector('svg');
    const containerDiv = svgElement.parentElement;
    
    expect(containerDiv).toHaveClass(customClass);
    expect(svgElement).toHaveClass(customClass);
    expect(cn).toHaveBeenCalledWith(
      'text-gray-200 w-20 h-20 animate-spin dark:text-gray-600 fill-indigo-700',
      customClass
    );
  });

  it('renders the correct SVG paths', () => {
    const { container } = render(<CircularLoader />);
    const svgElement = container.querySelector('svg');
    const pathElements = svgElement.querySelectorAll('path');
    
    expect(pathElements.length).toBe(2);
    expect(pathElements[0]).toHaveAttribute('fill', 'currentColor');
    expect(pathElements[1]).toHaveAttribute('fill', 'currentFill');
  });

  it('has the correct viewBox and other SVG attributes', () => {
    const { container } = render(<CircularLoader />);
    const svgElement = container.querySelector('svg');
    
    expect(svgElement).toHaveAttribute('viewBox', '0 0 100 101');
    expect(svgElement).toHaveAttribute('fill', 'none');
    expect(svgElement).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    expect(svgElement).toHaveAttribute('aria-hidden', 'true');
  });
});