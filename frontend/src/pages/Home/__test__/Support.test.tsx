import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Support from '../Support';
import { apiClient } from '../../../api';
import { faqSections } from '../../../constants/faqSections';

vi.mock('../../../api', () => ({
  apiClient: {
    post: vi.fn()
  }
}));

const mockTheme = { palette: { mode: 'light' } };
const mockColors = {
  grey: { '100': '#f0f0f0', '200': '#d0d0d0', '300': '#b0b0b0', '700': '#404040', '800': '#303030' },
  primary: { '400': '#ffffff', '600': '#303030', '700': '#202020', '900': '#fafafa' },
  blueAccent: { '400': '#007bff' },
  greenAccent: { '300': '#6fbf73', '400': '#4caf50', '500': '#388e3c', '600': '#2e7d32' }
};

vi.mock('@mui/material/useTheme', () => ({
  default: () => mockTheme
}));

vi.mock('../../../theme/theme', () => ({
    tokens: () => mockColors
}));

describe('Support Page', () => {
  const renderComponent = () => {
    return render(
      <ThemeProvider theme={createTheme(mockTheme)}>
        <Support />
      </ThemeProvider>
    );
  };

  const user = userEvent.setup();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders page title and description', () => {
    renderComponent();
    expect(screen.getByText('Support Centre')).toBeInTheDocument();
    expect(screen.getByText(/Find answers to frequently asked questions/i)).toBeInTheDocument();
  });

  it('renders FAQ sections and questions', () => {
    renderComponent();
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    faqSections.forEach(section => {
        expect(screen.getByText(section.title)).toBeInTheDocument();
        section.questions.forEach(faq => {
            expect(screen.getByText(faq.question)).toBeInTheDocument();
        });
    });
  });

  it('expands and collapses FAQ accordion', async () => {
    renderComponent();
    const firstQuestionText = faqSections[0].questions[0].question;
    const firstAnswerText = faqSections[0].questions[0].answer;

    const firstAccordionHeader = screen.getByRole('button', { name: firstQuestionText });
    const accordionContent = screen.getByText(firstAnswerText);

    expect(accordionContent).not.toBeVisible();

    await user.click(firstAccordionHeader);
    expect(accordionContent).toBeVisible();

    await user.click(firstAccordionHeader);
    await waitFor(() => {
        expect(accordionContent).not.toBeVisible();
    });
  });

  it('renders support form', () => {
    renderComponent();
    expect(screen.getByText('Report an Issue')).toBeInTheDocument();
    expect(screen.getByLabelText(/report type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/describe your issue here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit report/i })).toBeInTheDocument();
  });

  it('submits support form successfully', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
    renderComponent();

    const reportTypeSelect = screen.getByRole('combobox', { name: /report type/i });
    const emailInput = screen.getByLabelText(/your email/i);
    const subjectInput = screen.getByLabelText(/subject/i);
    const messageInput = screen.getByLabelText(/describe your issue here/i);
    const submitButton = screen.getByRole('button', { name: /submit report/i });

    await user.click(reportTypeSelect);
    const queryOption = await screen.findByRole('option', { name: /query/i });
    await user.click(queryOption);

    await user.type(emailInput, 'test@example.com');
    await user.type(subjectInput, 'Test Subject');
    await user.type(messageInput, 'Test message details');
    await user.click(submitButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/dashboard/public-report', {
        report_type: 'Query',
        email: 'test@example.com',
        subject: 'Test Subject',
        details: 'Test message details'
      });
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(/Your report has been submitted successfully/i);

    expect(emailInput).toHaveValue('');
    expect(subjectInput).toHaveValue('');
    expect(messageInput).toHaveValue('');
  });

  it('handles form submission error', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Submission failed'));
    renderComponent();

    const reportTypeSelect = screen.getByRole('combobox', { name: /report type/i });
    const emailInput = screen.getByLabelText(/your email/i);
    const subjectInput = screen.getByLabelText(/subject/i);
    const messageInput = screen.getByLabelText(/describe your issue here/i);
    const submitButton = screen.getByRole('button', { name: /submit report/i });

    await user.click(reportTypeSelect);
    const systemIssueOption = await screen.findByRole('option', { name: /system issue/i });
    await user.click(systemIssueOption);

    await user.type(emailInput, 'test@example.com');
    await user.type(subjectInput, 'Error Subject');
    await user.type(messageInput, 'Error message details');
    await user.click(submitButton);

    await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(/There was an error submitting your report/i);
  });

  it('disables form during submission and shows submitting text', async () => {
    vi.mocked(apiClient.post).mockImplementation(() => new Promise(() => {}));
    renderComponent();

    const reportTypeSelect = screen.getByRole('combobox', { name: /report type/i });
    const emailInput = screen.getByLabelText(/your email/i);
    const subjectInput = screen.getByLabelText(/subject/i);
    const messageInput = screen.getByLabelText(/describe your issue here/i);
    const submitButton = screen.getByRole('button', { name: /submit report/i });

    await user.click(reportTypeSelect);
    const feedbackOption = await screen.findByRole('option', { name: /feedback/i });
    await user.click(feedbackOption);

    await user.type(emailInput, 'test@example.com');
    await user.type(subjectInput, 'Submitting Subject');
    await user.type(messageInput, 'Submitting details');
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
    expect(screen.getByRole('button', { name: /submitting.../i})).toBeInTheDocument();

    expect(emailInput).toBeDisabled();
    expect(subjectInput).toBeDisabled();
    expect(messageInput).toBeDisabled();
    expect(reportTypeSelect).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders email support section', () => {
    renderComponent();
    expect(screen.getByText('Email Support Directly')).toBeInTheDocument();
    const emailLink = screen.getByText('infiniteloop@gmail.com');
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', 'mailto:infiniteloop@gmail.com');
  });
});