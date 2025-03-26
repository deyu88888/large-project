import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ViewStudent from '../ViewStudent';
import * as apiModule from '../../../api';
// Mock the theme
const theme = createTheme({
    palette: {
        mode: 'light',
    }
});
// Create a proper mock for apiClient
const mockGet = vi.fn();
const mockPatch = vi.fn();
// Mock the API module
vi.mock('../../../api', () => {
    return {
        apiClient: {
            get: vi.fn(),
            patch: vi.fn(),
        },
        apiPaths: {
            USER: {
                ADMINSTUDENTVIEW: (id) => `/api/admin-student-view/${id}`,
            },
        },
    };
});
// Access the mocked module
const { apiClient } = apiModule;
// Mock navigate and useParams
const mockNavigate = vi.fn();
const mockUseParams = vi.fn().mockReturnValue({ student_id: '123' });
// Mock react-router-dom
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => mockUseParams(),
    };
});
// Mock auth store
vi.mock('../../../stores/auth-store', () => ({
    useAuthStore: () => ({
        user: { id: 1, role: 'admin' },
    }),
}));
// Mock theme tokens
vi.mock('../../../theme/theme', () => ({
    tokens: () => ({
        primary: {
            100: '#f0f0f0',
            500: '#666666',
        },
        grey: {
            100: '#e0e0e0',
        },
    }),
}));
describe('ViewStudent Component', () => {
    const mockStudentId = '123';
    const mockAlert = vi.fn();
    const mockStudentData = {
        id: 123,
        username: 'student123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: 'student',
        major: 'Computer Science',
        societies: ['Tech Club', 'Chess Club'],
        isActive: true,
        presidentOf: [456, 789],
        isPresident: true,
    };
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseParams.mockReturnValue({ student_id: mockStudentId });
        global.alert = mockAlert;
        // Set up the mock implementations for this test
        apiClient.get.mockImplementation(() => Promise.resolve({ data: mockStudentData }));
        apiClient.patch.mockImplementation(() => Promise.resolve({ data: { success: true } }));
    });
    const setup = async () => {
        let renderResult;
        await act(async () => {
            renderResult = render(_jsx(ThemeProvider, { theme: theme, children: _jsx(MemoryRouter, { initialEntries: [`/view-student/${mockStudentId}`], children: _jsx(Routes, { children: _jsx(Route, { path: "/view-student/:student_id", element: _jsx(ViewStudent, {}) }) }) }) }));
            // Let the promises in useEffect resolve
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        return renderResult;
    };
    it('renders loading state initially', async () => {
        const originalGet = apiClient.get;
        // Override the mock for this specific test
        apiClient.get.mockImplementation(() => new Promise(resolve => {
            setTimeout(() => resolve({ data: mockStudentData }), 100);
        }));
        render(_jsx(ThemeProvider, { theme: theme, children: _jsx(MemoryRouter, { initialEntries: [`/view-student/${mockStudentId}`], children: _jsx(Routes, { children: _jsx(Route, { path: "/view-student/:student_id", element: _jsx(ViewStudent, {}) }) }) }) }));
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        apiClient.get.mockImplementation(originalGet);
    });
    it('fetches and displays student data correctly', async () => {
        await setup();
        expect(apiClient.get).toHaveBeenCalledWith(`/api/admin-student-view/${mockStudentId}`);
        expect(screen.getByText('View Student Details')).toBeInTheDocument();
        expect(screen.getByLabelText('Username')).toHaveValue('student123');
        expect(screen.getByLabelText('First Name')).toHaveValue('John');
        expect(screen.getByLabelText('Last Name')).toHaveValue('Doe');
        expect(screen.getByLabelText('Email')).toHaveValue('john.doe@example.com');
        expect(screen.getByLabelText('Role')).toHaveValue('student');
        expect(screen.getByLabelText('Major')).toHaveValue('Computer Science');
        expect(screen.getByLabelText('Societies')).toHaveValue('Tech Club, Chess Club');
        expect(screen.getByLabelText('Active')).toBeChecked();
        expect(screen.getByLabelText('Is President')).toBeChecked();
    });
    it('navigates back when back button is clicked', async () => {
        await setup();
        const backButton = screen.getByText('← Back');
        fireEvent.click(backButton);
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
    it('handles form submission correctly', async () => {
        await setup();
        // Change a field
        fireEvent.change(screen.getByLabelText('First Name'), {
            target: { value: 'Jane' }
        });
        // Submit the form
        const saveButton = screen.getByText('Save Changes');
        await act(async () => {
            fireEvent.click(saveButton);
        });
        // Check that the API was called with FormData
        expect(apiClient.patch).toHaveBeenCalledWith(`/api/admin-manage-student-details/${mockStudentId}`, expect.any(FormData), expect.objectContaining({
            headers: { 'Content-Type': 'multipart/form-data' }
        }));
        // Verify success message
        expect(mockAlert).toHaveBeenCalledWith('Student updated successfully!');
    });
    it('handles API error when submitting form', async () => {
        // Override the mock for this specific test
        apiClient.patch.mockImplementation(() => Promise.reject(new Error('Failed to update student')));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        await setup();
        // Submit the form
        const saveButton = screen.getByText('Save Changes');
        await act(async () => {
            fireEvent.click(saveButton);
        });
        // Verify error handling
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith('There was an error updating the student.');
        consoleErrorSpy.mockRestore();
    });
    it('handles API error when fetching student data', async () => {
        // Override the mock for this specific test
        apiClient.get.mockImplementation(() => Promise.reject(new Error('Failed to fetch student')));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        await act(async () => {
            render(_jsx(ThemeProvider, { theme: theme, children: _jsx(MemoryRouter, { initialEntries: [`/view-student/${mockStudentId}`], children: _jsx(Routes, { children: _jsx(Route, { path: "/view-student/:student_id", element: _jsx(ViewStudent, {}) }) }) }) }));
        });
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
        consoleErrorSpy.mockRestore();
    });
    it('toggles switches correctly', async () => {
        await setup();
        const activeSwitch = screen.getByLabelText('Active');
        const presidentSwitch = screen.getByLabelText('Is President');
        expect(activeSwitch).toBeChecked();
        expect(presidentSwitch).toBeChecked();
        // Toggle switches
        await act(async () => {
            fireEvent.click(activeSwitch);
        });
        await act(async () => {
            fireEvent.click(presidentSwitch);
        });
        expect(activeSwitch).not.toBeChecked();
        expect(presidentSwitch).not.toBeChecked();
    });
    it('updates societies input correctly', async () => {
        await setup();
        const societiesInput = screen.getByLabelText('Societies');
        fireEvent.change(societiesInput, {
            target: { value: 'Tech Club, Chess Club, Debate Club' }
        });
        expect(societiesInput).toHaveValue('Tech Club, Chess Club, Debate Club');
    });
    it('updates presidentOf input correctly', async () => {
        await setup();
        const presidentOfInput = screen.getByLabelText('President Of (IDs)');
        fireEvent.change(presidentOfInput, {
            target: { value: '456,789,101' }
        });
        expect(presidentOfInput).toHaveValue('456,789,101');
    });
});
