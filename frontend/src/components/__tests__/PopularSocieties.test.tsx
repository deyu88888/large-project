import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import PopularSocieties from '../PopularSocieties';
import { getPopularSocieties } from '../../api';
import { ThemeProvider, createTheme } from '@mui/material/styles';

vi.mock('../../api', () => ({
  getPopularSocieties: vi.fn()
}));

const mockSocieties = [
  {
    id: 1,
    name: 'Chess Club',
    total_members: 45,
    total_events: 12,
    total_event_attendance: 230,
    popularity_score: 87,
  },
  {
    id: 2,
    name: 'Coding Society',
    total_members: 78,
    total_events: 8,
    total_event_attendance: 310,
    popularity_score: 92,
  },
];

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

describe('PopularSocieties Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('displays loading state initially', () => {
    getPopularSocieties.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 500))
    );

    render(
      <ThemeProvider theme={lightTheme}>
        <PopularSocieties />
      </ThemeProvider>
    );

    expect(screen.getByText('Loading popular societies...')).toBeDefined();
  });

  test('displays societies after successful data fetch in light mode', async () => {
    getPopularSocieties.mockResolvedValue(mockSocieties);

    const { container } = render(
      <ThemeProvider theme={lightTheme}>
        <PopularSocieties />
      </ThemeProvider>
    );

    expect(screen.getByText('Loading popular societies...')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Most Popular Societies')).toBeDefined();
    });

    expect(screen.getByText('Chess Club')).toBeDefined();
    expect(screen.getByText('Coding Society')).toBeDefined();
    
    const societyItems = container.querySelectorAll('li');
    expect(societyItems.length).toBe(2);
    
    const firstSociety = societyItems[0];
    expect(firstSociety.textContent).toContain('Chess Club');
    expect(firstSociety.textContent).toContain('45');
    expect(firstSociety.textContent).toContain('Members');
    expect(firstSociety.textContent).toContain('12');
    expect(firstSociety.textContent).toContain('Events');
    expect(firstSociety.textContent).toContain('230');
    expect(firstSociety.textContent).toContain('Attendees');
    expect(firstSociety.textContent).toContain('Score: 87');
    
    const secondSociety = societyItems[1];
    expect(secondSociety.textContent).toContain('Coding Society');
    expect(secondSociety.textContent).toContain('78');
    expect(secondSociety.textContent).toContain('Members');
    expect(secondSociety.textContent).toContain('8');
    expect(secondSociety.textContent).toContain('Events');
    expect(secondSociety.textContent).toContain('310');
    expect(secondSociety.textContent).toContain('Attendees');
    expect(secondSociety.textContent).toContain('Score: 92');
    
    expect(getPopularSocieties).toHaveBeenCalledTimes(1);
  });

  test('displays societies after successful data fetch in dark mode', async () => {
    getPopularSocieties.mockResolvedValue(mockSocieties);

    render(
      <ThemeProvider theme={darkTheme}>
        <PopularSocieties />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Most Popular Societies')).toBeDefined();
    });

    expect(screen.getByText('Chess Club')).toBeDefined();
    expect(screen.getByText('Coding Society')).toBeDefined();
  });

  test('displays error message when API call fails', async () => {
    getPopularSocieties.mockRejectedValue(new Error('API Error'));

    render(
      <ThemeProvider theme={lightTheme}>
        <PopularSocieties />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch popular societies.')).toBeDefined();
    });

    expect(getPopularSocieties).toHaveBeenCalledTimes(1);
  });

  test('displays message when no societies are returned', async () => {
    getPopularSocieties.mockResolvedValue([]);

    render(
      <ThemeProvider theme={lightTheme}>
        <PopularSocieties />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Most Popular Societies')).toBeDefined();
    });

    expect(screen.getByText('No popular societies found.')).toBeDefined();
    
    expect(getPopularSocieties).toHaveBeenCalledTimes(1);
  });

  test('handles API error with detailed error message', async () => {
    const errorMessage = 'Network error: Unable to reach server';
    getPopularSocieties.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ThemeProvider theme={lightTheme}>
        <PopularSocieties />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch popular societies.')).toBeDefined();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  test('verifies DOM structure and CSS classes in light mode', async () => {
    getPopularSocieties.mockResolvedValue(mockSocieties);

    const { container } = render(
      <ThemeProvider theme={lightTheme}>
        <PopularSocieties />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Most Popular Societies')).toBeDefined();
    });

    const mainContainer = container.querySelector('div');
    expect(mainContainer).toBeDefined();
    expect(mainContainer?.className).toContain('bg-[#ffffff]');
    
    const trophyEmoji = screen.getByLabelText('trophy');
    expect(trophyEmoji).toBeDefined();
    expect(trophyEmoji.textContent).toBe('🏆');
    
    const societiesList = container.querySelector('ul');
    expect(societiesList).toBeDefined();
    expect(societiesList?.className).toContain('grid');
    
    const societyCards = container.querySelectorAll('li');
    expect(societyCards.length).toBe(2);
    expect(societyCards[0].className).toContain('hover:scale-105');
  });

  test('verifies DOM structure and CSS classes in dark mode', async () => {
    getPopularSocieties.mockResolvedValue(mockSocieties);

    const { container } = render(
      <ThemeProvider theme={darkTheme}>
        <PopularSocieties />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Most Popular Societies')).toBeDefined();
    });

    const mainContainer = container.querySelector('div');
    expect(mainContainer).toBeDefined();
    expect(mainContainer?.className).toContain('bg-[#141b2d]');
    
    const header = screen.getByText('Most Popular Societies');
    expect(header.className).toContain('text-white');
  });
});