import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import SocietyDetailLayout from '../SocietyDetailLayout';
import { ThemeProvider, createTheme } from '@mui/material/styles';

vi.mock('../theme/theme', () => ({
  tokens: vi.fn(() => ({
    grey: { 0: '#fff', 100: '#f5f5f5', 300: '#e0e0e0', 900: '#212121' },
    primary: { 100: '#e3f2fd', 500: '#2196f3', 600: '#1e88e5' },
    blueAccent: { 400: '#42a5f5', 500: '#2196f3' }
  }))
}));

const mockUseSettingsStore = vi.fn(() => ({
  drawer: false
}));

vi.mock('../stores/settings-store', () => ({
  useSettingsStore: () => mockUseSettingsStore()
}));

const mockSociety = {
  id: 1,
  name: "Test Society",
  description: "This is a test society description",
  category: "Academic",
  icon: "https://example.com/icon.jpg",
  tags: ["tag1", "tag2", "tag3"],
  president: {
    id: 101,
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com"
  },
  vice_president: {
    id: 102,
    first_name: "Jane",
    last_name: "Smith",
    email: "jane.smith@example.com"
  },
  event_manager: {
    id: 103,
    first_name: "Alice",
    last_name: "Johnson",
    email: "alice.johnson@example.com"
  },
  social_media_links: {
    "Facebook": "https://facebook.com/testsociety",
    "Instagram": "https://instagram.com/testsociety",
    "X": "https://x.com/testsociety",
    "WhatsApp": "https://whatsapp.com/testsociety",
    "Other": "https://other.com/testsociety"
  },
  showreel_images: [
    { photo: "https://example.com/photo1.jpg", caption: "Event 1" },
    { photo: "https://example.com/photo2.jpg", caption: "Event 2" }
  ]
};

const mockOnJoinSociety = vi.fn();

const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

