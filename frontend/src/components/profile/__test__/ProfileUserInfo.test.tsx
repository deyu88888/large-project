import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ProfileUserInfo from '../ProfileUserInfo';
import { tokens } from '../../../theme/theme';
import { apiClient } from '../../../api';
import { ThemeProvider, createTheme } from '@mui/material';
import { act } from 'react';

// Mock the theme tokens function
vi.mock('../../../theme/theme', () => ({
  tokens: vi.fn().mockReturnValue({
    grey: {
      100: '#ffffff',
      500: '#9e9e9e',
    },
    primary: {
      500: '#3f51b5',
    },
    greenAccent: {
      500: '#4caf50',
    }
  }),
}));

// Mock the API client
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('ProfileUserInfo Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithTheme = (ui: React.ReactElement) => {
    const theme = createTheme();
    return render(
      <ThemeProvider theme={theme}>
        {ui}
      </ThemeProvider>
    );
  };

  test('renders nothing when no major or society role is provided', () => {
    const { container } = renderWithTheme(<ProfileUserInfo />);
    
    // Component should return null, so container should be empty
    expect(container.firstChild).toBeNull();
  });

  test('renders only major when provided without society role', () => {
    renderWithTheme(<ProfileUserInfo major="Computer Science" />);
    
    expect(screen.getByText('User Information')).toBeInTheDocument();
    expect(screen.getByText('Major:')).toBeInTheDocument();
    expect(screen.getByText(/Computer Science/)).toBeInTheDocument();
    
    // Society role should not be present
    expect(screen.queryByText('Role:')).not.toBeInTheDocument();
  });

  test('fetches and renders president role when provided', async () => {
    // Mock API response
    apiClient.get.mockResolvedValueOnce({ data: { name: 'Computer Science Society' } });
    
    await act(async () => {
      renderWithTheme(
        <ProfileUserInfo 
          isPresident={true} 
          presidentOf={1} 
        />
      );
    });
    
    // Wait for API call to resolve and component to update
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/society/view/1/');
      expect(screen.getByText('Role:')).toBeInTheDocument();
      expect(screen.getByText(/President of Computer Science Society/)).toBeInTheDocument();
    });
  });

  test('fetches and renders vice president role when provided', async () => {
    // Mock API response
    apiClient.get.mockResolvedValueOnce({ data: { name: 'Engineering Society' } });
    
    await act(async () => {
      renderWithTheme(
        <ProfileUserInfo 
          isVicePresident={true} 
          vicePresidentOfSociety={2} 
        />
      );
    });
    
    // Wait for API call to resolve and component to update
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/society/view/2/');
      expect(screen.getByText('Role:')).toBeInTheDocument();
      expect(screen.getByText(/Vice President of Engineering Society/)).toBeInTheDocument();
    });
  });

  test('fetches and renders event manager role when provided', async () => {
    // Mock API response
    apiClient.get.mockResolvedValueOnce({ data: { name: 'Math Society' } });
    
    await act(async () => {
      renderWithTheme(
        <ProfileUserInfo 
          isEventManager={true} 
          eventManagerOfSociety={3} 
        />
      );
    });
    
    // Wait for API call to resolve and component to update
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/society/view/3/');
      expect(screen.getByText('Role:')).toBeInTheDocument();
      expect(screen.getByText(/Event Manager of Math Society/)).toBeInTheDocument();
    });
  });

  test('renders both major and society role when both are provided', async () => {
    // Mock API response
    apiClient.get.mockResolvedValueOnce({ data: { name: 'Physics Society' } });
    
    await act(async () => {
      renderWithTheme(
        <ProfileUserInfo 
          major="Physics"
          isPresident={true} 
          presidentOf={4} 
        />
      );
    });
    
    // Wait for API call to resolve and component to update
    await waitFor(() => {
      expect(screen.getByText('Major:')).toBeInTheDocument();
      // Use a more specific selector to avoid ambiguity with "Physics" text
      const majorElement = screen.getByText((content, element) => {
        return element?.tagName.toLowerCase() === 'p' && 
               element.textContent?.includes('Major:') && 
               element.textContent?.includes('Physics');
      });
      expect(majorElement).toBeInTheDocument();
      
      expect(screen.getByText('Role:')).toBeInTheDocument();
      expect(screen.getByText(/President of Physics Society/)).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    // Mock API error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    apiClient.get.mockRejectedValueOnce(new Error('API error'));
    
    await act(async () => {
      renderWithTheme(
        <ProfileUserInfo 
          major="Physics"  
          isPresident={true} 
          presidentOf={5} 
        />
      );
    });
    
    // Wait for API call to resolve and component to update
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/society/view/5/');
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      // Component should still render with major
      expect(screen.getByText('User Information')).toBeInTheDocument();
      expect(screen.getByText('Major:')).toBeInTheDocument();
    });
    
    // Role text should not be present because societyName is null after API error
    expect(screen.queryByText('Role:')).not.toBeInTheDocument();
    
    consoleErrorSpy.mockRestore();
  });

  test('prioritizes president role over vice president and event manager', async () => {
    // Mock API response
    apiClient.get.mockResolvedValueOnce({ data: { name: 'Multi-Role Society' } });
    
    await act(async () => {
      renderWithTheme(
        <ProfileUserInfo 
          isPresident={true}
          isVicePresident={true}
          isEventManager={true}
          presidentOf={6}
          vicePresidentOfSociety={6}
          eventManagerOfSociety={6}
        />
      );
    });
    
    // Wait for API call to resolve and component to update
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/society/view/6/');
      expect(screen.getByText('Role:')).toBeInTheDocument();
      expect(screen.getByText(/President of Multi-Role Society/)).toBeInTheDocument();
      
      // Should not display vice president or event manager
      expect(screen.queryByText(/Vice President of/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Event Manager of/)).not.toBeInTheDocument();
    });
  });

  test('prioritizes vice president role over event manager', async () => {
    // Mock API response
    apiClient.get.mockResolvedValueOnce({ data: { name: 'Dual-Role Society' } });
    
    await act(async () => {
      renderWithTheme(
        <ProfileUserInfo 
          isVicePresident={true}
          isEventManager={true}
          vicePresidentOfSociety={7}
          eventManagerOfSociety={7}
        />
      );
    });
    
    // Wait for API call to resolve and component to update
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/society/view/7/');
      expect(screen.getByText('Role:')).toBeInTheDocument();
      expect(screen.getByText(/Vice President of Dual-Role Society/)).toBeInTheDocument();
      
      // Should not display event manager
      expect(screen.queryByText(/Event Manager of/)).not.toBeInTheDocument();
    });
  });
});