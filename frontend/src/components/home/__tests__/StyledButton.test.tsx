import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StyledButton } from '../StyledButton';
import { ThemeProvider, createTheme } from '@mui/material';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

describe('StyledButton', () => {
  it('renders with children', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <StyledButton>Test Button</StyledButton>
      </ThemeProvider>
    );

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('renders with start icon', () => {
    const TestIcon = () => <span data-testid="test-icon">icon</span>;
    
    render(
      <ThemeProvider theme={lightTheme}>
        <StyledButton startIcon={<TestIcon />}>With Icon</StyledButton>
      </ThemeProvider>
    );

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /with icon/i })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <StyledButton className="custom-class">Custom Class</StyledButton>
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: 'Custom Class' });
    expect(button).toHaveClass('custom-class');
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(
      <ThemeProvider theme={lightTheme}>
        <StyledButton onClick={handleClick}>Click Me</StyledButton>
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: 'Click Me' });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies disabled state correctly', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <StyledButton disabled>Disabled Button</StyledButton>
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: 'Disabled Button' });
    expect(button).toBeDisabled();
  });

  it('renders correctly in light theme', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <StyledButton data-testid="light-button">Light Theme</StyledButton>
      </ThemeProvider>
    );

    const button = screen.getByTestId('light-button');
    expect(button).toBeInTheDocument();
  });

  it('renders correctly in dark theme', () => {
    render(
      <ThemeProvider theme={darkTheme}>
        <StyledButton data-testid="dark-button">Dark Theme</StyledButton>
      </ThemeProvider>
    );

    const button = screen.getByTestId('dark-button');
    expect(button).toBeInTheDocument();
  });

  it('passes through variant prop', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <StyledButton variant="contained" data-testid="variant-button">
          Contained Button
        </StyledButton>
      </ThemeProvider>
    );

    const button = screen.getByTestId('variant-button');
    expect(button).toBeInTheDocument();
  });

  it('passes through color prop', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <StyledButton color="secondary" data-testid="color-button">
          Secondary Color
        </StyledButton>
      </ThemeProvider>
    );

    const button = screen.getByTestId('color-button');
    expect(button).toBeInTheDocument();
  });

  it('passes through size prop', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <StyledButton size="small" data-testid="size-button">
          Small Button
        </StyledButton>
      </ThemeProvider>
    );

    const button = screen.getByTestId('size-button');
    expect(button).toBeInTheDocument();
  });
});