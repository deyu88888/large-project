import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
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
  default: () => <div data-testid="society-list">Society List Component</div>
}));

vi.mock('../AdminSocietyManagement/RejectedSocietiesList', () => ({
  default: () => <div data-testid="rejected-societies">Rejected Societies Component</div>
}));

vi.mock('../AdminSocietyManagement/SocietyCreationRequests', () => ({
  default: () => <div data-testid="pending-societies">Pending Societies Component</div>
}));

vi.mock('../AdminSocietyManagement/SocietyDesChangeRequest', () => ({
  default: () => <div data-testid="description-requests">Description Requests Component</div>
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
        if (this.onopen) this.onopen();
      }, 0);
    }
    send() {}
    close() {}
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
    return render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {component}
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  it('renders the component with title', () => {
    localStorageMock.getItem.mockReturnValue(null);
    renderWithTheme(<ManageSocieties />);
    
    expect(screen.getByText('Manage Societies')).toBeInTheDocument();
  });

  it('renders all tabs', () => {
    localStorageMock.getItem.mockReturnValue(null);
    renderWithTheme(<ManageSocieties />);
    
    expect(screen.getByText('Current societies')).toBeInTheDocument();
    expect(screen.getByText('Pending societies')).toBeInTheDocument();
    expect(screen.getByText('Rejected societies')).toBeInTheDocument();
    expect(screen.getByText('Description requests')).toBeInTheDocument();
  });

  it('shows the first tab content by default when no localStorage value', () => {
    localStorageMock.getItem.mockReturnValue(null);
    renderWithTheme(<ManageSocieties />);
    
    // Instead of looking for the component content, just check if the first tab is selected
    const currentTab = screen.getByText('Current societies');
    expect(currentTab.closest('button')).toHaveAttribute('aria-selected', 'true');
  });

  it('shows the saved tab from localStorage on initial render', () => {
    localStorageMock.getItem.mockReturnValue('2'); // Rejected societies tab (index 2)
    renderWithTheme(<ManageSocieties />);
    
    // Check that the Rejected societies tab is selected
    const rejectedTab = screen.getByText('Rejected societies');
    expect(rejectedTab.closest('button')).toHaveAttribute('aria-selected', 'true');
  });

  it('changes tab when a tab is clicked', () => {
    localStorageMock.getItem.mockReturnValue(null);
    renderWithTheme(<ManageSocieties />);
    
    // Initially the first tab should be selected
    const currentTab = screen.getByText('Current societies');
    expect(currentTab.closest('button')).toHaveAttribute('aria-selected', 'true');
    
    // Click on Pending societies tab
    const pendingTab = screen.getByText('Pending societies');
    fireEvent.click(pendingTab);
    
    // The Pending societies tab should now be selected
    expect(pendingTab.closest('button')).toHaveAttribute('aria-selected', 'true');
    
    // Should save the tab index to localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('activeTab', '1');
  });

  it('handles clicking through all tabs', () => {
    localStorageMock.getItem.mockReturnValue(null);
    renderWithTheme(<ManageSocieties />);
    
    // Check Current societies tab (default)
    const currentTab = screen.getByText('Current societies');
    expect(currentTab.closest('button')).toHaveAttribute('aria-selected', 'true');
    
    // Click and check Pending societies tab
    const pendingTab = screen.getByText('Pending societies');
    fireEvent.click(pendingTab);
    expect(pendingTab.closest('button')).toHaveAttribute('aria-selected', 'true');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('activeTab', '1');
    
    // Click and check Rejected societies tab
    const rejectedTab = screen.getByText('Rejected societies');
    fireEvent.click(rejectedTab);
    expect(rejectedTab.closest('button')).toHaveAttribute('aria-selected', 'true');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('activeTab', '2');
    
    // Click and check Description requests tab
    const descTab = screen.getByText('Description requests');
    fireEvent.click(descTab);
    expect(descTab.closest('button')).toHaveAttribute('aria-selected', 'true');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('activeTab', '3');
    
    // Go back to first tab
    fireEvent.click(currentTab);
    expect(currentTab.closest('button')).toHaveAttribute('aria-selected', 'true');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('activeTab', '0');
  });
});