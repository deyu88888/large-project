// stuck on vitest, maybe an infiniteloop 

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, test, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ProfileHeader from '../ProfileHeader';
import { apiClient } from '../../../api';
import { ThemeProvider, createTheme } from '@mui/material';
import { act } from 'react-dom/test-utils';

vi.mock("react-easy-crop", () => ({
  default: (props: any) => {
    React.useEffect(() => {
      if (props.onCropComplete) {
        props.onCropComplete(null, { x: 0, y: 0, width: 100, height: 100 });
      }
    }, [props.onCropComplete]);
    return <div data-testid="dummy-cropper">Cropper</div>;
  },
}));

vi.mock("../../../api", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe("ProfileHeader component", () => {
  const mockOnToggleFollow = vi.fn();
  const mockOnAvatarUpdated = vi.fn();

  const baseProps = {
    isSelf: false,
    profile: {
      id: 1,
      first_name: "John",
      following_count: 10,
      followers_count: 20,
      icon: "/test-icon.png",
      is_staff: false,
    },
    isFollowing: false,
    onToggleFollow: mockOnToggleFollow,
    onAvatarUpdated: mockOnAvatarUpdated,
    setSnackbarData: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the user's name with 'Profile' if not self", () => {
    render(<ProfileHeader {...baseProps} />);
    expect(screen.getByText("John's Profile")).toBeInTheDocument();
  });

  it("renders welcome text if isSelf is true", () => {
    const props = { ...baseProps, isSelf: true };
    render(<ProfileHeader {...props} />);
    expect(screen.getByText("Welcome back, John!")).toBeInTheDocument();
  });

  it("shows 'Follow' button if not following", () => {
    render(<ProfileHeader {...baseProps} />);
    expect(screen.getByText("Follow")).toBeInTheDocument();
  });

  it("calls onToggleFollow when 'Follow'/'Unfollow' button is clicked", () => {
    render(<ProfileHeader {...baseProps} />);
    const followBtn = screen.getByText("Follow");
    fireEvent.click(followBtn);
    expect(mockOnToggleFollow).toHaveBeenCalledTimes(1);
  });

  it("renders 'Unfollow' if isFollowing is true", () => {
    const props = { ...baseProps, isFollowing: true };
    render(<ProfileHeader {...props} />);
    expect(screen.getByText("Unfollow")).toBeInTheDocument();
  });

  it("does not render follow/unfollow button if isSelf is true", () => {
    const props = { ...baseProps, isSelf: true };
    render(<ProfileHeader {...props} />);
    expect(screen.queryByText("Follow")).not.toBeInTheDocument();
    expect(screen.queryByText("Unfollow")).not.toBeInTheDocument();
  });

  it("does not render following/fans if user is staff", () => {
    const props = {
      ...baseProps,
      profile: { ...baseProps.profile, is_staff: true },
    };
    render(<ProfileHeader {...props} />);
    expect(screen.queryByText(/Following:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Fans:/)).not.toBeInTheDocument();
  });

  it("shows following/fans counts if user is not staff", () => {
    render(<ProfileHeader {...baseProps} />);
    expect(
      screen.getByText((_, node) =>
        node?.textContent?.replace(/\s+/g, " ").trim() === "Following: 10"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, node) =>
        node?.textContent?.replace(/\s+/g, " ").trim() === "Fans: 20"
      )
    ).toBeInTheDocument();
  });

  it("opens file selector if user isSelf and not staff when avatar is clicked", () => {
    const props = { ...baseProps, isSelf: true };
    render(<ProfileHeader {...props} />);
    const editBtn = screen.getByTestId("edit-avatar-btn");
    fireEvent.click(editBtn);
    const fileInput = screen.getByTestId("file-input") as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
  });

  it("does not open file selector if user is staff", () => {
    const props = {
      ...baseProps,
      isSelf: true,
      profile: { ...baseProps.profile, is_staff: true },
    };
    render(<ProfileHeader {...props} />);
    const editIconBtn = screen.queryByTestId("edit-avatar-btn");
    expect(editIconBtn).toBeNull();
  });

  it("opens crop dialog when a file is chosen", async () => {
    const props = { ...baseProps, isSelf: true };
    render(<ProfileHeader {...props} />);
    const editBtn = screen.getByTestId("edit-avatar-btn");
    fireEvent.click(editBtn);
    const fileInput = screen.getByTestId("file-input") as HTMLInputElement;
    const testFile = new File(["(dummy-content)"], "test.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [testFile] } });
    await waitFor(() => {
      expect(screen.getByTestId("crop-dialog")).toBeInTheDocument();
    });
  });

  it("calls API when Confirm is clicked and triggers onAvatarUpdated", async () => {
    (apiClient.post as vi.Mock).mockResolvedValue({ data: { icon: "/new-icon.png" } });
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { ...window.location, reload: vi.fn() },
    });
    const props = { ...baseProps, isSelf: true };
    render(<ProfileHeader {...props} />);
    const editBtn = screen.getByTestId("edit-avatar-btn");
    fireEvent.click(editBtn);
    const fileInput = screen.getByTestId("file-input") as HTMLInputElement;
    const testFile = new File(["fake-content"], "test.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [testFile] } });
    await waitFor(() => expect(screen.getByTestId("crop-dialog")).toBeInTheDocument());
    const confirmBtn = screen.getByTestId("crop-confirm-btn");
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledTimes(1);
      expect(mockOnAvatarUpdated).toHaveBeenCalledWith("/new-icon.png");
    });
  });
});