import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import ManageSocieties from '../AdminSocietyManagement';
// Mock axios
vi.mock('axios', () => ({
    default: {
        get: vi.fn(() => Promise.resolve({ data: [] })),
        post: vi.fn(() => Promise.resolve({ data: {} })),
        put: vi.fn(() => Promise.resolve({ data: {} })),
        delete: vi.fn(() => Promise.resolve({ data: {} })),
        create: vi.fn().mockReturnValue({
            get: vi.fn(() => Promise.resolve({ data: [] })),
            post: vi.fn(() => Promise.resolve({ data: {} })),
            put: vi.fn(() => Promise.resolve({ data: {} })),
            delete: vi.fn(() => Promise.resolve({ data: {} })),
            interceptors: {
                request: { use: vi.fn(), eject: vi.fn() },
                response: { use: vi.fn(), eject: vi.fn() }
            }
        })
    }
}));
// Mock the child components
vi.mock('../AdminSocietyManagement/SocietyList', () => ({
    default: () => _jsx("div", { "data-testid": "society-list", children: "Society List Component" })
}));
vi.mock('../AdminSocietyManagement/RejectedSocietiesList', () => ({
    default: () => _jsx("div", { "data-testid": "rejected-societies", children: "Rejected Societies Component" })
}));
vi.mock('../AdminSocietyManagement/SocietyCreationRequests', () => ({
    default: () => _jsx("div", { "data-testid": "pending-societies", children: "Pending Societies Component" })
}));
vi.mock('../AdminSocietyManagement/SocietyDesChangeRequest', () => ({
    default: () => _jsx("div", { "data-testid": "description-requests", children: "Description Requests Component" })
}));
// Mock the theme tokens
vi.mock('../theme/theme', () => ({
    tokens: () => ({
        grey: {
            100: '#ffffff',
            200: '#f0f0f0'
        }
    })
}));
describe('ManageSocieties', () => {
    let localStorageMock;
    // Mock WebSocket
    global.WebSocket = class MockWebSocket {
        constructor() {
            this.onopen = null;
            this.onclose = null;
            this.onmessage = null;
            this.onerror = null;
            setTimeout(() => {
                if (this.onopen)
                    this.onopen();
            }, 0);
        }
        send() { }
        close() { }
    };
    beforeEach(() => {
        // Setup localStorage mock
        localStorageMock = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            clear: vi.fn()
        };
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock
        });
    });
    afterEach(() => {
        vi.clearAllMocks();
    });
    const renderWithTheme = (component) => {
        const theme = createTheme();
        return render(_jsx(BrowserRouter, { children: _jsx(ThemeProvider, { theme: theme, children: component }) }));
    };
    it('renders the component with title', () => {
        localStorageMock.getItem.mockReturnValue(null);
        renderWithTheme(_jsx(ManageSocieties, {}));
        expect(screen.getByText('Manage Societies')).toBeInTheDocument();
    });
    it('renders all tabs', () => {
        localStorageMock.getItem.mockReturnValue(null);
        renderWithTheme(_jsx(ManageSocieties, {}));
        expect(screen.getByText('Current societies')).toBeInTheDocument();
        expect(screen.getByText('Pending societies')).toBeInTheDocument();
        expect(screen.getByText('Rejected societies')).toBeInTheDocument();
        expect(screen.getByText('Description requests')).toBeInTheDocument();
    });
    it('shows the first tab content by default when no localStorage value', () => {
        localStorageMock.getItem.mockReturnValue(null);
        renderWithTheme(_jsx(ManageSocieties, {}));
        expect(screen.getByTestId('society-list-title')).toBeInTheDocument();
        expect(screen.queryByText('Pending societies')).toBeInTheDocument();
        expect(screen.queryByText('Rejected societies')).toBeInTheDocument();
        expect(screen.queryByText('Description requests')).toBeInTheDocument();
    });
    it('shows the saved tab from localStorage on initial render', () => {
        localStorageMock.getItem.mockReturnValue('2'); // Rejected societies tab
        renderWithTheme(_jsx(ManageSocieties, {}));
        // Check that the Rejected societies tab is selected
        const rejectedTab = screen.getByText('Rejected societies');
        expect(rejectedTab.closest('button')).toHaveClass('Mui-selected');
        // SocietyList should not be visible
        expect(screen.queryByTestId('society-list-title')).not.toBeInTheDocument();
    });
    it('changes tab when a tab is clicked', () => {
        localStorageMock.getItem.mockReturnValue(null);
        renderWithTheme(_jsx(ManageSocieties, {}));
        // Initially shows first tab
        expect(screen.getByTestId('society-list-title')).toBeInTheDocument();
        // Click on Pending societies tab
        fireEvent.click(screen.getByText('Pending societies'));
        // The Pending societies tab should now be selected
        const pendingTab = screen.getByText('Pending societies');
        expect(pendingTab.closest('button')).toHaveClass('Mui-selected');
        // SocietyList should no longer be visible
        expect(screen.queryByTestId('society-list-title')).not.toBeInTheDocument();
        // Should save the tab index to localStorage
        expect(localStorageMock.setItem).toHaveBeenCalledWith('activeTab', '1');
    });
    it('handles clicking through all tabs', () => {
        localStorageMock.getItem.mockReturnValue(null);
        renderWithTheme(_jsx(ManageSocieties, {}));
        // Check Current societies tab (default)
        expect(screen.getByTestId('society-list-title')).toBeInTheDocument();
        const currentTab = screen.getByText('Current societies');
        expect(currentTab.closest('button')).toHaveClass('Mui-selected');
        // Click and check Pending societies tab
        fireEvent.click(screen.getByText('Pending societies'));
        const pendingTab = screen.getByText('Pending societies');
        expect(pendingTab.closest('button')).toHaveClass('Mui-selected');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('activeTab', '1');
        // Click and check Rejected societies tab
        fireEvent.click(screen.getByText('Rejected societies'));
        const rejectedTab = screen.getByText('Rejected societies');
        expect(rejectedTab.closest('button')).toHaveClass('Mui-selected');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('activeTab', '2');
        // Click and check Description requests tab
        fireEvent.click(screen.getByText('Description requests'));
        const descTab = screen.getByText('Description requests');
        expect(descTab.closest('button')).toHaveClass('Mui-selected');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('activeTab', '3');
        // Go back to first tab
        fireEvent.click(screen.getByText('Current societies'));
        expect(currentTab.closest('button')).toHaveClass('Mui-selected');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('activeTab', '0');
    });
});
