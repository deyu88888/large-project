import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import GiveAwardPage from '../GiveAwardPage';
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
        get: vi.fn(),
        post: vi.fn(),
    },
}));
const mockNavigate = vi.fn();
const mockUseParams = vi.fn().mockReturnValue({ student_id: '456' });
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => mockUseParams(),
    };
});
describe('GiveAwardPage Component', () => {
    const mockStudentId = '456';
    const mockAlert = vi.fn();
    const mockAwards = [
        {
            id: 1,
            rank: 'Gold',
            title: 'Outstanding Achievement',
            description: 'Awarded for exceptional contributions',
            is_custom: false
        },
        {
            id: 2,
            rank: 'Silver',
            title: 'Excellence Award',
            description: 'Recognizes excellence in performance',
            is_custom: false
        },
        {
            id: 3,
            rank: 'Bronze',
            title: 'Participation Award',
            description: 'For active participation in society events',
            is_custom: true
        }
    ];
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseParams.mockReturnValue({ student_id: '456' });
        global.alert = mockAlert;
        (apiClient.get).mockResolvedValue({
            data: mockAwards
        });
        (apiClient.post).mockResolvedValue({
            data: { success: true }
        });
    });
    const setup = async (useDarkTheme = false) => {
        let renderResult;
        await act(async () => {
            renderResult = render(_jsx(ThemeProvider, { theme: useDarkTheme ? darkTheme : theme, children: _jsx(MemoryRouter, { initialEntries: [`/give-award/${mockStudentId}`], children: _jsx(Routes, { children: _jsx(Route, { path: "/give-award/:student_id", element: _jsx(GiveAwardPage, {}) }) }) }) }));
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        return renderResult;
    };
    it('renders loading state initially', async () => {
        const originalGet = apiClient.get;
        (apiClient.get).mockImplementation(() => new Promise(resolve => {
            setTimeout(() => resolve({ data: mockAwards }), 1000);
        }));
        await act(async () => {
            render(_jsx(ThemeProvider, { theme: theme, children: _jsx(MemoryRouter, { initialEntries: [`/give-award/${mockStudentId}`], children: _jsx(Routes, { children: _jsx(Route, { path: "/give-award/:student_id", element: _jsx(GiveAwardPage, {}) }) }) }) }));
        });
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        (apiClient.get).mockImplementation(originalGet);
    });
    it('fetches and displays awards correctly', async () => {
        await setup();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        expect(screen.getByText('Select an Award')).toBeInTheDocument();
        expect(screen.getByText('Choose an award to give to the student.')).toBeInTheDocument();
        expect(screen.getByText(/Outstanding Achievement.*Gold/)).toBeInTheDocument();
        expect(screen.getByText(/Excellence Award.*Silver/)).toBeInTheDocument();
        expect(screen.getByText(/Participation Award.*Bronze/)).toBeInTheDocument();
        expect(screen.getByText('Awarded for exceptional contributions')).toBeInTheDocument();
        expect(screen.getByText('Recognizes excellence in performance')).toBeInTheDocument();
        expect(screen.getByText('For active participation in society events')).toBeInTheDocument();
        expect(apiClient.get).toHaveBeenCalledWith('/api/awards');
    });
    it('renders correctly in dark theme', async () => {
        await setup(true);
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        expect(screen.getByText('Select an Award')).toBeInTheDocument();
    });
    it('handles giving an award successfully', async () => {
        await setup();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        const giveAwardButtons = screen.getAllByText('Give Award');
        await act(async () => {
            fireEvent.click(giveAwardButtons[0]);
        });
        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledWith('/api/award-students', {
                student_id: 456,
                award_id: 1
            });
        });
        expect(mockAlert).toHaveBeenCalledWith('Award assigned successfully!');
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
    it('handles API error when giving award', async () => {
        (apiClient.post).mockRejectedValueOnce(new Error('Failed to assign award'));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        await setup();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        const giveAwardButtons = screen.getAllByText('Give Award');
        await act(async () => {
            fireEvent.click(giveAwardButtons[0]);
        });
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(mockAlert).toHaveBeenCalledWith('Failed to assign award.');
        });
        expect(mockNavigate).not.toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });
    it('handles non-numeric student ID', async () => {
        mockUseParams.mockReturnValue({ student_id: 'non-numeric' });
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        (apiClient.post).mockRejectedValueOnce(new Error('Failed to assign award'));
        await act(async () => {
            render(_jsx(ThemeProvider, { theme: theme, children: _jsx(MemoryRouter, { initialEntries: ['/give-award/non-numeric'], children: _jsx(Routes, { children: _jsx(Route, { path: "/give-award/:student_id", element: _jsx(GiveAwardPage, {}) }) }) }) }));
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        const giveAwardButtons = screen.getAllByText('Give Award');
        await act(async () => {
            fireEvent.click(giveAwardButtons[0]);
        });
        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledWith('/api/award-students', {
                student_id: NaN,
                award_id: 1
            });
        });
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(mockAlert).toHaveBeenCalledWith('Failed to assign award.');
        });
        consoleErrorSpy.mockRestore();
    });
    it('handles API error when fetching awards', async () => {
        (apiClient.get).mockRejectedValueOnce(new Error('Failed to load awards'));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        await act(async () => {
            render(_jsx(ThemeProvider, { theme: theme, children: _jsx(MemoryRouter, { initialEntries: [`/give-award/${mockStudentId}`], children: _jsx(Routes, { children: _jsx(Route, { path: "/give-award/:student_id", element: _jsx(GiveAwardPage, {}) }) }) }) }));
        });
        await waitFor(() => {
            expect(screen.getByText('Failed to load awards.')).toBeInTheDocument();
        });
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });
    it('displays error state correctly in dark theme', async () => {
        (apiClient.get).mockRejectedValueOnce(new Error('Failed to load awards'));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        await act(async () => {
            render(_jsx(ThemeProvider, { theme: darkTheme, children: _jsx(MemoryRouter, { initialEntries: [`/give-award/${mockStudentId}`], children: _jsx(Routes, { children: _jsx(Route, { path: "/give-award/:student_id", element: _jsx(GiveAwardPage, {}) }) }) }) }));
        });
        await waitFor(() => {
            expect(screen.getByText('Failed to load awards.')).toBeInTheDocument();
        });
        consoleErrorSpy.mockRestore();
    });
    it('displays message when no awards are available', async () => {
        (apiClient.get).mockResolvedValueOnce({
            data: []
        });
        await setup();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        expect(screen.getByText('No awards available.')).toBeInTheDocument();
    });
    it('navigates back when back button is clicked', async () => {
        await setup();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        const backButton = screen.getByText('Back');
        await act(async () => {
            fireEvent.click(backButton);
        });
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
});
