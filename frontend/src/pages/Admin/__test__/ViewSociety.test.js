import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ViewSociety from '../ViewSociety';
import { apiClient } from '../../../api';
const theme = createTheme({
    palette: {
        mode: 'light',
    }
});
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    }
});
vi.mock('../../../api', () => ({
    apiClient: {
        get: vi.fn().mockImplementation(() => Promise.resolve({})),
        patch: vi.fn().mockImplementation(() => Promise.resolve({}))
    },
    apiPaths: {
        USER: {
            ADMINSOCIETYVIEW: (id) => `/api/admin-manage-society-details/${id}`,
        }
    }
}));
vi.mock('../../../stores/auth-store', () => ({
    useAuthStore: vi.fn(() => ({
        user: { id: 123, name: 'Test User', role: 'admin' }
    }))
}));
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ society_id: '789' }),
    };
});
vi.mock('../../../theme/theme', () => ({
    tokens: () => ({
        grey: {
            100: '#e0e0e0',
            200: '#c2c2c2',
        },
        primary: {
            100: '#d3d4de',
            200: '#a8a9b4',
            500: '#141b2d',
        },
        greenAccent: {
            500: '#4cceac',
        },
    }),
}));
describe('ViewSociety Component', () => {
    const mockSocietyId = 789;
    const mockAlert = vi.fn();
    const mockSociety = {
        id: mockSocietyId,
        name: 'Chess Club',
        description: 'A club for chess enthusiasts',
        category: 'Games',
        leader: 'John Doe',
        approved_by: 'Admin User',
        status: 'Active',
        timetable: 'Mondays at 5pm',
        membership_requirements: 'Open to all students',
        upcoming_projects_or_plans: 'Chess tournament in April',
        social_media_links: {
            instagram: 'https://instagram.com/chessclub',
            twitter: 'https://twitter.com/chessclub'
        },
        tags: ['chess', 'games', 'competition']
    };
    beforeEach(() => {
        vi.clearAllMocks();
        global.alert = mockAlert;
        apiClient.get.mockResolvedValue({
            data: mockSociety
        });
        apiClient.patch.mockResolvedValue({
            data: { success: true }
        });
    });
    const setup = async (useDarkTheme = false) => {
        let renderResult;
        await act(async () => {
            renderResult = render(_jsx(ThemeProvider, { theme: useDarkTheme ? darkTheme : theme, children: _jsx(MemoryRouter, { initialEntries: [`/view-society/${mockSocietyId}`], children: _jsx(Routes, { children: _jsx(Route, { path: "/view-society/:society_id", element: _jsx(ViewSociety, {}) }) }) }) }));
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        return renderResult;
    };
    it('renders loading state initially', async () => {
        const originalMock = apiClient.get.getMockImplementation();
        apiClient.get.mockImplementation(() => new Promise(resolve => {
            setTimeout(() => resolve({ data: mockSociety }), 1000);
        }));
        render(_jsx(ThemeProvider, { theme: theme, children: _jsx(MemoryRouter, { initialEntries: [`/view-society/${mockSocietyId}`], children: _jsx(Routes, { children: _jsx(Route, { path: "/view-society/:society_id", element: _jsx(ViewSociety, {}) }) }) }) }));
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        apiClient.get.mockImplementation(originalMock);
    });
    it('fetches and displays society details correctly', async () => {
        await setup();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        expect(screen.getByText('View Society Details')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Chess Club')).toBeInTheDocument();
        expect(screen.getByDisplayValue('A club for chess enthusiasts')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Games')).toBeInTheDocument();
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Active')).toBeInTheDocument();
        expect(screen.getByDisplayValue('chess, games, competition')).toBeInTheDocument();
        expect(apiClient.get).toHaveBeenCalledWith(`/api/admin-manage-society-details/${mockSocietyId}`);
    });
    it('renders correctly in dark theme', async () => {
        await setup(true);
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        expect(screen.getByText('View Society Details')).toBeInTheDocument();
    });
    it('handles form submission successfully', async () => {
        await setup();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        const nameInput = screen.getByLabelText('Society Name');
        fireEvent.change(nameInput, { target: { value: 'Updated Chess Club' } });
        const saveButton = screen.getByText('Save Changes');
        await act(async () => {
            fireEvent.click(saveButton);
        });
        await waitFor(() => {
            expect(apiClient.patch).toHaveBeenCalled();
        });
        expect(mockAlert).toHaveBeenCalledWith('Society updated successfully!');
    });
    it('handles API error when submitting the form', async () => {
        apiClient.patch.mockRejectedValueOnce(new Error('Failed to update society'));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        await setup();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        const saveButton = screen.getByText('Save Changes');
        await act(async () => {
            fireEvent.click(saveButton);
        });
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(mockAlert).toHaveBeenCalledWith('There was an error updating the society.');
        });
        consoleErrorSpy.mockRestore();
    });
    it('handles API error when fetching society details', async () => {
        apiClient.get.mockRejectedValueOnce(new Error('Failed to load society details'));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        await act(async () => {
            render(_jsx(ThemeProvider, { theme: theme, children: _jsx(MemoryRouter, { initialEntries: [`/view-society/${mockSocietyId}`], children: _jsx(Routes, { children: _jsx(Route, { path: "/view-society/:society_id", element: _jsx(ViewSociety, {}) }) }) }) }));
        });
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });
    it('navigates back when back button is clicked', async () => {
        await setup();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        const backButton = screen.getByText('← Back');
        await act(async () => {
            fireEvent.click(backButton);
        });
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
    it('updates form data when changing input values', async () => {
        await setup();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        const descriptionInput = screen.getByLabelText('Description');
        fireEvent.change(descriptionInput, { target: { value: 'Updated description' } });
        expect(descriptionInput.value).toBe('Updated description');
        const categoryInput = screen.getByLabelText('Category');
        fireEvent.change(categoryInput, { target: { value: 'Board Games' } });
        expect(categoryInput.value).toBe('Board Games');
    });
    it('updates tags when changing tags input', async () => {
        await setup();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        const tagsInput = screen.getByLabelText('Tags (comma separated)');
        fireEvent.change(tagsInput, { target: { value: 'chess, strategy, board games' } });
        expect(tagsInput.value).toBe('chess, strategy, board games');
    });
});
