import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ViewSociety from '../ViewSociety';
import { apiClient } from '../../api';

vi.mock('../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const theme = createTheme();

describe('ViewSociety Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url.startsWith('/api/society-view')) {
        return Promise.resolve({
            data: {
              id: 1,
              name: "Robotics Club",
              description: "default",
              society_members: [1,2],
              president: {
                id: 1,
                username: "president_user",
                first_name: "President",
                last_name: "User",
                email: "president@example.com",
                is_active: true,
                role: "student",
                major: "Mechanical Engineering",
                societies: [],
                president_of: 14,
                is_president: true,
                award_students: [95],
              },
              category: "General",
              social_media_links: {
                facebook: "https://www.facebook.com/kclsupage/",
                instagram: "https://www.instagram.com/kclsu/",
                x: "https://x.com/kclsu",
              },
              icon: [],
              showreel_images: [],
              tags: [],
              vice_president: null,
              event_manager: null,
              treasurer: null,
              is_member: false
            },
        });
      }
      return Promise.resolve({ data: null });
    });

    (apiClient.post as vi.Mock).mockResolvedValue({ status: 200 });
  });

  const renderComponent = () =>
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <ViewSociety />
        </MemoryRouter>
      </ThemeProvider>
    );

  it("displays a loading message initially and then renders society", async () => {
    renderComponent();

    expect(screen.getByText(/Loading society.../i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/Robotics Club/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/General/i)).toBeInTheDocument()
    expect(screen.getByText(/default/i)).toBeInTheDocument()
  });

  it("validates when role fields are null we get no roles listed", async () => {
    renderComponent();

    expect(screen.getByText(/Loading society.../i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/Robotics Club/i)).toBeInTheDocument()
    );

    expect(screen.queryByText(/Vice President/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Event Manager/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Treasurer/i)).not.toBeInTheDocument();
  });

  it("when clicking student email opens a link to email them", async () => {
    renderComponent();

    expect(screen.getByText(/Loading society.../i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/Robotics Club/i)).toBeInTheDocument()
    );
    const email_button = screen.getByText("president@example.com");
    expect(email_button).toHaveAttribute("href", "mailto:president@example.com");

    await act(async () => {
      fireEvent.click(email_button);
    });
  });

  it('when clicking social button opens a link to respective social', async () => {
    renderComponent();

    expect(screen.getByText(/Loading society.../i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/Robotics Club/i)).toBeInTheDocument()
    );
    const instaicon = await screen.getByTestId("InstagramIcon");
    const instalink = instaicon.closest("a");

    const faceicon = await screen.getByTestId("FacebookIcon");
    const facelink = faceicon.closest("a");

    const xicon = await screen.getByTestId("XIcon");
    const xlink = xicon.closest("a");

    expect(instalink).toHaveAttribute("href", "https://www.instagram.com/kclsu/");
    expect(facelink).toHaveAttribute("href", "https://www.facebook.com/kclsupage/");
    expect(xlink).toHaveAttribute("href", "https://x.com/kclsu");
  });
});
