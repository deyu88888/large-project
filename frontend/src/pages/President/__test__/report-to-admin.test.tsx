import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ReportToAdmin from '../report-to-admin';
import { apiClient } from '../../../api';

const mockNavigate = vi.fn();

// Mock dependencies
vi.mock('../../../api', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

// Create a mock theme
const theme = createTheme();

describe('ReportToAdmin Component', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock useNavigate
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });

    // Reset API client mock
    (apiClient.post as vi.Mock).mockResolvedValue({});
  });

  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/president/report-to-admin']}>
          <Routes>
            <Route path="/president/report-to-admin" element={<ReportToAdmin />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('renders the report to admin page correctly', () => {
    renderComponent();

    // Check page title
    expect(screen.getByText('Report to Admin')).toBeInTheDocument();

    // Check form elements
    expect(screen.getByText('Type of Report')).toBeInTheDocument();
    expect(screen.getByText('Subject')).toBeInTheDocument();
    expect(screen.getByText('Report Details')).toBeInTheDocument();
    expect(screen.getByText('Submit Report')).toBeInTheDocument();
  });

  it('allows selecting different report types', () => {
    renderComponent();

    // Open select dropdown
    const selectElement = screen.getByRole('button', { name: /Misconduct/i });
    fireEvent.mouseDown(selectElement);

    // Check all menu items
    const reportTypes = ['Misconduct', 'System Issue', 'Society Issue', 'Event Issue', 'Other'];
    reportTypes.forEach(type => {
      expect(screen.getByText(type)).toBeInTheDocument();
    });

    // Select a different report type
    const systemIssueOption = screen.getByText('System Issue');
    fireEvent.click(systemIssueOption);

    // Verify selection
    expect(screen.getByRole('button', { name: /System Issue/i })).toBeInTheDocument();
  });

  it('allows entering subject and details', () => {
    renderComponent();

    // Find input fields
    const subjectInput = screen.getByRole('textbox', { name: /subject/i });
    const detailsInput = screen.getByRole('textbox', { name: /report details/i });

    // Enter text
    fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
    fireEvent.change(detailsInput, { target: { value: 'Test Details' } });

    // Verify input
    expect(subjectInput).toHaveValue('Test Subject');
    expect(detailsInput).toHaveValue('Test Details');
  });

  it('submits the report successfully', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderComponent();

    // Fill out the form
    const subjectInput = screen.getByRole('textbox', { name: /subject/i });
    const detailsInput = screen.getByRole('textbox', { name: /report details/i });
    const submitButton = screen.getByText('Submit Report');

    fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
    fireEvent.change(detailsInput, { target: { value: 'Test Details' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for API call
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/report-to-admin', {
        report_type: 'Misconduct',
        subject: 'Test Subject',
        details: 'Test Details'
      });
    });

    // Verify navigation and alert
    expect(mockNavigate).toHaveBeenCalledWith(-1);
    expect(alertSpy).toHaveBeenCalledWith('Report submitted successfully!');

    // Cleanup spies
    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('handles submission error', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock API error
    (apiClient.post as vi.Mock).mockRejectedValueOnce(new Error('Submission failed'));

    renderComponent();

    // Fill out the form
    const subjectInput = screen.getByRole('textbox', { name: /subject/i });
    const detailsInput = screen.getByRole('textbox', { name: /report details/i });
    const submitButton = screen.getByText('Submit Report');

    fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
    fireEvent.change(detailsInput, { target: { value: 'Test Details' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for error handling
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error submitting report:', 
        expect.any(Error)
      );
    });

    // Verify no navigation or alert on error
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();

    // Cleanup spies
    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('requires subject and details', () => {
    renderComponent();

    const submitButton = screen.getByText('Submit Report');
    const subjectInput = screen.getByRole('textbox', { name: /subject/i });
    const detailsInput = screen.getByRole('textbox', { name: /report details/i });

    // Check HTML5 required attribute
    expect(subjectInput).toBeRequired();
    expect(detailsInput).toBeRequired();
  });
});