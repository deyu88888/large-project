import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StartSociety from '../StartSociety';
import { useAuthStore } from '../../../stores/auth-store';

// Mock the auth store
vi.mock('../../../stores/auth-store', () => ({
  useAuthStore: vi.fn()
}));

// Mock the API client
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

// Import after mocking
import { apiClient } from '../../../api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Set up mock data
const mockUserStatus = {
  hasPendingRequest: false,
  pendingRequestName: null,
  isPresident: false,
  hasRejectedRequest: false,
  rejectedRequestName: null,
  rejectionReason: null
};

const mockUser = { id: 1, name: 'Test User' };

describe('StartSociety Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default mock responses
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });
    
    vi.mocked(apiClient.get).mockResolvedValue({
      data: mockUserStatus,
      status: 200
    });
    
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { success: true },
      status: 201
    });
  });

  const renderComponent = (theme = 'light') => {
    const customTheme = createTheme({
      palette: {
        mode: theme === 'light' ? 'light' : 'dark',
      },
    });

    return render(
      <ThemeProvider theme={customTheme}>
        <MemoryRouter>
          <StartSociety />
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('renders the form correctly', async () => {
    renderComponent();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
    
    expect(screen.getByText(/Start a Society/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Society Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Society Category/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Request/i })).toBeInTheDocument();
  });

  it('shows an error when form is submitted with empty fields', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: /Submit Request/i }));
    
    expect(screen.getByText(/Please fill out all fields./i)).toBeInTheDocument();
  });

  it('submits the form successfully when all fields are filled', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Society Name/i), { 
      target: { value: 'New Test Society' } 
    });
    
    fireEvent.change(screen.getByLabelText(/Description/i), { 
      target: { value: 'This is a test society description' } 
    });
    
    // Select a category
    fireEvent.change(screen.getByLabelText(/Society Category/i), {
      target: { value: 'academic' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Submit Request/i }));
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/society/start", 
        {
          name: "New Test Society",
          description: "This is a test society description",
          category: "academic",
          requested_by: 1,
        }
      );
    });
    
    expect(screen.getByText(/Society creation request submitted successfully!/i)).toBeInTheDocument();
  });

  it('shows an error message when submission fails', async () => {
    // Mock API error
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Failed to create society'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Society Name/i), { 
      target: { value: 'New Test Society' } 
    });
    
    fireEvent.change(screen.getByLabelText(/Description/i), { 
      target: { value: 'This is a test society description' } 
    });
    
    // Select a category
    fireEvent.change(screen.getByLabelText(/Society Category/i), {
      target: { value: 'academic' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Submit Request/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to create society./i)).toBeInTheDocument();
    });
  });

  it('renders pending request notice when user has a pending society request', async () => {
    // Mock user with pending request
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        ...mockUserStatus,
        hasPendingRequest: true,
        pendingRequestName: 'Pending Society'
      },
      status: 200
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
    
    expect(screen.getByText(/You already have a pending society creation request for "Pending Society"/i)).toBeInTheDocument();
    
    // The submit button should be disabled
    expect(screen.getByRole('button', { name: /Submit Request/i })).toBeDisabled();
  });

  it('renders the president view when user is already a society president', async () => {
    // Mock user as president
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        ...mockUserStatus,
        isPresident: true
      },
      status: 200
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
    
    expect(screen.getByText(/You're already a society president!/i)).toBeInTheDocument();
    expect(screen.getByText(/As an existing society president, you cannot create additional societies./i)).toBeInTheDocument();
    
    // Form should not be rendered
    expect(screen.queryByLabelText(/Society Name/i)).not.toBeInTheDocument();
  });

  it('displays rejection notice when user has a rejected request', async () => {
    // Mock user with rejected request
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        ...mockUserStatus,
        hasRejectedRequest: true,
        rejectedRequestName: 'Rejected Society',
        rejectionReason: 'Name too similar to existing society'
      },
      status: 200
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
    
    expect(screen.getByText(/Your Society Request Was Rejected/i)).toBeInTheDocument();
    expect(screen.getByText(/Your request for "Rejected Society" was not approved./i)).toBeInTheDocument();
    expect(screen.getByText(/Name too similar to existing society/i)).toBeInTheDocument();
  });

  it('allows dismissing the rejection notice', async () => {
    // Mock user with rejected request
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        ...mockUserStatus,
        hasRejectedRequest: true,
        rejectedRequestName: 'Rejected Society',
        rejectionReason: 'Name too similar to existing society'
      },
      status: 200
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
    
    expect(screen.getByText(/Your Society Request Was Rejected/i)).toBeInTheDocument();
    
    // Click the close button (✕)
    fireEvent.click(screen.getByText('✕'));
    
    // Rejection notice should be gone
    expect(screen.queryByText(/Your Society Request Was Rejected/i)).not.toBeInTheDocument();
  });

  it('checks user status when mounted', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/society/user-status/');
    });
  });

  it('shows error when API call to check user status fails', async () => {
    // Mock API error for status check
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Failed to check user status'));
    
    // Spy on console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to check your society request status./i)).toBeInTheDocument();
    });
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('shows pending request modal when trying to submit with a pending request', async () => {
    // First API call returns no pending request
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: mockUserStatus,
      status: 200
    });
    
    // Second API call (after form submit) returns pending request
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        ...mockUserStatus,
        hasPendingRequest: true,
        pendingRequestName: 'Newly Pending Society'
      },
      status: 200
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Society Name/i), { 
      target: { value: 'New Test Society' } 
    });
    
    fireEvent.change(screen.getByLabelText(/Description/i), { 
      target: { value: 'This is a test society description' } 
    });
    
    // Select a category
    fireEvent.change(screen.getByLabelText(/Society Category/i), {
      target: { value: 'academic' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Submit Request/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Request Already Pending/i)).toBeInTheDocument();
    });
    
    // Modal should show the pending request name
    expect(screen.getByText(/You already have a pending request for "Newly Pending Society"/i)).toBeInTheDocument();
    
    // Close the modal
    fireEvent.click(screen.getByText(/I Understand/i));
    
    // Modal should be closed
    expect(screen.queryByText(/Request Already Pending/i)).not.toBeInTheDocument();
  });

  it('renders correctly in dark mode', async () => {
    renderComponent('dark');
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
    
    expect(screen.getByText(/Start a Society/i)).toBeInTheDocument();
  });
});