import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Alert } from '../Alert';

describe('Alert Component', () => {
  it('renders the alert with default props', () => {
    const { getByRole } = render(<Alert>Test Alert</Alert>);
    
    const alertElement = getByRole('alert');
    expect(alertElement).toBeTruthy();
    expect(alertElement.textContent).toBe('Test Alert');
  });

  it('passes through additional MUI Alert props', () => {
    const { getByRole } = render(
      <Alert severity="error" color="error">
        Error Alert
      </Alert>
    );
    
    const alertElement = getByRole('alert');
    expect(alertElement).toHaveClass('MuiAlert-filledError');
  });

  it('matches snapshot with default props', () => {
    const { container } = render(<Alert>Snapshot Alert</Alert>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <Alert>
        <span>Custom Content</span>
      </Alert>
    );
    
    const childElement = getByText('Custom Content');
    expect(childElement).toBeTruthy();
  });

  it('has correct default MuiAlert props', () => {
    const { container } = render(<Alert>Default Props Alert</Alert>);
    const alertElement = container.firstChild as HTMLElement;
    
    expect(alertElement).toHaveClass('MuiAlert-filled');
    expect(alertElement).toHaveClass('MuiPaper-elevation6');
  });
});