import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';
import Support from '../Support';
import { apiClient } from '../../../api';
import { faqSections } from '../../../constants/faqSections';

// Mock the dependencies
vi.mock('../../../api', () => ({
  apiClient: {
    post: vi.fn(),
  }
}));

vi.mock('../../../constants/faqSections', () => ({
  faqSections: [
    {
      title: 'General Questions',
      questions: [
        {
          question: 'What is this platform?',
          answer: 'This is a test platform.',
        },
        {
          question: 'How do I get started?',
          answer: 'You can get started by creating an account.',
        }
      ]
    },
    {
      title: 'Technical Questions',
      questions: [
        {
          question: 'Is there an API available?',
          answer: 'Yes, we offer a RESTful API for developers.',
        }
      ]
    }
  ]
}));

// Mock theme functionality
vi.mock('../../theme/theme', () => ({
  tokens: () => ({
    grey: {
      100: '#e0e0e0',
      200: '#c2c2c2',
      300: '#a3a3a3',
      700: '#424242',
      800: '#303030',
    },
    primary: {
      400: '#f5f5f5',
      600: '#757575',
      700: '#616161',
      900: '#212121',
    },
    blueAccent: {
      300: '#64b5f6',
      400: '#42a5f5',
    },
    greenAccent: {
      300: '#81c784',
      400: '#66bb6a',
      500: '#4caf50',
      600: '#43a047',
    }
  })
}));

// Setup mock console.error to suppress expected MUI warnings
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  vi.clearAllMocks();
});

// Create a mock theme for test rendering
const mockTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

// Helper function to render component consistently
const renderSupport = () => {
  return render(
    <ThemeProvider theme={mockTheme}>
      <Support />
    </ThemeProvider>
  );
};