describe('SocietyDetailLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSettingsStore.mockReturnValue({ drawer: false });
  });

  test('renders loading message when loading is true', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <SocietyDetailLayout
          society={mockSociety}
          loading={true}
          joined={false}
          onJoinSociety={mockOnJoinSociety}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Loading society...')).toBeDefined();
  });

  test('renders society details correctly in light mode', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <SocietyDetailLayout
          society={mockSociety}
          loading={false}
          joined={0}
          onJoinSociety={mockOnJoinSociety}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Test Society')).toBeDefined();
    expect(screen.getByText('Academic')).toBeDefined();
    expect(screen.getByText('This is a test society description')).toBeDefined();
    
    const presidentElements = screen.getAllByText(/President:/);
    expect(presidentElements[0]).toBeDefined();
    
    const johnDoeElement = screen.getByText((content, element) => {
      return element.tagName.toLowerCase() === 'a' && content.includes('John') && content.includes('Doe');
    });
    expect(johnDoeElement).toBeDefined();
    
    expect(screen.getByText('Join Society')).toBeDefined();
    
    expect(screen.getByText('Our Society Moments!')).toBeDefined();
    
    const iconImg = screen.getByAltText('Test Society icon');
    expect(iconImg).toBeDefined();
    expect(iconImg.getAttribute('src')).toBe('https://example.com/icon.jpg');
  });

  test('renders society details correctly in dark mode', () => {
    render(
      <ThemeProvider theme={darkTheme}>
        <SocietyDetailLayout
          society={mockSociety}
          loading={false}
          joined={0}
          onJoinSociety={mockOnJoinSociety}
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Society')).toBeDefined();
    expect(screen.getByText('Join Society')).toBeDefined();
  });

  test('calls onJoinSociety when Join Society button is clicked', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <SocietyDetailLayout
          society={mockSociety}
          loading={false}
          joined={0}
          onJoinSociety={mockOnJoinSociety}
        />
      </ThemeProvider>
    );
    
    const joinButton = screen.getByText('Join Society');
    fireEvent.click(joinButton);
    
    expect(mockOnJoinSociety).toHaveBeenCalledWith(1);
  });

  test('shows Request Pending button when joined is 1', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <SocietyDetailLayout
          society={mockSociety}
          loading={false}
          joined={1}
          onJoinSociety={mockOnJoinSociety}
        />
      </ThemeProvider>
    );
    
    const pendingButton = screen.getByText('Request Pending');
    expect(pendingButton).toBeDefined();
    expect(pendingButton.hasAttribute('disabled')).toBe(true);
    
    const joinButton = screen.queryByText('Join Society');
    expect(joinButton).toBeNull();
  });

  test('renders with neither join button nor pending button when joined is not 0 or 1', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <SocietyDetailLayout
          society={mockSociety}
          loading={false}
          joined={2}
          onJoinSociety={mockOnJoinSociety}
        />
      </ThemeProvider>
    );
    
    const joinButton = screen.queryByText('Join Society');
    const pendingButton = screen.queryByText('Request Pending');
    
    expect(joinButton).toBeNull();
    expect(pendingButton).toBeNull();
  });

  test('renders society without optional fields', () => {
    const societyWithoutOptionals = {
      ...mockSociety,
      vice_president: null,
      event_manager: null,
      showreel_images: [],
      icon: null,
      tags: []
    };
    
    render(
      <ThemeProvider theme={lightTheme}>
        <SocietyDetailLayout
          society={societyWithoutOptionals}
          loading={false}
          joined={0}
          onJoinSociety={mockOnJoinSociety}
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Society')).toBeDefined();
    expect(screen.getByText('Academic')).toBeDefined();
    
    const vicePresident = screen.queryAllByText(/Vice President:/);
    const eventManager = screen.queryAllByText(/Event Manager:/);
    const showreel = screen.queryByText('Our Society Moments!');
    
    expect(vicePresident.length).toBe(0);
    expect(eventManager.length).toBe(0);
    expect(showreel).toBeNull();
    
    const icon = screen.queryByAltText('Test Society icon');
    expect(icon).toBeNull();
    
    expect(screen.queryByText(/#tag1/)).toBeNull();
  });

  test('renders with drawer open', () => {
    mockUseSettingsStore.mockReturnValue({ drawer: true });
    
    render(
      <ThemeProvider theme={lightTheme}>
        <SocietyDetailLayout
          society={mockSociety}
          loading={false}
          joined={0}
          onJoinSociety={mockOnJoinSociety}
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Society')).toBeDefined();
  });

  test('renders society with undefined icon correctly', () => {
    const societyWithoutIcon = {
      ...mockSociety,
      icon: undefined
    };
    
    render(
      <ThemeProvider theme={lightTheme}>
        <SocietyDetailLayout
          society={societyWithoutIcon}
          loading={false}
          joined={0}
          onJoinSociety={mockOnJoinSociety}
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Society')).toBeDefined();
    
    const icon = screen.queryByAltText('Test Society icon');
    expect(icon).toBeNull();
  });

  test('renders society without social media links', () => {
    const societyWithoutSocialLinks = {
      ...mockSociety,
      social_media_links: {}
    };
    
    render(
      <ThemeProvider theme={lightTheme}>
        <SocietyDetailLayout
          society={societyWithoutSocialLinks}
          loading={false}
          joined={0}
          onJoinSociety={mockOnJoinSociety}
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Society')).toBeDefined();
    
    const emailLink = screen.getByText('john.doe@example.com');
    expect(emailLink).toBeDefined();
  });

  test('renders with extremely long text fields', () => {
    const longTextSociety = {
      ...mockSociety,
      name: "A".repeat(100),
      description: "B".repeat(1000),
      category: "C".repeat(50),
      tags: ["very_long_tag".repeat(10)]
    };
    
    render(
      <ThemeProvider theme={lightTheme}>
        <SocietyDetailLayout
          society={longTextSociety}
          loading={false}
          joined={0}
          onJoinSociety={mockOnJoinSociety}
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText("A".repeat(100))).toBeDefined();
    expect(screen.getByText("B".repeat(1000))).toBeDefined();
    expect(screen.getByText("C".repeat(50))).toBeDefined();
  });

  test('renders showreel with proper structure', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <SocietyDetailLayout
          society={mockSociety}
          loading={false}
          joined={0}
          onJoinSociety={mockOnJoinSociety}
        />
      </ThemeProvider>
    );
    
    const showreelImages = screen.getAllByAltText(/Showreel/);
    expect(showreelImages.length).toBeGreaterThan(0);
    
    const event1Captions = screen.getAllByText("Event 1");
    const event2Captions = screen.getAllByText("Event 2");
    expect(event1Captions.length).toBeGreaterThan(0);
    expect(event2Captions.length).toBeGreaterThan(0);
  });

  test('renders properly with null or undefined values', () => {
    const partialSociety = {
      id: 1,
      name: "Test Society",
      category: "Academic",
      president: {
        id: 101,
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com"
      },
      social_media_links: {},
      description: undefined,
      icon: null,
      tags: null,
      vice_president: null,
      event_manager: null,
      showreel_images: null
    };
    
    render(
      <ThemeProvider theme={lightTheme}>
        <SocietyDetailLayout
          society={partialSociety as any}
          loading={false}
          joined={0}
          onJoinSociety={mockOnJoinSociety}
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText("Test Society")).toBeDefined();
    expect(screen.getByText("Academic")).toBeDefined();
  });

  test('handles joined as boolean value', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <SocietyDetailLayout
          society={mockSociety}
          loading={false}
          joined={false}
          onJoinSociety={mockOnJoinSociety}
        />
      </ThemeProvider>
    );
    
    const joinButton = screen.queryByText('Join Society');
    const pendingButton = screen.queryByText('Request Pending');
    
    expect(joinButton).toBeNull();
    expect(pendingButton).toBeNull();
  });

  test('coverage for tags section with empty tags', () => {
    const societyWithEmptyTags = {
      ...mockSociety,
      tags: []
    };
    
    render(
      <ThemeProvider theme={lightTheme}>
        <SocietyDetailLayout
          society={societyWithEmptyTags}
          loading={false}
          joined={0}
          onJoinSociety={mockOnJoinSociety}
        />
      </ThemeProvider>
    );
    
    const tagsSection = screen.queryByText(/#tag1/);
    expect(tagsSection).toBeNull();
  });
  
  test('coverage for showreel section and animation', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <SocietyDetailLayout
          society={mockSociety}
          loading={false}
          joined={0}
          onJoinSociety={mockOnJoinSociety}
        />
      </ThemeProvider>
    );
    
    const showreelTitle = screen.getByText('Our Society Moments!');
    expect(showreelTitle).toBeDefined();
    
    const showreelImages = screen.getAllByAltText(/Showreel/);
    expect(showreelImages.length).toBeGreaterThan(0);
    
    const event1Captions = screen.getAllByText('Event 1');
    expect(event1Captions.length).toBeGreaterThan(0);
  });
});