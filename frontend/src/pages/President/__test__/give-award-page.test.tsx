import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import GiveAwardPage from '../give-award-page'; // Adjust the import path as needed

// Create a mock theme
const theme = createTheme();

// Mock the dependencies
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Import after mocking
import { apiClient } from '../../../api'; // Adjust the import path as needed

describe('GiveAwardPage Component', () => {
  const mockNavigate = vi.fn();
  const mockStudentId = '456';
  const mockAlert = vi.fn();
  
  const mockAwards = [
    {
      id: 1,
      rank: 'Gold',
      title: 'Outstanding Achievement',
      description: 'Awarded for exceptional contributions',
      is_custom: false
    },
    {
      id: 2,
      rank: 'Silver',
      title: 'Excellence Award',
      description: 'Recognizes excellence in performance',
      is_custom: false
    },
    {
      id: 3,
      rank: 'Bronze',
      title: 'Participation Award',
      description: 'For active participation in society events',
      is_custom: true
    }
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock window.alert
    global.alert = mockAlert;

    // Mock useNavigate
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });

    // Mock API client success responses
    (apiClient.get).mockResolvedValue({
      data: mockAwards
    });
    
    (apiClient.post).mockResolvedValue({
      data: { success: true }
    });
  });

  // Rest of your test code remains the same
  // ...
});