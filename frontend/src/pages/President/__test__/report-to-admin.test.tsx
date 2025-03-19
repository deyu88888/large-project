import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ReportToAdmin from '../ReportToAdmin';
import { apiClient } from '../../../api';

vi.mock('../../../api', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

describe('ReportToAdmin Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.post as vi.Mock).mockResolvedValue({});
  });

  const renderComponent = async (theme = lightTheme) => {
    let rendered;
    await act(async () => {
      rendered = render(
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={['/president/report-to-admin']}>
            <Routes>
              <Route path="/president/report-to-admin" element={<ReportToAdmin />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      );
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    return rendered;
  };

  it('renders the report to admin page correctly in light theme', async () => {
    await renderComponent(lightTheme);
    expect(screen.getByRole('heading', { name: 'Report to Admin' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Type of Report' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Subject' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Report Details' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Report' })).toBeInTheDocument();
  });

  it('renders the report to admin page correctly in dark theme', async () => {
    await renderComponent(darkTheme);
    expect(screen.getByRole('heading', { name: 'Report to Admin' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Type of Report' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Subject' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Report Details' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Report' })).toBeInTheDocument();
  });

  it('allows entering subject and details', async () => {
    await renderComponent();
    const subjectInput = screen.getByRole('textbox', { name: /Subject/i });
    const detailsInput = screen.getByRole('textbox', { name: /Report Details/i });
    await act(async () => {
      fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
      fireEvent.change(detailsInput, { target: { value: 'Test Details' } });
    });
    expect(subjectInput).toHaveValue('Test Subject');
    expect(detailsInput).toHaveValue('Test Details');
  });

  it('submits the form with default report type (Misconduct)', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    await renderComponent();
    const subjectInput = screen.getByRole('textbox', { name: /Subject/i });
    const detailsInput = screen.getByRole('textbox', { name: /Report Details/i });
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await act(async () => {
      fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
      fireEvent.change(detailsInput, { target: { value: 'Test Details' } });
      fireEvent.click(submitButton);
    });
    expect(apiClient.post).toHaveBeenCalledWith('/api/report-to-admin', {
      report_type: 'Misconduct',
      subject: 'Test Subject',
      details: 'Test Details',
    });
    expect(mockNavigate).toHaveBeenCalledWith(-1);
    expect(alertSpy).toHaveBeenCalledWith('Report submitted successfully!');
    alertSpy.mockRestore();
  });

  it('simulates choosing System Issue report type', async () => {
    await renderComponent();
    const nativeSelectInput = screen.getByDisplayValue('Misconduct');
    await act(async () => {
      fireEvent.change(nativeSelectInput, { target: { value: 'System Issue' } });
    });
    const subjectInput = screen.getByRole('textbox', { name: /Subject/i });
    const detailsInput = screen.getByRole('textbox', { name: /Report Details/i });
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await act(async () => {
      fireEvent.change(subjectInput, { target: { value: 'System Problem' } });
      fireEvent.change(detailsInput, { target: { value: 'Details about system issue' } });
      fireEvent.click(submitButton);
    });
    expect(apiClient.post).toHaveBeenCalledWith('/api/report-to-admin', {
      report_type: 'System Issue',
      subject: 'System Problem',
      details: 'Details about system issue',
    });
  });

  it('simulates choosing Society Issue report type', async () => {
    await renderComponent();
    const nativeSelectInput = screen.getByDisplayValue('Misconduct');
    await act(async () => {
      fireEvent.change(nativeSelectInput, { target: { value: 'Society Issue' } });
    });
    const subjectInput = screen.getByRole('textbox', { name: /Subject/i });
    const detailsInput = screen.getByRole('textbox', { name: /Report Details/i });
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await act(async () => {
      fireEvent.change(subjectInput, { target: { value: 'Society Problem' } });
      fireEvent.change(detailsInput, { target: { value: 'Details about society issue' } });
      fireEvent.click(submitButton);
    });
    expect(apiClient.post).toHaveBeenCalledWith('/api/report-to-admin', {
      report_type: 'Society Issue',
      subject: 'Society Problem',
      details: 'Details about society issue',
    });
  });

  it('simulates choosing Event Issue report type', async () => {
    await renderComponent();
    const nativeSelectInput = screen.getByDisplayValue('Misconduct');
    await act(async () => {
      fireEvent.change(nativeSelectInput, { target: { value: 'Event Issue' } });
    });
    const subjectInput = screen.getByRole('textbox', { name: /Subject/i });
    const detailsInput = screen.getByRole('textbox', { name: /Report Details/i });
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await act(async () => {
      fireEvent.change(subjectInput, { target: { value: 'Event Problem' } });
      fireEvent.change(detailsInput, { target: { value: 'Details about event issue' } });
      fireEvent.click(submitButton);
    });
    expect(apiClient.post).toHaveBeenCalledWith('/api/report-to-admin', {
      report_type: 'Event Issue',
      subject: 'Event Problem',
      details: 'Details about event issue',
    });
  });

  it('simulates choosing Other report type', async () => {
    await renderComponent();
    const nativeSelectInput = screen.getByDisplayValue('Misconduct');
    await act(async () => {
      fireEvent.change(nativeSelectInput, { target: { value: 'Other' } });
    });
    const subjectInput = screen.getByRole('textbox', { name: /Subject/i });
    const detailsInput = screen.getByRole('textbox', { name: /Report Details/i });
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await act(async () => {
      fireEvent.change(subjectInput, { target: { value: 'Other Problem' } });
      fireEvent.change(detailsInput, { target: { value: 'Details about other issue' } });
      fireEvent.click(submitButton);
    });
    expect(apiClient.post).toHaveBeenCalledWith('/api/report-to-admin', {
      report_type: 'Other',
      subject: 'Other Problem',
      details: 'Details about other issue',
    });
  });

  it('handles submission error and logs to console', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const testError = new Error('Submission failed');
    (apiClient.post as vi.Mock).mockRejectedValueOnce(testError);
    await renderComponent();
    const subjectInput = screen.getByRole('textbox', { name: /Subject/i });
    const detailsInput = screen.getByRole('textbox', { name: /Report Details/i });
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await act(async () => {
      fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
      fireEvent.change(detailsInput, { target: { value: 'Test Details' } });
      fireEvent.click(submitButton);
    });
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error submitting report:', testError);
    });
    expect(mockNavigate).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('handles submission with network error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const networkError = new Error('Network Error');
    networkError.name = 'NetworkError';
    (apiClient.post as vi.Mock).mockRejectedValueOnce(networkError);
    await renderComponent();
    const subjectInput = screen.getByRole('textbox', { name: /Subject/i });
    const detailsInput = screen.getByRole('textbox', { name: /Report Details/i });
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await act(async () => {
      fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
      fireEvent.change(detailsInput, { target: { value: 'Test Details' } });
      fireEvent.click(submitButton);
    });
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error submitting report:', networkError);
    });
    consoleErrorSpy.mockRestore();
  });

  it('requires subject and details', async () => {
    await renderComponent();
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    const subjectInput = screen.getByRole('textbox', { name: /Subject/i });
    const detailsInput = screen.getByRole('textbox', { name: /Report Details/i });
    expect(subjectInput).toBeRequired();
    expect(detailsInput).toBeRequired();
    await act(async () => {
      fireEvent.change(subjectInput, { target: { value: '' } });
      fireEvent.change(detailsInput, { target: { value: '' } });
      fireEvent.click(submitButton);
    });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('tests different event handling in form', async () => {
    await renderComponent();
    const subjectInput = screen.getByRole('textbox', { name: /Subject/i });
    await act(async () => {
      fireEvent.change(subjectInput, {
        target: { name: 'subject', value: 'First change' },
      });
    });
    expect(subjectInput).toHaveValue('First change');
    await act(async () => {
      fireEvent.change(subjectInput, {
        target: {
          name: 'subject',
          value: 'Second change',
          type: 'text',
          checked: false,
        },
      });
    });
    expect(subjectInput).toHaveValue('Second change');
  });
});