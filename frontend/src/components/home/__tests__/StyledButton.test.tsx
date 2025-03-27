import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Button, ButtonProps, styled } from "@mui/material";


const StyledButton: React.FC<ButtonProps> = styled(Button)<ButtonProps>(
 ({ theme }) => {
  const isLight = theme.palette.mode === "light";
  return {
    position: "relative",
    padding: "12px 24px",
    fontWeight: "bold",
    boxShadow: "none",
    overflow: "visible",
    backgroundColor: "transparent",
    borderRadius: 0,
    zIndex: 2,
    color: theme.palette.mode === "light" ? "black" : "white",
    "& .MuiButton-startIcon, & .MuiButton-endIcon, & span": {
      position: "relative",
      zIndex: 3,
    },
    "&::before": {
      content: '""',
      position: "absolute",
      border: `2.5px solid ${
        theme.palette.mode === "light" ? "black" : "#333333"
      }`,
      width: "100%",
      height: "100%",
      backgroundColor: theme.palette.mode === "light" ? "#000000" : "#333333",
      top: "2px",
      left: "2px",
      borderRadius: 0,
      zIndex: 0,
      overflow: "hidden",
    },
    "&::after": {
      content: '""',
      position: "absolute",
      width: "100%",
      height: "100%",
      backgroundColor: isLight ? "#868dfb" : "#3e4396",
      border: `2.5px solid ${
        theme.palette.mode === "light" ? "black" : "#333333"
      }`,
      top: "-2px",
      left: "-2px",
      zIndex: 1,
      borderRadius: 0,
      overflow: "hidden",
    },
    "&:hover": {
      transform: "translate(0px, 0px)",
      "& .MuiButton-startIcon, & .MuiButton-endIcon, & span": {
        transform: "translate(4px, 4px)",
      },
    },
    "&:hover::after": {
      transform: "translate(4px, 4px)",
    },
  };
});

const renderWithTheme = (ui, { mode = 'light' } = {}) => {
  const theme = createTheme({
    palette: {
      mode,
    },
  });

  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('StyledButton', () => {
  it('renders with correct text content', () => {
    renderWithTheme(
      <StyledButton>Test Button</StyledButton>
    );
    
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeDefined();
  });

  it('applies custom classes when provided', () => {
    renderWithTheme(
      <StyledButton className="custom-class">Button with Class</StyledButton>
    );
    
    const button = screen.getByRole('button', { name: 'Button with Class' });
    expect(button.classList.contains('custom-class')).toBe(true);
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    
    renderWithTheme(
      <StyledButton onClick={handleClick}>Clickable Button</StyledButton>
    );
    
    const button = screen.getByRole('button', { name: 'Clickable Button' });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('supports being disabled', () => {
    renderWithTheme(
      <StyledButton disabled>Disabled Button</StyledButton>
    );
    
    const button = screen.getByRole('button', { name: 'Disabled Button' });
    expect(button).toHaveAttribute('disabled');
  });

  it('renders with start icon when provided', () => {
    renderWithTheme(
      <StyledButton startIcon={<span data-testid="test-icon">★</span>}>
        Button with Icon
      </StyledButton>
    );
    
    expect(screen.getByTestId('test-icon')).toBeDefined();
    expect(screen.getByRole('button', { name: /Button with Icon/ })).toBeDefined();
  });

  it('passes through variant prop to MUI Button', () => {
    renderWithTheme(
      <StyledButton variant="contained">Contained Button</StyledButton>
    );
    
    const button = screen.getByRole('button', { name: 'Contained Button' });
    expect(button.classList.contains('MuiButton-contained')).toBe(true);
  });

  it('passes through size prop to MUI Button', () => {
    renderWithTheme(
      <StyledButton size="small">Small Button</StyledButton>
    );
    
    const button = screen.getByRole('button', { name: 'Small Button' });
    expect(button.classList.contains('MuiButton-sizeSmall')).toBe(true);
  });

  it('renders in dark mode correctly', () => {
    renderWithTheme(
      <StyledButton>Dark Mode Button</StyledButton>,
      { mode: 'dark' }
    );
    
    
    
    expect(screen.getByRole('button', { name: 'Dark Mode Button' })).toBeDefined();
  });

  it('renders as a link when href is provided', () => {
    renderWithTheme(
      <StyledButton href="https:
    );
    
    const button = screen.getByRole('link', { name: 'Link Button' });
    expect(button.tagName).toBe('A');
    expect(button).toHaveAttribute('href', 'https:
  });

  it('passes data attributes through to the Button component', () => {
    renderWithTheme(
      <StyledButton data-testid="custom-test-id">Data Attribute Button</StyledButton>
    );
    
    expect(screen.getByTestId('custom-test-id')).toBeDefined();
    expect(screen.getByTestId('custom-test-id').textContent).toBe('Data Attribute Button');
  });
});