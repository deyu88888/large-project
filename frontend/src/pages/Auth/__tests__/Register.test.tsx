import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import RegisterPage from '../Register';
import { BrowserRouter } from 'react-router-dom';
import { apiClient, apiPaths } from '../../../api';

vi.setConfig({ testTimeout: 25000 });

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as object),
    useNavigate: () => mockedNavigate,
  };
});

vi.mock('../../../api', () => ({
  apiClient: {
    post: vi.fn(),
  },
  apiPaths: {
    USER: {
      REQUEST_OTP: '/api/user/request-otp',
      VERIFY_OTP: '/api/user/verify-otp',
      REGISTER: '/api/user/register',
    },
  },
}));

const testSteps = ["Register", "Verification", "Your Details"];

describe('RegisterPage Component', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const renderComponent = () => {
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime });
    const renderResult = render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    return { user, ...renderResult };
  };

  const fillFirstStepForm = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/First name/i), 'John');
    await user.type(screen.getByLabelText(/Last name/i), 'Doe');
    await user.type(screen.getByLabelText(/Email/i), 'john.doe@kcl.ac.uk');
  };

  const fillThirdStepForm = async (
    user: ReturnType<typeof userEvent.setup>,
    container: HTMLElement
  ) => {
    await user.type(screen.getByLabelText(/Username/i), 'johndoe123');
    const passwordInput = container.querySelector('input[name="password"]');
    const confirmPasswordInput = container.querySelector('input[name="confirm_password"]');
    expect(passwordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toBeInTheDocument();
    if (passwordInput) await user.type(passwordInput, 'Password123!');
    if (confirmPasswordInput) await user.type(confirmPasswordInput, 'Password123!');
    await user.type(screen.getByLabelText(/Major/i), 'Computer Science');
  };


  describe('Step 1: Initial Registration Form', () => {
    test('renders registration form with step 1 fields', () => {
      renderComponent();
      expect(screen.getByRole('heading', { name: /Register as a Student/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/First name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Get OTP/i })).toBeInTheDocument();
      expect(screen.getByText(/Already signed up?/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Please login/i })).toBeInTheDocument();
    });

    test('validates first name is required', async () => {
      const { user } = renderComponent();
      await user.click(screen.getByLabelText(/First name/i)); await user.tab();
      await screen.findByText(/First name is required/i);
    });

    test('validates last name is required', async () => {
      const { user } = renderComponent();
      await user.click(screen.getByLabelText(/Last name/i)); await user.tab();
      await screen.findByText(/Last name is required/i);
    });

    test('validates email format and button remains disabled', async () => {
        const { user } = renderComponent();
        const otpButton = screen.getByRole('button', { name: /Get OTP/i });
        await user.type(screen.getByLabelText(/Email/i), 'invalid-email');
        await user.tab();
        await screen.findByText(/Invalid email address/i);
        expect(otpButton).toBeDisabled();
    });

    test('validates email is a KCL email and button remains disabled', async () => {
        const { user } = renderComponent();
        const otpButton = screen.getByRole('button', { name: /Get OTP/i });
        await user.type(screen.getByLabelText(/Email/i), 'john.doe@gmail.com');
        await user.tab();
        await screen.findByText(/Email must end with @kcl.ac.uk/i);
        expect(otpButton).toBeDisabled();
    });

    test('Get OTP button is enabled when step 1 form is valid', async () => {
      const { user } = renderComponent();
      const otpButton = screen.getByRole('button', { name: /Get OTP/i });
      expect(otpButton).toBeDisabled();
      await fillFirstStepForm(user);
      await waitFor(() => { expect(otpButton).not.toBeDisabled(); });
    });
  });

  describe('OTP Request Functionality', () => {
    test('successfully requests OTP and moves to step 2', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { message: 'OTP sent' } });
      const { user } = renderComponent();
      await fillFirstStepForm(user);
      const otpButton = screen.getByRole('button', { name: /Get OTP/i });
      await waitFor(() => expect(otpButton).not.toBeDisabled());
      await user.click(otpButton);
      expect(apiClient.post).toHaveBeenCalledWith(apiPaths.USER.REQUEST_OTP, { email: 'john.doe@kcl.ac.uk' });
      const snackbar = await screen.findByRole('alert');
      expect(within(snackbar).getByText(/Check your email for a one-time password./i)).toBeInTheDocument();
      await screen.findByLabelText(/One-time Password/i);
    });

    test('shows error message inline and in snackbar when OTP request fails', async () => {
        const errorMsg = 'Email already registered.';
        vi.mocked(apiClient.post).mockRejectedValueOnce({ response: { data: { error: errorMsg } } });
        const { user } = renderComponent();
        await fillFirstStepForm(user);
        const otpButton = screen.getByRole('button', { name: /Get OTP/i });
        await waitFor(() => expect(otpButton).not.toBeDisabled());
        await user.click(otpButton);

        const snackbar = await screen.findByRole('alert');
        expect(within(snackbar).getByText(errorMsg)).toBeInTheDocument();

        const allInstances = await screen.findAllByText(errorMsg);
        const inlineErrorInstance = allInstances.find(el => el.closest('[role="alert"]') === null);
        expect(inlineErrorInstance).toBeInTheDocument();

        expect(screen.queryByLabelText(/One-time Password/i)).not.toBeInTheDocument();
    });

    test('shows generic error message in snackbar for network/unexpected failures', async () => {
        vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Network down'));
        const { user } = renderComponent();
        await fillFirstStepForm(user);
        const otpButton = screen.getByRole('button', { name: /Get OTP/i });
        await waitFor(() => expect(otpButton).not.toBeDisabled());
        await user.click(otpButton);
        const snackbar = await screen.findByRole('alert');
        expect(within(snackbar).getByText(/Error sending OTP. Please try again./i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/One-time Password/i)).not.toBeInTheDocument();
    });
  });

  describe('Step 2: OTP Verification', () => {
    const navigateToStep2 = async (user: ReturnType<typeof userEvent.setup>) => {
        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { message: 'OTP sent' } });
        await fillFirstStepForm(user);
        const otpButton = screen.getByRole('button', { name: /Get OTP/i });
        await waitFor(() => expect(otpButton).not.toBeDisabled());
        await user.click(otpButton);
        await screen.findByLabelText(/One-time Password/i);
        vi.mocked(apiClient.post).mockClear();
        try {
             const snackbar = await screen.findByRole('alert', {}, {timeout: 1000});
             await user.click(within(snackbar).getByRole('button', { name: /close/i }));
             await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
        } catch (e) {}
    };

    test('renders OTP verification form', async () => {
        const { user } = renderComponent();
        await navigateToStep2(user);
        expect(screen.getByLabelText(/One-time Password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Verify OTP/i })).toBeInTheDocument();
        expect(await screen.findByRole('button', { name: /Resend OTP \(\d+s\)/i })).toBeInTheDocument();
      });

      test('Resend OTP button shows timer and enables', async () => {
        const { user } = renderComponent();
        await navigateToStep2(user);
        const resendButtonInitial = await screen.findByRole('button', { name: /Resend OTP \(\d+s\)/i });
        expect(resendButtonInitial).toBeDisabled();
        vi.advanceTimersByTime(30000);
        expect(await screen.findByRole('button', { name: /Resend OTP \(30s\)/i })).toBeDisabled();
        vi.advanceTimersByTime(30000);
        const enabledResendButton = await screen.findByRole('button', { name: /^Resend OTP$/i });
        expect(enabledResendButton).not.toBeDisabled();
      });

      test('successfully resends OTP', async () => {
          const { user } = renderComponent();
          await navigateToStep2(user);
          vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { message: 'OTP resent' } });
          vi.advanceTimersByTime(60000);
          const resendButton = await screen.findByRole('button', { name: /^Resend OTP$/i });
          await user.click(resendButton);
          expect(apiClient.post).toHaveBeenCalledWith(apiPaths.USER.REQUEST_OTP, { email: 'john.doe@kcl.ac.uk' });
          const snackbar = await screen.findByRole('alert');
          expect(within(snackbar).getByText(/New OTP sent. Check your email./i)).toBeInTheDocument();
          await waitFor(async () => expect(await screen.findByRole('button', { name: /Resend OTP \(\d+s\)/i })).toBeDisabled());
      });

      test('successfully verifies OTP and moves to step 3', async () => {
        const { user, container } = renderComponent();
        await navigateToStep2(user);
        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { message: 'OTP verified' } });
        const otpInput = screen.getByLabelText(/One-time Password/i);
        const verifyButton = screen.getByRole('button', { name: /Verify OTP/i });
        await user.type(otpInput, '123456');
        await user.click(verifyButton);
        expect(apiClient.post).toHaveBeenCalledWith(apiPaths.USER.VERIFY_OTP, { email: 'john.doe@kcl.ac.uk', otp: '123456' });
        const snackbar = await screen.findByRole('alert');
        expect(within(snackbar).getByText(/OTP Verified!/i)).toBeInTheDocument();
        await screen.findByLabelText(/Username/i);
        expect(container.querySelector('input[name="password"]')).toBeInTheDocument();
      });

      test('shows error in snackbar for invalid OTP', async () => {
        const { user } = renderComponent();
        await navigateToStep2(user);
        const errorMsg = 'Invalid or expired OTP.';
        vi.mocked(apiClient.post).mockRejectedValueOnce({ response: { data: { error: errorMsg } } });
        const otpInput = screen.getByLabelText(/One-time Password/i);
        const verifyButton = screen.getByRole('button', { name: /Verify OTP/i });
        await user.type(otpInput, '000000');
        await user.click(verifyButton);

        const snackbar = await screen.findByRole('alert');
        expect(within(snackbar).getByText(errorMsg)).toBeInTheDocument();

        expect(screen.getByLabelText(/One-time Password/i)).toBeInTheDocument();
      });

      test('shows generic error in snackbar for unexpected OTP verification failure', async () => {
        const { user } = renderComponent();
        await navigateToStep2(user);
        vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Network down'));
        const otpInput = screen.getByLabelText(/One-time Password/i);
        const verifyButton = screen.getByRole('button', { name: /Verify OTP/i });
        await user.type(otpInput, '111111');
        await user.click(verifyButton);
        const snackbar = await screen.findByRole('alert');
        expect(within(snackbar).getByText(/Error verifying OTP. Please try again./i)).toBeInTheDocument();
        expect(screen.getByLabelText(/One-time Password/i)).toBeInTheDocument();
      });

  });

  describe('Step 3: User Details', () => {
    const navigateToStep3 = async (user: ReturnType<typeof userEvent.setup>) => {
        vi.mocked(apiClient.post)
            .mockResolvedValueOnce({ data: { message: 'OTP sent' } })
            .mockResolvedValueOnce({ data: { message: 'OTP verified' } });
        await fillFirstStepForm(user);
        const otpButton = screen.getByRole('button', { name: /Get OTP/i });
        await waitFor(() => expect(otpButton).not.toBeDisabled());
        await user.click(otpButton);
        await screen.findByLabelText(/One-time Password/i);
         try { await user.click(within(await screen.findByRole('alert', {}, {timeout: 1000})).getByRole('button', { name: /close/i })); await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument()); } catch (e) {}
        const otpInput = screen.getByLabelText(/One-time Password/i);
        const verifyButton = screen.getByRole('button', { name: /Verify OTP/i });
        await user.type(otpInput, '123456');
        await user.click(verifyButton);
         try { await user.click(within(await screen.findByRole('alert', {}, {timeout: 1000})).getByRole('button', { name: /close/i })); await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument()); } catch (e) {}
        await screen.findByLabelText(/Username/i);
        vi.mocked(apiClient.post).mockClear();
    };


    test('renders user details form', async () => {
      const { user, container } = renderComponent();
      await navigateToStep3(user);
      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
      expect(container.querySelector('input[name="password"]')).toBeInTheDocument();
      expect(container.querySelector('input[name="confirm_password"]')).toBeInTheDocument();
      expect(screen.getByLabelText(/Major/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
    });

    test('validates username fields', async () => {
        const { user } = renderComponent();
        await navigateToStep3(user);
        const usernameInput = screen.getByLabelText(/Username/i);
        const registerButton = screen.getByRole('button', { name: /Register/i });
        await user.click(usernameInput); await user.tab();
        await screen.findByText(/Username is required/i);
        expect(registerButton).toBeDisabled();
        await user.type(usernameInput, 'abc'); await user.tab();
        await screen.findByText(/Username must be at least 6 characters/i);
        expect(registerButton).toBeDisabled();
        await user.clear(usernameInput); await user.type(usernameInput, 'user name!'); await user.tab();
        await screen.findByText(/Username can only contain letters, numbers, and . - _/i);
        expect(registerButton).toBeDisabled();
        await user.clear(usernameInput); await user.type(usernameInput, 'valid_user.1'); await user.tab();
        expect(screen.queryByText(/Username is required/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Username must be at least 6 characters/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Username can only contain letters, numbers, and . - _/i)).not.toBeInTheDocument();
        expect(registerButton).toBeDisabled();
    });

    test('validates password fields', async () => {
        const { user, container } = renderComponent();
        await navigateToStep3(user);
        const passwordInput = container.querySelector('input[name="password"]');
        expect(passwordInput).toBeInTheDocument(); if (!passwordInput) return;
        const registerButton = screen.getByRole('button', { name: /Register/i });
        await user.click(passwordInput); await user.tab();
        await screen.findByText(/Password is required/i);
        expect(registerButton).toBeDisabled();
        await user.type(passwordInput, 'short'); await user.tab();
        await screen.findByText(/Password must be at least 8 characters/i);
        expect(registerButton).toBeDisabled();
        await user.clear(passwordInput); await user.type(passwordInput, 'ValidPass123!'); await user.tab();
        expect(screen.queryByText(/Password is required/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Password must be at least 8 characters/i)).not.toBeInTheDocument();
    });

    test('validates passwords match', async () => {
        const { user, container } = renderComponent();
        await navigateToStep3(user);
        const passwordInput = container.querySelector('input[name="password"]');
        const confirmPasswordInput = container.querySelector('input[name="confirm_password"]');
        expect(passwordInput).toBeInTheDocument(); if (!passwordInput) return;
        expect(confirmPasswordInput).toBeInTheDocument(); if (!confirmPasswordInput) return;
        const registerButton = screen.getByRole('button', { name: /Register/i });
        await user.type(passwordInput, 'Password123!');
        await user.type(confirmPasswordInput, 'PasswordDoesNotMatch');
        await user.tab();
        await screen.findByText(/Passwords do not match/i);
        expect(registerButton).toBeDisabled();
        await user.clear(confirmPasswordInput); await user.type(confirmPasswordInput, 'Password123!'); await user.tab();
        expect(screen.queryByText(/Passwords do not match/i)).not.toBeInTheDocument();
    });

     test('validates major is required', async () => {
        const { user } = renderComponent();
        await navigateToStep3(user);
        const majorInput = screen.getByLabelText(/Major/i);
        const registerButton = screen.getByRole('button', { name: /Register/i });
        await user.click(majorInput); await user.tab();
        await screen.findByText(/Major is required/i);
        expect(registerButton).toBeDisabled();
        await user.type(majorInput, 'History'); await user.tab();
        expect(screen.queryByText(/Major is required/i)).not.toBeInTheDocument();
     });

     test('register button enables when step 3 form is valid', async () => {
        const { user, container } = renderComponent();
        await navigateToStep3(user);
        const registerButton = screen.getByRole('button', { name: /Register/i });
        await fillThirdStepForm(user, container);
        await waitFor(() => {
            expect(registerButton).not.toBeDisabled();
        });
    });

    test('successfully registers user and navigates', async () => {
      const { user, container } = renderComponent();
      await navigateToStep3(user);
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { message: 'User registered' } });
      await fillThirdStepForm(user, container);
      const registerButton = screen.getByRole('button', { name: /Register/i });
      await waitFor(() => expect(registerButton).not.toBeDisabled());
      await user.click(registerButton);
      expect(apiClient.post).toHaveBeenCalledWith(apiPaths.USER.REGISTER, expect.objectContaining({
        email: 'john.doe@kcl.ac.uk', username: 'johndoe123', password: 'Password123!', major: 'Computer Science',
      }));
      await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith('/login', expect.anything()));
    });

    test('shows error inline and in snackbar for username taken', async () => {
        const { user, container } = renderComponent();
        await navigateToStep3(user);
        const errorMsg = 'Username already taken.';
        vi.mocked(apiClient.post).mockRejectedValueOnce({ response: { data: { username: [errorMsg] } } });
        await fillThirdStepForm(user, container);
        const registerButton = screen.getByRole('button', { name: /Register/i });
        await waitFor(() => expect(registerButton).not.toBeDisabled());
        await user.click(registerButton);

        const snackbar = await screen.findByRole('alert');
        expect(within(snackbar).getByText(errorMsg)).toBeInTheDocument();

        const allInstances = await screen.findAllByText(errorMsg);
        const inlineErrorInstance = allInstances.find(
            (el) => el.closest('[role="alert"]') === null
        );
        expect(inlineErrorInstance).toBeInTheDocument();

        expect(mockedNavigate).not.toHaveBeenCalled();
    });

     test('shows error in snackbar for email already registered', async () => {
        const { user, container } = renderComponent();
        await navigateToStep3(user);
        const errorMsg = 'This email is already registered.';
        vi.mocked(apiClient.post).mockRejectedValueOnce({ response: { data: { email: [errorMsg] } } });
        await fillThirdStepForm(user, container);
        const registerButton = screen.getByRole('button', { name: /Register/i });
        await waitFor(() => expect(registerButton).not.toBeDisabled());
        await user.click(registerButton);
        const snackbar = await screen.findByRole('alert');
        expect(within(snackbar).getByText(errorMsg)).toBeInTheDocument();
        expect(mockedNavigate).not.toHaveBeenCalled();
    });

    test('shows generic error in snackbar for other registration failures', async () => {
        const { user, container } = renderComponent();
        await navigateToStep3(user);
        vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Network Error'));
        await fillThirdStepForm(user, container);
        const registerButton = screen.getByRole('button', { name: /Register/i });
        await waitFor(() => expect(registerButton).not.toBeDisabled());
        await user.click(registerButton);
        const snackbar = await screen.findByRole('alert');
        expect(within(snackbar).getByText(/Could not connect to the server/i)).toBeInTheDocument();
        expect(mockedNavigate).not.toHaveBeenCalled();
    });
  });

  describe('General UI/UX Elements', () => {
     test('snackbar closes when close button is clicked', async () => {
        const errorMsg = 'Simulated API Error for Snackbar Test';
        vi.mocked(apiClient.post).mockRejectedValueOnce({ response: { data: { error: errorMsg } } });
        const { user } = renderComponent();
        await fillFirstStepForm(user);
        const otpButton = screen.getByRole('button', { name: /Get OTP/i });
        await waitFor(() => expect(otpButton).not.toBeDisabled());
        await user.click(otpButton);
        const snackbar = await screen.findByRole('alert');
        expect(within(snackbar).getByText(errorMsg)).toBeInTheDocument();
        const closeButton = within(snackbar).getByRole('button', { name: /close/i });
        await user.click(closeButton);
        await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
     });

     test('stepper shows the correct active step during progression', async () => {
        vi.mocked(apiClient.post)
            .mockResolvedValueOnce({ data: { message: 'OTP sent' } })
            .mockResolvedValueOnce({ data: { message: 'OTP verified' } });
        const { user, container } = renderComponent();
        const checkActiveStep = (activeIndex: number) => {
            const stepRoots = container.querySelectorAll('.MuiStep-root');
            expect(stepRoots.length).toBe(testSteps.length);
            stepRoots.forEach((stepRoot, index) => {
                const labelText = within(stepRoot).queryByText(new RegExp(`^${testSteps[index]}$`, 'i'));
                expect(labelText).toBeInTheDocument();
                const iconContainer = stepRoot.querySelector('.MuiStepLabel-iconContainer');
                expect(iconContainer).toBeInTheDocument();
                if (!iconContainer) return;
                if (index === activeIndex) {
                    expect(iconContainer).toHaveClass('Mui-active');
                    expect(iconContainer).not.toHaveClass('Mui-completed');
                } else {
                    expect(iconContainer).not.toHaveClass('Mui-active');
                    if (index < activeIndex) expect(iconContainer).toHaveClass('Mui-completed');
                    else expect(iconContainer).not.toHaveClass('Mui-completed');
                }
            });
        };

        checkActiveStep(0);
        await fillFirstStepForm(user);
        await user.click(screen.getByRole('button', { name: /Get OTP/i }));
        await screen.findByLabelText(/One-time Password/i);
        try { await user.click(within(await screen.findByRole('alert', {}, {timeout: 1000})).getByRole('button', { name: /close/i })); await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument()); } catch (e) {}
        await waitFor(() => checkActiveStep(1));

        await user.type(screen.getByLabelText(/One-time Password/i), '123456');
        await user.click(screen.getByRole('button', { name: /Verify OTP/i }));
        await screen.findByLabelText(/Username/i);
        try { await user.click(within(await screen.findByRole('alert', {}, {timeout: 1000})).getByRole('button', { name: /close/i })); await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument()); } catch (e) {}
        await waitFor(() => checkActiveStep(2));
    });
  });
});