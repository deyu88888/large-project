import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginPage from "../login";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { apiClient, apiPaths } from "../../api";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../api", () => ({
  apiClient: {
    post: vi.fn(),
  },
  apiPaths: {
    USER: { LOGIN: "/auth/login/" },
  },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("renders login form correctly", () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /please register/i })).toBeInTheDocument();
    expect(screen.getByText(/need to sign up?/i)).toBeInTheDocument();
  });

  it("allows users to type and submit the form", async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(usernameInput).toHaveValue("testuser");
    expect(passwordInput).toHaveValue("password123");

    fireEvent.click(submitButton);
  });

  it("handles successful login", async () => {
    (apiClient.post as apiResponseMock).mockResolvedValueOnce({
      data: { access: "mock_access_token", refresh: "mock_refresh_token" },
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    fireEvent.click(submitButton);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/home"));  
  });

  it("shows an alert on login failure", async () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    (apiClient.post as apiClientMock).mockRejectedValue(new Error("Login failed"));

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "wronguser" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrongpassword" } });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => expect(alertMock).toHaveBeenCalledWith(expect.any(Error)));

    alertMock.mockRestore();
  });
it("shows browser validation error when username and password are empty", async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
  
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });
  
    fireEvent.click(submitButton);
  
    await waitFor(() => {
      expect(usernameInput.checkValidity()).toBe(false); // Username should be invalid
      expect(passwordInput.checkValidity()).toBe(false); // Password should be invalid
    });
  });
  
  
});