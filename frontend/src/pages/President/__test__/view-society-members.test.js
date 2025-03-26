import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ViewSocietyMembers from '../ViewSocietyMembers';
import { apiClient } from '../../../api';
import { useAuthStore } from '../../../stores/auth-store';
import { act } from 'react';
const mockNavigate = vi.fn();
let mockSocietyId = '456';
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ societyId: mockSocietyId }),
    };
});
vi.mock('../../../api', () => ({
    apiClient: {
        get: vi.fn(),
    },
}));
vi.mock('../../../stores/auth-store', () => ({
    useAuthStore: vi.fn(),
}));
const theme = createTheme();
describe('ViewSocietyMembers Component', () => {
    const mockMembers = [
        {
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
            username: 'johndoe',
        },
        {
            id: 2,
            first_name: 'Jane',
            last_name: 'Smith',
            username: 'janesmith',
        },
    ];
    const mockUser = { president_of: 123 };
    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockReset();
        mockSocietyId = '456';
        useAuthStore.mockReturnValue({ user: mockUser });
        apiClient.get.mockResolvedValue({
            data: mockMembers,
        });
    });
    function renderComponent(societyId) {
        if (societyId) {
            mockSocietyId = societyId;
        }
        const routes = [
            {
                path: '/president/view-society-members/:societyId',
                element: _jsx(ViewSocietyMembers, {}),
            },
            {
                path: '/president/view-society-members',
                element: _jsx(ViewSocietyMembers, {}),
            },
        ];
        const initialEntry = societyId
            ? `/president/view-society-members/${societyId}`
            : '/president/view-society-members';
        return render(_jsx(ThemeProvider, { theme: theme, children: _jsx(MemoryRouter, { initialEntries: [initialEntry], children: _jsx(Routes, { children: routes.map((route, index) => (_jsx(Route, { path: route.path, element: route.element }, index))) }) }) }));
    }
    it('renders loading state initially', async () => {
        let apiResolve;
        const apiPromise = new Promise((resolve) => {
            apiResolve = resolve;
        });
        apiClient.get.mockReturnValue(apiPromise);
        renderComponent();
        // Check for CircularProgress in loading state
        expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        // Now resolve the API call
        apiResolve({ data: mockMembers });
        // Wait for loading state to finish and content to appear
        await waitFor(() => {
            expect(document.querySelector('.MuiCircularProgress-root')).not.toBeInTheDocument();
            expect(screen.getByText('Society Members')).toBeInTheDocument();
        });
    });
    it('fetches and renders society members', async () => {
        await act(async () => {
            renderComponent();
        });
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        });
        expect(apiClient.get).toHaveBeenCalledWith('/api/society/456/members/');
    });
    it('handles the case when no society id is available', async () => {
        mockSocietyId = '';
        useAuthStore.mockReturnValue({ user: {} });
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        await act(async () => {
            renderComponent('');
        });
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching society members:', expect.objectContaining({ message: 'No society id available' }));
        });
        await waitFor(() => {
            expect(document.querySelector('.MuiCircularProgress-root')).not.toBeInTheDocument();
        });
        consoleErrorSpy.mockRestore();
    });
    it('navigates to view profile when "View Profile" button is clicked', async () => {
        await act(async () => {
            renderComponent();
        });
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
        const viewProfileButtons = screen.getAllByText('View Profile');
        fireEvent.click(viewProfileButtons[0]);
        expect(mockNavigate).toHaveBeenCalledWith('/profile/1');
    });
    it('navigates to give award page when "Give Award" button is clicked', async () => {
        await act(async () => {
            renderComponent();
        });
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
        const giveAwardButtons = screen.getAllByText('Give Award');
        fireEvent.click(giveAwardButtons[0]);
        expect(mockNavigate).toHaveBeenCalledWith('../give-award-page/1');
    });
    it('navigates to assign role page when "Assign Role" button is clicked', async () => {
        await act(async () => {
            renderComponent();
        });
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
        const assignRoleButtons = screen.getAllByText('Assign Role');
        fireEvent.click(assignRoleButtons[0]);
        expect(mockNavigate).toHaveBeenCalledWith('../assign-society-role/1');
    });
    it('renders "No members found" when members list is empty', async () => {
        apiClient.get.mockResolvedValueOnce({ data: [] });
        await act(async () => {
            renderComponent();
        });
        await waitFor(() => {
            expect(screen.getByText('No members found.')).toBeInTheDocument();
        });
    });
    it('handles API error when fetching members', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        apiClient.get.mockRejectedValueOnce(new Error('Fetch error'));
        await act(async () => {
            renderComponent();
        });
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching society members:', expect.any(Error));
        });
        consoleErrorSpy.mockRestore();
    });
    it('navigates back to previous page when "Back to Dashboard" is clicked', async () => {
        await act(async () => {
            renderComponent();
        });
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
        const backButton = screen.getByText('Back to Dashboard');
        fireEvent.click(backButton);
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
    it('can fetch members using provided society ID in URL', async () => {
        mockSocietyId = '456';
        await act(async () => {
            renderComponent('456');
        });
        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith('/api/society/456/members/');
        });
    });
});