describe('Support Component', () => {
  it('renders the component with correct headings', () => {
    renderSupport();
    expect(screen.getByText('Support Centre')).toBeInTheDocument();
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    expect(screen.getByText('Report an Issue')).toBeInTheDocument();
    expect(screen.getByText('Email Support Directly')).toBeInTheDocument();
  });

  it('renders all FAQ sections and questions', () => {
    renderSupport();
    
    // Check section titles
    expect(screen.getByText('General Questions')).toBeInTheDocument();
    expect(screen.getByText('Technical Questions')).toBeInTheDocument();
    
    // Check questions
    expect(screen.getByText('What is this platform?')).toBeInTheDocument();
    expect(screen.getByText('How do I get started?')).toBeInTheDocument();
    expect(screen.getByText('Is there an API available?')).toBeInTheDocument();
  });

  it('expands an accordion when clicked and collapses when clicked again', async () => {
    renderSupport();
    
    // Get the first accordion
    const accordion = screen.getByText('What is this platform?');
    
    // Initially, the answer should not be visible
    expect(screen.queryByText('This is a test platform.')).not.toBeVisible();
    
    // Click to expand
    await userEvent.click(accordion);
    
    // After clicking, the answer should be visible
    expect(screen.getByText('This is a test platform.')).toBeVisible();
    
    // Click again to collapse
    await userEvent.click(accordion);
    
    // After clicking again, the answer should not be visible
    await waitFor(() => {
      expect(screen.queryByText('This is a test platform.')).not.toBeVisible();
    });
  });

  it('renders the support form with all required fields', () => {
    renderSupport();
    
    // Check form elements exist
    expect(screen.getByLabelText(/Report Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Describe your issue here./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Report/i })).toBeInTheDocument();
  });

  it('allows interaction with form fields', async () => {
    renderSupport();
    
    // Get form elements
    const reportTypeField = screen.getByLabelText(/Report Type/i);
    const emailField = screen.getByLabelText(/Your Email/i);
    const subjectField = screen.getByLabelText(/Subject/i);
    const messageField = screen.getByLabelText(/Describe your issue here./i);
    
    // Open the select dropdown and choose an option
    await userEvent.click(reportTypeField);
    await userEvent.click(screen.getByRole('option', { name: 'Feedback' }));
    
    // Fill in text fields
    await userEvent.type(emailField, 'test@example.com');
    await userEvent.type(subjectField, 'Test Subject');
    await userEvent.type(messageField, 'This is a test message');
    
    // Verify field values
    expect(screen.getByDisplayValue('Feedback')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Subject')).toBeInTheDocument();
    expect(screen.getByDisplayValue('This is a test message')).toBeInTheDocument();
  });

  it('submits the form successfully', async () => {
    // Mock successful API response
    vi.mocked(apiClient.post).mockResolvedValueOnce({});
    
    renderSupport();
    
    // Fill form
    await userEvent.click(screen.getByLabelText(/Report Type/i));
    await userEvent.click(screen.getByRole('option', { name: 'Query' }));
    await userEvent.type(screen.getByLabelText(/Your Email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Subject/i), 'Test Subject');
    await userEvent.type(screen.getByLabelText(/Describe your issue here./i), 'Test message');
    
    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /Submit Report/i }));
    
    // Verify API call
    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(apiClient.post).toHaveBeenCalledWith('/api/dashboard/public-report', {
      report_type: 'Query',
      email: 'test@example.com',
      subject: 'Test Subject',
      details: 'Test message'
    });
    
    // Verify success message appears
    await waitFor(() => {
      expect(screen.getByText("Your report has been submitted successfully. We'll get back to you soon.")).toBeInTheDocument();
    });
    
    // Verify form was cleared
    await waitFor(() => {
      expect(screen.queryByDisplayValue('test@example.com')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('Test Subject')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('Test message')).not.toBeInTheDocument();
    });
  });

  it('handles form submission error', async () => {
    // Mock API error
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('API error'));
    
    renderSupport();
    
    // Fill form
    await userEvent.click(screen.getByLabelText(/Report Type/i));
    await userEvent.click(screen.getByRole('option', { name: 'Feedback' }));
    await userEvent.type(screen.getByLabelText(/Your Email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Subject/i), 'Test Subject');
    await userEvent.type(screen.getByLabelText(/Describe your issue here./i), 'Test message');
    
    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /Submit Report/i }));
    
    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByText('There was an error submitting your report. Please try again later.')).toBeInTheDocument();
    });
    
    // Verify form data is still present
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Subject')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test message')).toBeInTheDocument();
  });

  it('disables form fields during submission', async () => {
    // Mock delayed API response
    vi.mocked(apiClient.post).mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve({}), 100);
    }));
    
    renderSupport();
    
    // Fill and submit form
    await userEvent.click(screen.getByLabelText(/Report Type/i));
    await userEvent.click(screen.getByRole('option', { name: 'Query' }));
    await userEvent.type(screen.getByLabelText(/Your Email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Subject/i), 'Test Subject');
    await userEvent.type(screen.getByLabelText(/Describe your issue here./i), 'Test message');
    
    await userEvent.click(screen.getByRole('button', { name: /Submit Report/i }));
    
    // Verify button shows loading state
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    
    // Verify form fields are disabled - use different approach for Select component
    // For the Select component, we need to check if it has the Mui-disabled class
    const reportTypeSelect = screen.getByLabelText(/Report Type/i).closest('.MuiInputBase-root');
    expect(reportTypeSelect).toHaveClass('Mui-disabled');
    
    // For text fields
    expect(screen.getByLabelText(/Your Email/i)).toBeDisabled();
    expect(screen.getByLabelText(/Subject/i)).toBeDisabled();
    expect(screen.getByLabelText(/Describe your issue here./i)).toBeDisabled();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.queryByText('Submitting...')).not.toBeInTheDocument();
    });
  });

  it('closes snackbar when alert close button is clicked', async () => {
    // Mock successful API response
    vi.mocked(apiClient.post).mockResolvedValueOnce({});
    
    renderSupport();
    
    // Fill and submit form
    await userEvent.click(screen.getByLabelText(/Report Type/i));
    await userEvent.click(screen.getByRole('option', { name: 'Query' }));
    await userEvent.type(screen.getByLabelText(/Your Email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Subject/i), 'Test Subject');
    await userEvent.type(screen.getByLabelText(/Describe your issue here./i), 'Test message');
    
    await userEvent.click(screen.getByRole('button', { name: /Submit Report/i }));
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText("Your report has been submitted successfully. We'll get back to you soon.")).toBeInTheDocument();
    });
    
    // Close the snackbar
    await userEvent.click(screen.getByRole('button', { name: /Close/i }));
    
    // Verify snackbar is closed
    await waitFor(() => {
      expect(screen.queryByText("Your report has been submitted successfully. We'll get back to you soon.")).not.toBeInTheDocument();
    });
  });

  it('renders the email support section with correct email', () => {
    renderSupport();
    
    // Check email link exists
    const emailLink = screen.getByText('infiniteloop@gmail.com');
    expect(emailLink).toBeInTheDocument();
    expect(emailLink.getAttribute('href')).toBe('mailto:infiniteloop@gmail.com');
  });

  it('checks that all report type options are available', async () => {
    renderSupport();
    
    // Open dropdown
    await userEvent.click(screen.getByLabelText(/Report Type/i));
    
    // Verify all options are present
    expect(screen.getByRole('option', { name: 'Query' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Feedback' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Misconduct' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'System Issue' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Inappropriate Content' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Other' })).toBeInTheDocument();
  });
});