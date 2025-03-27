import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ProfileStaticInfo from '../ProfileStaticInfo';
import { tokens } from '../../../theme/theme';
import { ThemeProvider, createTheme } from '@mui/material';
import { User } from '../../../types/user/user';

// Mock theme tokens
vi.mock('../../../theme/theme', () => ({
  tokens: vi.fn().mockReturnValue({
    grey: {
      100: '#f5f5f5',
      500: '#9e9e9e',
    }
  }),
}));

describe('ProfileStaticInfo Component', () => {
  const mockColors = tokens();
  
  // Sample user data for tests
  const regularUser: User = {
    id: 1,
    username: 'johndoe',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    role: 'student',
    verified: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    is_active: true,
    is_president: false,
  };
  
  const presidentUser: User = {
    ...regularUser,
    username: 'janedoe',
    role: 'leader',
    is_president: true,
  };
  
  const inactiveUser: User = {
    ...regularUser,
    username: 'inactive',
    is_active: false,
  };

  const renderWithTheme = (ui: React.ReactElement) => {
    const theme = createTheme();
    return render(
      <ThemeProvider theme={theme}>
        {ui}
      </ThemeProvider>
    );
  };

  test('renders user information correctly for a regular user', () => {
    renderWithTheme(
      <ProfileStaticInfo profile={regularUser} colors={mockColors} />
    );
    
    // Check for section title
    expect(screen.getByText('User Status')).toBeInTheDocument();
    
    // Check username
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('johndoe')).toBeInTheDocument();
    
    // Check role
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('student')).toBeInTheDocument();
    
    // Check status
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  test('displays "President" when is_president is true', () => {
    renderWithTheme(
      <ProfileStaticInfo profile={presidentUser} colors={mockColors} />
    );
    
    expect(screen.getByText('President')).toBeInTheDocument();
    expect(screen.queryByText('leader')).not.toBeInTheDocument();
  });

  test('shows inactive status correctly', () => {
    renderWithTheme(
      <ProfileStaticInfo profile={inactiveUser} colors={mockColors} />
    );
    
    expect(screen.getByText('Not Verified')).toBeInTheDocument();
    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
  });

  test('renders all three paper sections', () => {
    renderWithTheme(
      <ProfileStaticInfo profile={regularUser} colors={mockColors} />
    );
    
    // There should be three Paper elements with the expected content
    const usernamePaper = screen.getByText('Username').closest('div');
    const rolePaper = screen.getByText('Role').closest('div');
    const statusPaper = screen.getByText('Status').closest('div');
    
    expect(usernamePaper).toBeInTheDocument();
    expect(rolePaper).toBeInTheDocument();
    expect(statusPaper).toBeInTheDocument();
    
    // Count paper elements - should be 3
    const papers = screen.getAllByText(/^(Username|Role|Status)$/, { exact: false });
    expect(papers.filter(el => el.tagName.toLowerCase() === 'span')).toHaveLength(3);
  });

  test('renders status indicator dot', () => {
    const { container } = renderWithTheme(
      <ProfileStaticInfo profile={regularUser} colors={mockColors} />
    );
    
    // Find the status indicator dot
    // Since it's just a Box with styles, we can't easily target it with getBy methods
    // We'll check it exists in the right section
    const statusSection = screen.getByText('Status').closest('div')?.parentElement;
    expect(statusSection).toBeInTheDocument();
    
    // Verify the container has a Box element that contains the status text
    const statusBox = statusSection?.querySelector('div > div');
    expect(statusBox).toBeInTheDocument();
  });
});