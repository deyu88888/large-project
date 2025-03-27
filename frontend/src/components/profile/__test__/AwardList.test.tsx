import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import AwardList from '../AwardList'; 
import { tokens } from '../../../theme/theme';  
import { ThemeProvider, createTheme } from '@mui/material';

vi.mock('../../theme/theme', () => ({
  tokens: vi.fn().mockReturnValue({
    grey: {
      100: '#f0f0f0',
      300: '#c0c0c0',
      500: '#808080',
    },
    primary: {
      500: '#1976d2',
    },
  }),
}));

describe('AwardList Component', () => {
  const mockColors = tokens();
  
  const mockAwards = [
    {
      id: 1,
      award: {
        title: 'Best Performance',
        description: 'Awarded for exceptional performance',
        rank: 'Gold' as const,
      },
    },
    {
      id: 2,
      award: {
        title: 'Innovation Award',
        description: 'Recognized for innovative ideas',
        rank: 'Silver' as const,
      },
    },
    {
      id: 3,
      award: {
        title: 'Team Player',
        description: 'Acknowledged for collaborative efforts',
        rank: 'Bronze' as const,
      },
    },
  ];

  const defaultProps = {
    userId: 1,
    awards: [],
    isSelf: false,
    colors: mockColors,
  };

  const renderWithTheme = (ui: React.ReactElement) => {
    const theme = createTheme();
    return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
  };

  test('renders Awards & Achievements title correctly', () => {
    renderWithTheme(<AwardList {...defaultProps} />);
    expect(screen.getByText('Awards & Achievements')).toBeInTheDocument();
  });

  test('displays message when user has no awards and is not the current user', () => {
    renderWithTheme(<AwardList {...defaultProps} isSelf={false} />);
    expect(screen.getByText("This user hasn't earned any awards yet")).toBeInTheDocument();
  });

  test('displays message when user has no awards and is the current user', () => {
    renderWithTheme(<AwardList {...defaultProps} isSelf={true} />);
    expect(screen.getByText("You haven't earned any awards yet")).toBeInTheDocument();
  });

  test('renders awards correctly when provided', () => {
    renderWithTheme(<AwardList {...defaultProps} awards={mockAwards} />);
    
    // Check if all award titles are rendered
    expect(screen.getByText('Best Performance')).toBeInTheDocument();
    expect(screen.getByText('Innovation Award')).toBeInTheDocument();
    expect(screen.getByText('Team Player')).toBeInTheDocument();
    
    // Check if all award descriptions are rendered
    expect(screen.getByText('Awarded for exceptional performance')).toBeInTheDocument();
    expect(screen.getByText('Recognized for innovative ideas')).toBeInTheDocument();
    expect(screen.getByText('Acknowledged for collaborative efforts')).toBeInTheDocument();
    
    // Check if all award ranks are rendered
    expect(screen.getByText('Gold Award')).toBeInTheDocument();
    expect(screen.getByText('Silver Award')).toBeInTheDocument();
    expect(screen.getByText('Bronze Award')).toBeInTheDocument();
  });

  test('does not render "no awards" message when awards are present', () => {
    renderWithTheme(<AwardList {...defaultProps} awards={mockAwards} />);
    
    expect(screen.queryByText("You haven't earned any awards yet")).not.toBeInTheDocument();
    expect(screen.queryByText("This user hasn't earned any awards yet")).not.toBeInTheDocument();
  });

  test('renders trophy icons with correct colors', () => {
    const { container } = renderWithTheme(<AwardList {...defaultProps} awards={mockAwards} />);
    
    const trophyElements = container.querySelectorAll('svg');
    expect(trophyElements.length).toBe(3); // Should have 3 trophy icons
  });
});