import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AssignSocietyRole from '../assign-society-role'; // Adjust the import path as needed

// Mock the dependencies - use the SAME path as your actual import
vi.mock('../../../api', () => ({
  apiClient: {
    patch: vi.fn(),
  },
}));

// Import after mocking
import { apiClient } from '../../../api'; // Adjust the import path as needed

// Create a mock theme
const theme = createTheme();

describe('AssignSocietyRole Component', () => {
  const mockNavigate = vi.fn();
  const mockSocietyId = '123';
  const mockStudentId = '456';
  const mockAlert = vi.fn();

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

    // Mock API client success response
    (apiClient.patch).mockResolvedValue({
      data: { success: true }
    });
  });

  // Rest of the file remains the same
  // ...
});