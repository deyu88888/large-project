import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import ViewAdmin from '../ViewAdmin';
import { apiClient } from '../../../api';
import * as authStoreModule from '../../../stores/auth-store';

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
  apiPaths: {
    USER: {
      ADMINVIEW: (id: number) => `/api/admin/manage-admin/${id}`,
    },
  },
}));

vi.mock('../../../stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe('ViewAdmin Component', () => {
  const mockAdmin = {
    id: 1,
    username: 'admin.test',
    first_name: 'Admin',
    last_name: 'Test',
    email: 'admin@test.com',
    role: 'Admin',
    is_active: true,
    is_super_admin: false,
  };

  const navigateMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(authStoreModule.useAuthStore).mockReturnValue({
      user: { is_super_admin: true },
    });

    vi.mocked(apiClient.get).mockResolvedValue({
      data: mockAdmin,
    });

    vi.mocked(apiClient.patch).mockResolvedValue({
      data: {
        data: { ...mockAdmin, first_name: 'UpdatedName' },
      },
    });

    vi.mocked(useNavigate).mockReturnValue(navigateMock);

    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes('Warning: An update to ViewAdmin inside a test was not wrapped in act')) {
        return;
      }
      originalError(...args);
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading spinner initially', () => {
    render(
      <MemoryRouter initialEntries={['/admin/1']}>
        <Routes>
          <Route path="/admin/:admin_id" element={<ViewAdmin />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('loads and displays admin data', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/1']}>
        <Routes>
          <Route path="/admin/:admin_id" element={<ViewAdmin />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/manage-admin/1');
      expect(screen.getByText('Admin Details')).toBeInTheDocument();
      expect(screen.getByDisplayValue('admin.test')).toBeInTheDocument();
      const firstNameInput = screen.getByLabelText('First Name');
      expect(firstNameInput).toHaveValue('Admin');
      const lastNameInput = screen.getByLabelText('Last Name');
      expect(lastNameInput).toHaveValue('Test');
      expect(screen.getByDisplayValue('admin@test.com')).toBeInTheDocument();
    });
  });

  it('allows editing for super admin users', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/1']}>
        <Routes>
          <Route path="/admin/:admin_id" element={<ViewAdmin />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.queryByText('View mode: Only Super Admin users can edit admin details.')).not.toBeInTheDocument();
    });
  });

  it('displays view-only mode for non-super admin users', async () => {
    vi.mocked(authStoreModule.useAuthStore).mockReturnValue({
      user: { is_super_admin: false },
    });

    render(
      <MemoryRouter initialEntries={['/admin/1']}>
        <Routes>
          <Route path="/admin/:admin_id" element={<ViewAdmin />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
      expect(screen.getByText('View mode: Only Super Admin users can edit admin details.')).toBeInTheDocument();
    });
  });

  it('handles form submission correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/1']}>
        <Routes>
          <Route path="/admin/:admin_id" element={<ViewAdmin />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Save Changes')).toBeInTheDocument());

    const firstNameInput = screen.getByLabelText('First Name');
    fireEvent.change(firstNameInput, { target: { value: 'UpdatedName' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/admin/manage-admin/1',
        expect.objectContaining({
          first_name: 'UpdatedName',
        })
      );

      const alertElement = screen.getByRole('alert');
      expect(alertElement).toBeInTheDocument();
      expect(alertElement.textContent).toContain('Admin updated successfully!');
    }, { timeout: 2000 });
  });

  it('handles switch toggle correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/1']}>
        <Routes>
          <Route path="/admin/:admin_id" element={<ViewAdmin />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Save Changes')).toBeInTheDocument());

    const isSuperAdminSwitch = screen.getByLabelText('Super Admin');
    fireEvent.click(isSuperAdminSwitch);

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/admin/manage-admin/1',
        expect.objectContaining({
          is_super_admin: true,
        })
      );
    });
  });

  it('handles API errors during load', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter initialEntries={['/admin/1']}>
        <Routes>
          <Route path="/admin/:admin_id" element={<ViewAdmin />} />
        </Routes>
      </MemoryRouter>
    );
  });

  it('handles API errors during update', async () => {
    vi.mocked(apiClient.patch).mockRejectedValue(new Error('Update failed'));

    render(
      <MemoryRouter initialEntries={['/admin/1']}>
        <Routes>
          <Route path="/admin/:admin_id" element={<ViewAdmin />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Save Changes')).toBeInTheDocument());

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      const alertElement = screen.getByRole('alert');
      expect(alertElement).toBeInTheDocument();
      expect(alertElement.textContent).toContain('Failed to update admin details');
    }, { timeout: 2000 });
  });

  it('navigates back when back button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/1']}>
        <Routes>
          <Route path="/admin/:admin_id" element={<ViewAdmin />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const backButton = screen.getByText('← Back');
      fireEvent.click(backButton);
      expect(navigateMock).toHaveBeenCalledWith(-1);
    });
  });
});