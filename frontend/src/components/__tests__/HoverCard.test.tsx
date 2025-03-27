
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { HoverCard } from "../HoverCard";
import { useAuthStore } from "../../stores/auth-store";
import { apiClient } from "../../api";

vi.mock("../../api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("../../stores/auth-store", () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 1, username: "testuser" },
  })),
}));

describe("HoverCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches user info and displays it on hover", async () => {
    const userData = {
      id: 2,
      username: "hoveruser",
      icon: "/icon.png",
      following_count: 5,
      followers_count: 10,
      is_following: false,
      president_of: null,
    };

    (apiClient.get as any).mockResolvedValueOnce({ data: userData });

    render(
      <HoverCard userId={2}>
        <span>Hover Me</span>
      </HoverCard>
    );

    const trigger = screen.getByText("Hover Me");
    await act(async () => {
      fireEvent.mouseEnter(trigger);
      await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    });

    await waitFor(() => {
      expect(screen.getByText("hoveruser")).toBeInTheDocument();
      expect(screen.getByText("Following")).toBeInTheDocument();
      expect(screen.getByText("Followers")).toBeInTheDocument();
    });
  });

  it("displays snackbar if user tries to follow themselves", async () => {
    const userData = {
      id: 1, 
      username: "testuser",
      icon: "/icon.png",
      following_count: 2,
      followers_count: 4,
      is_following: false,
      president_of: null,
    };

    (apiClient.get as any).mockResolvedValueOnce({ data: userData });

    render(
      <HoverCard userId={1}>
        <span>Hover Me</span>
      </HoverCard>
    );

    const trigger = screen.getByText("Hover Me");
    await act(async () => {
      fireEvent.mouseEnter(trigger);
      await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    });

    await waitFor(() => expect(screen.getByText("testuser")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /follow/i }));
    });

    await waitFor(() => {
      expect(screen.getByText("You cannot follow yourself.")).toBeInTheDocument();
    });
  });
});