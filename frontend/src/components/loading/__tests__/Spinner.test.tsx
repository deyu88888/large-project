import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Spinner from '../Spinner';

describe('Spinner Component', () => {
  it('renders the spinner correctly', () => {
    const { container } = render(<Spinner />);
    
    const spinnerContainer = container.firstChild;
    expect(spinnerContainer).toBeTruthy();
    
    expect(spinnerContainer).toHaveClass('flex');
    expect(spinnerContainer).toHaveClass('justify-center');
    expect(spinnerContainer).toHaveClass('items-center');
    expect(spinnerContainer).toHaveClass('h-full');
    
    const spinnerElement = spinnerContainer?.firstChild;
    expect(spinnerElement).toBeTruthy();
    
    expect(spinnerElement).toHaveClass('animate-spin');
    expect(spinnerElement).toHaveClass('rounded-full');
    expect(spinnerElement).toHaveClass('h-12');
    expect(spinnerElement).toHaveClass('w-12');
    expect(spinnerElement).toHaveClass('border-t-4');
    expect(spinnerElement).toHaveClass('border-blue-500');
  });

  it('matches snapshot', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toMatchSnapshot();
  });
});