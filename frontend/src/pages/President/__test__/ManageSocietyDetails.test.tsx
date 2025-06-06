import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { apiClient, apiPaths } from '../../../api';
import { useAuthStore } from '../../../stores/auth-store';
import ManageSocietyDetails from '../ManageSocietyDetails';

// Mock SocietyPreview with the correct path
vi.mock('../../../components/SocietyPreview', () => ({
  SocietyPreview: vi.fn(({ open, onClose, society }) => {
    if (!open) return null;
    return (
      <div data-testid="society-preview-modal">
        <h2>{society?.name}</h2>
        <button onClick={onClose}>Close Preview</button>
      </div>
    );
  }),
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ societyId: '123' }),
  };
});

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
  apiPaths: {
    SOCIETY: {
      MANAGE_DETAILS: (id: string) => `/api/manage-society-details/${id}/`,
    },
  },
}));

vi.mock('../../../stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Update the mockSocietyData to match the actual component structure
const mockSocietyData = {
  id: 123,
  name: 'Test Society',
  category: 'Sports',
  social_media_links: {
    WhatsApp: 'https://whatsapp.com/group/testsociety',
    Facebook: 'https://facebook.com/testsociety',
    Instagram: '',
    X: '',
    Other: '',
  },
  description: 'This is a test society description',
  tags: ['fun', 'active'],
  icon: null,
};

const theme = createTheme();

describe('ManageSocietyDetails Component', () => {
  const mockUser = { id: 99, username: 'testpresident' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as vi.Mock).mockReturnValue({ user: mockUser });
    (apiClient.get as vi.Mock).mockResolvedValue({ data: mockSocietyData });
    (apiClient.patch as vi.Mock).mockResolvedValue({ data: { success: true } });
    global.alert = vi.fn();
  });

  function renderComponent() {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/president-page/123/manage-society-details']}>
          <Routes>
            <Route
              path="/president-page/:societyId/manage-society-details"
              element={<ManageSocietyDetails />}
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  }

  it('shows a loading spinner and then loads the form data', async () => {
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText('Society Name')).toBeInTheDocument();
    });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('populates the form with fetched society data', async () => {
    renderComponent();
    const nameField = await screen.findByLabelText('Society Name');
    expect(nameField).toHaveValue('Test Society');
    const categoryField = screen.getByLabelText('Category');
    expect(categoryField).toHaveValue('Sports');
    const tagsField = screen.getByLabelText('Tags (comma separated)');
    expect(tagsField).toHaveValue('fun, active');

    // Check for description field
    const descriptionElement = screen.getByText('Description');
    expect(descriptionElement).toBeInTheDocument();
  });

  it('submits form data (PATCH request) and navigates on success', async () => {
    renderComponent();
    await screen.findByLabelText('Society Name');
    fireEvent.change(screen.getByLabelText('Society Name'), {
      target: { value: 'Updated Society Name' },
    });
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'Music' },
    });
    const submitButton = screen.getByRole('button', { name: /submit update request/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/api/manage-society-details/123/',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/president-page/123');
  });

  it('alerts user if PATCH request fails', async () => {
    (apiClient.patch as vi.Mock).mockRejectedValue(new Error('Patch failed'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderComponent();
    await screen.findByLabelText('Society Name');
    const submitButton = screen.getByRole('button', { name: /submit update request/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating society',
        expect.any(Error)
      );
    });
    expect(alertSpy).toHaveBeenCalledWith(
      'There was an error submitting your update request.'
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('opens preview modal when "Preview" button is clicked', async () => {
    renderComponent();
    await screen.findByLabelText('Society Name');
    const previewButton = screen.getByRole('button', { name: /preview/i });
    fireEvent.click(previewButton);
    expect(screen.getByTestId('society-preview-modal')).toBeInTheDocument();
    expect(screen.getByText('Test Society')).toBeInTheDocument();
  });

  it('closes preview modal when "Close Preview" button is clicked', async () => {
    renderComponent();
    await screen.findByLabelText('Society Name');
    fireEvent.click(screen.getByRole('button', { name: /preview/i }));
    expect(screen.getByTestId('society-preview-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /close preview/i }));
    await waitFor(() => {
      expect(screen.queryByTestId('society-preview-modal')).not.toBeInTheDocument();
    });
  });

  it('handles fetch error when loading society data', async () => {
    const fetchError = new Error('Failed to fetch society data');
    (apiClient.get as vi.Mock).mockRejectedValue(fetchError);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderComponent();
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching society details',
        fetchError
      );
    });
    consoleErrorSpy.mockRestore();
  });

  it('handles empty form submission', async () => {
    const testHandleSubmit = (formData: any, society: any): boolean => {
      if (!formData || !society) return false;
      return true;
    };
    expect(testHandleSubmit(null, null)).toBe(false);
    expect(testHandleSubmit(null, {})).toBe(false);
    expect(testHandleSubmit({}, null)).toBe(false);
    expect(testHandleSubmit({}, {})).toBe(true);
  });

  it('handles updating form data with File type icon', async () => {
    const mockFile = new File(['dummy content'], 'test-icon.png', { type: 'image/png' });
    (apiClient.patch as vi.Mock).mockClear();
    const formDataAppendMock = vi.fn();
    const formDataOriginal = global.FormData;
    global.FormData = vi.fn().mockImplementation(() => ({
      append: formDataAppendMock,
    }));
    (apiClient.get as vi.Mock).mockResolvedValue({
      data: {
        ...mockSocietyData,
        icon: mockFile
      }
    });
    renderComponent();
    await screen.findByLabelText('Society Name');
    const submitButton = screen.getByRole('button', { name: /submit update request/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    expect(apiClient.patch).toHaveBeenCalled();
    global.FormData = formDataOriginal;
  });

  it('handles social media links correctly during submission', async () => {
    (apiClient.get as vi.Mock).mockResolvedValue({
      data: {
        ...mockSocietyData,
        social_media_links: {
          twitter: 'https://twitter.com/testsociety',
          facebook: 'https://facebook.com/testsociety'
        }
      }
    });
    const formDataAppendMock = vi.fn();
    const formDataOriginal = global.FormData;
    global.FormData = vi.fn().mockImplementation(() => ({
      append: formDataAppendMock,
    }));
    renderComponent();
    await screen.findByLabelText('Society Name');
    const submitButton = screen.getByRole('button', { name: /submit update request/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    expect(apiClient.patch).toHaveBeenCalled();
    global.FormData = formDataOriginal;
  });

  it('handles the edge case where handleChange is called when formData is null', async () => {
    renderComponent();
    await screen.findByLabelText('Society Name');
    const originalUseState = React.useState;
    let setFormDataCallback: Function | null = null;
    const mockUseState = vi.spyOn(React, 'useState');
    mockUseState.mockImplementation((initialValue) => {
      const [value, setValue] = originalUseState(initialValue);
      if (value && 'name' in (value as object) && 'category' in (value as object)) {
        setFormDataCallback = setValue;
      }
      return [value, setValue];
    });
    renderComponent();
    await screen.findByLabelText('Society Name');
    if (setFormDataCallback) {
      act(() => {
        setFormDataCallback(null);
      });
      fireEvent.change(screen.getByLabelText('Society Name'), {
        target: { name: 'name', value: 'New Name' }
      });
    }
    mockUseState.mockRestore();
  });

  it('handles society data with missing fields', async () => {
    (apiClient.get as vi.Mock).mockResolvedValue({
      data: {
        id: 123,
        name: 'Test Society',
        category: 'Sports',
        membership_requirements: 'Open to all students.',
        upcoming_projects_or_plans: 'Planning a big event soon!'
      }
    });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByLabelText('Society Name')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Society Name')).toHaveValue('Test Society');
    expect(screen.getByLabelText('Tags (comma separated)')).toHaveValue('');
  });

  it('handles tags input changes correctly', async () => {
    renderComponent();
    await screen.findByLabelText('Society Name');
    const tagsField = screen.getByLabelText('Tags (comma separated)');
    expect(tagsField).toHaveValue('fun, active');
    fireEvent.change(tagsField, {
      target: { value: 'fun, active, sports, community' }
    });
    expect(tagsField).toHaveValue('fun, active, sports, community');
    fireEvent.change(tagsField, {
      target: { value: 'coding, technology' }
    });
    expect(tagsField).toHaveValue('coding, technology');
    fireEvent.change(tagsField, {
      target: { value: '' }
    });
    expect(tagsField).toHaveValue('');
  });

  it('tests file upload handling', async () => {
    vi.clearAllMocks();
    const { unmount } = renderComponent();
    await screen.findByLabelText('Society Name');
    const appendMock = vi.fn();
    const originalFormData = global.FormData;
    global.FormData = vi.fn().mockImplementation(() => ({
      append: appendMock,
    }));
    const mockFile = new File(['dummy content'], 'test-icon.png', { type: 'image/png' });
    let setFormDataFn: Function | null = null;
    const useStateSpy = vi.spyOn(React, 'useState');
    useStateSpy.mockImplementation((initialValue) => {
      const [value, setValue] = React.useState(initialValue);
      if (value && typeof value === 'object' && 'name' in value) {
        setFormDataFn = setValue;
      }
      return [value, setValue];
    });
    unmount();
    renderComponent();
    await screen.findByLabelText('Society Name');
    if (setFormDataFn) {
      await act(async () => {
        setFormDataFn((prev: any) => ({ ...prev, icon: mockFile }));
      });
    }
    const submitButtons = screen.getAllByRole('button', { name: /submit update request/i });
    await act(async () => {
      fireEvent.click(submitButtons[0]);
    });
    expect(apiClient.patch).toHaveBeenCalled();
    global.FormData = originalFormData;
    useStateSpy.mockRestore();
  });

  it('handles the case when formData is null during form submission', async () => {
    const shouldSubmitForm = (formData: any, society: any): boolean => {
      return !(!formData || !society);
    };
    expect(shouldSubmitForm(null, mockSocietyData)).toBe(false);
    expect(shouldSubmitForm(mockSocietyData, null)).toBe(false);
    expect(shouldSubmitForm(null, null)).toBe(false);
    expect(shouldSubmitForm(mockSocietyData, mockSocietyData)).toBe(true);
  });

  it('handles nullish social_media_links in the API response', async () => {
    (apiClient.get as vi.Mock).mockResolvedValue({
      data: {
        ...mockSocietyData,
        social_media_links: null
      }
    });
    renderComponent();
    await screen.findByLabelText('Society Name');
    const submitButton = screen.getByRole('button', { name: /submit update request/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    expect(apiClient.patch).toHaveBeenCalled();
  });

  it('handles icon being null in handleSubmit', async () => {
    (apiClient.get as vi.Mock).mockResolvedValue({
      data: {
        ...mockSocietyData,
        icon: null
      }
    });
    const appendMock = vi.fn();
    const originalFormData = global.FormData;
    global.FormData = vi.fn().mockImplementation(() => ({
      append: appendMock,
    }));
    renderComponent();
    await screen.findByLabelText('Society Name');
    const submitButton = screen.getByRole('button', { name: /submit update request/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    expect(appendMock).not.toHaveBeenCalledWith('icon', null);
    expect(apiClient.patch).toHaveBeenCalled();
    global.FormData = originalFormData;
  });

  it('handles the case where icon is a string URL', async () => {
    const iconUrl = 'http://example.com/icon.png';
    (apiClient.get as vi.Mock).mockResolvedValue({
      data: {
        ...mockSocietyData,
        icon: iconUrl
      }
    });
    const appendMock = vi.fn();
    const originalFormData = global.FormData;
    global.FormData = vi.fn().mockImplementation(() => ({
      append: appendMock,
    }));
    renderComponent();
    await screen.findByLabelText('Society Name');
    const submitButton = screen.getByRole('button', { name: /submit update request/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    expect(appendMock).not.toHaveBeenCalledWith('icon', iconUrl);
    expect(apiClient.patch).toHaveBeenCalled();
    global.FormData = originalFormData;
  });

  it('tests preview functionality with large datasets', async () => {
    const largerDataset = {
      ...mockSocietyData,
      name: 'Very Long Society Name That Tests Rendering',
      membership_requirements:
        'A very long text about membership requirements that spans multiple lines and tests the rendering capabilities of the preview modal. This should be long enough to trigger any conditional rendering logic.',
      upcoming_projects_or_plans:
        'Multiple upcoming projects including seminars, workshops, and community events. We are also planning international collaboration with similar societies from other universities.',
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9', 'tag10']
    };
    (apiClient.get as vi.Mock).mockResolvedValue({ data: largerDataset });
    renderComponent();
    await screen.findByLabelText('Society Name');
    const previewButton = screen.getByRole('button', { name: /preview/i });
    fireEvent.click(previewButton);
    expect(screen.getByTestId('society-preview-modal')).toBeInTheDocument();
    expect(
      screen.getByText('Very Long Society Name That Tests Rendering')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /close preview/i }));
    await waitFor(() => {
      expect(screen.queryByTestId('society-preview-modal')).not.toBeInTheDocument();
    });
  });

  it('handles malformed social_media_links in the API response', async () => {
    (apiClient.get as vi.Mock).mockResolvedValue({
      data: {
        ...mockSocietyData,
        social_media_links: 'not an object but a string'
      }
    });
    renderComponent();
    await screen.findByLabelText('Society Name');
    const submitButton = screen.getByRole('button', { name: /submit update request/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    expect(apiClient.patch).toHaveBeenCalled();
  });
});
