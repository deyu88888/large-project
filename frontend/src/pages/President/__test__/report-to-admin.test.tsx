import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ReportToAdmin from '../report-to-admin';
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


const theme = createTheme();

describe('ReportToAdmin Component', () => {
  beforeEach(() => {
    
    vi.clearAllMocks();

    
    (apiClient.post).mockResolvedValue({});
  });

  const renderComponent = async () => {
    let renderedComponent;
    
    await act(async () => {
      renderedComponent = render(
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
    
    return renderedComponent;
  };

  it('renders the report to admin page correctly', async () => {
    await renderComponent();

   
    expect(screen.getByRole('heading', { name: 'Report to Admin' })).toBeInTheDocument();

   
    expect(screen.getByRole('heading', { name: 'Type of Report' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Subject' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Report Details' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Report' })).toBeInTheDocument();
  });

  it('allows selecting different report types', async () => {
    await renderComponent();

   
    const selectElement = screen.getByRole('combobox');
    
    await act(async () => {
      fireEvent.mouseDown(selectElement);
    });

    
    const reportTypes = ['Misconduct', 'System Issue', 'Society Issue', 'Event Issue', 'Other'];
    await waitFor(() => {
      reportTypes.forEach(type => {
        
        const option = screen.getByRole('option', { name: type });
        expect(option).toBeInTheDocument();
      });
    });

   
    const systemIssueOption = screen.getByRole('option', { name: 'System Issue' });
    
    await act(async () => {
      fireEvent.click(systemIssueOption);
    });

    
    await waitFor(() => {
      
      expect(selectElement.textContent).toBe('System Issue');
    });
  });

  it('allows entering subject and details', async () => {
    await renderComponent();

   
    const subjectInput = screen.getByRole('textbox', { name: /Subject/i });
    const detailsInput = screen.getByRole('textbox', { name: /Report Details/i });

    
    await act(async () => {
      fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
    });
    
    await act(async () => {
      fireEvent.change(detailsInput, { target: { value: 'Test Details' } });
    });

    
    expect(subjectInput).toHaveValue('Test Subject');
    expect(detailsInput).toHaveValue('Test Details');
  });

  it('submits the report successfully', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await renderComponent();

    
    const subjectInput = screen.getByRole('textbox', { name: /Subject/i });
    const detailsInput = screen.getByRole('textbox', { name: /Report Details/i });
    const submitButton = screen.getByRole('button', { name: /submit report/i });

   
    await act(async () => {
      fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
      fireEvent.change(detailsInput, { target: { value: 'Test Details' } });
    });

    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/report-to-admin', {
        report_type: 'Misconduct',
        subject: 'Test Subject',
        details: 'Test Details'
      });
    });

   
    expect(mockNavigate).toHaveBeenCalledWith(-1);
    expect(alertSpy).toHaveBeenCalledWith('Report submitted successfully!');

    
    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('handles submission error', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    
    (apiClient.post).mockRejectedValueOnce(new Error('Submission failed'));

    await renderComponent();

    
    const subjectInput = screen.getByRole('textbox', { name: /Subject/i });
    const detailsInput = screen.getByRole('textbox', { name: /Report Details/i });
    const submitButton = screen.getByRole('button', { name: /submit report/i });

    
    await act(async () => {
      fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
      fireEvent.change(detailsInput, { target: { value: 'Test Details' } });
    });

    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error submitting report:', 
        expect.any(Error)
      );
    });

    
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();

    
    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('requires subject and details', async () => {
    await renderComponent();

    const submitButton = screen.getByRole('button', { name: /submit report/i });
    const subjectInput = screen.getByRole('textbox', { name: /Subject/i });
    const detailsInput = screen.getByRole('textbox', { name: /Report Details/i });

    
    expect(subjectInput).toBeRequired();
    expect(detailsInput).toBeRequired();
  });
});