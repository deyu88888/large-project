import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import SnackbarGlobal from '../SnackbarGlobal';

// Mock timer functions
vi.useFakeTimers();

describe('SnackbarGlobal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  test('renders with success message when open', () => {
    const onCloseMock = vi.fn();
    render(
      <SnackbarGlobal
        open={true}
        message="Operation successful"
        severity="success"
        onClose={onCloseMock}
      />
    );

    // Check if the message is visible
    expect(screen.getByText('Operation successful')).toBeInTheDocument();
    
    // Check if it has the success styling
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveClass('MuiAlert-standardSuccess');
  });

  test('renders with error message when open', () => {
    const onCloseMock = vi.fn();
    render(
      <SnackbarGlobal
        open={true}
        message="Operation failed"
        severity="error"
        onClose={onCloseMock}
      />
    );

    // Check if the message is visible
    expect(screen.getByText('Operation failed')).toBeInTheDocument();
    
    // Check if it has the error styling
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveClass('MuiAlert-standardError');
  });

  test('does not render when open is false', () => {
    const onCloseMock = vi.fn();
    render(
      <SnackbarGlobal
        open={false}
        message="Operation successful"
        severity="success"
        onClose={onCloseMock}
      />
    );

    // Message should not be visible
    expect(screen.queryByText('Operation successful')).not.toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const onCloseMock = vi.fn();
    render(
      <SnackbarGlobal
        open={true}
        message="Operation successful"
        severity="success"
        onClose={onCloseMock}
      />
    );

    // Find and click the close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    // Check if onClose was called
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  test('auto-hides after specified duration', async () => {
    const onCloseMock = vi.fn();
    render(
      <SnackbarGlobal
        open={true}
        message="Operation successful"
        severity="success"
        onClose={onCloseMock}
      />
    );

    // Advance timers to trigger auto-hide
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // Check if onClose was called
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });


  test('renders with the correct anchorOrigin', () => {
    const onCloseMock = vi.fn();
    const { container } = render(
      <SnackbarGlobal
        open={true}
        message="Operation successful"
        severity="success"
        onClose={onCloseMock}
      />
    );

    // Material-UI adds specific classes for positioning
    const snackbarElement = container.querySelector('.MuiSnackbar-root');
    expect(snackbarElement).toHaveClass('MuiSnackbar-anchorOriginTopCenter');
  });

  test('renders with a long message correctly', () => {
    const onCloseMock = vi.fn();
    const longMessage = 'This is a very long message that tests whether the snackbar can handle longer text content properly without any issues with layout or truncation.';
    
    render(
      <SnackbarGlobal
        open={true}
        message={longMessage}
        severity="success"
        onClose={onCloseMock}
      />
    );

    // Check if the full message is visible
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  test('Alert component receives 100% width styling', () => {
    const onCloseMock = vi.fn();
    const { container } = render(
      <SnackbarGlobal
        open={true}
        message="Operation successful"
        severity="success"
        onClose={onCloseMock}
      />
    );

    // Check the inline style on the Alert component
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveStyle('width: 100%');
  });
});