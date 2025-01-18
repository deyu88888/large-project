import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import RegisterPage from "../pages/register";
import { apiClient } from "../api";
import "@testing-library/jest-dom";

// Mock the API client
jest.mock("../api", () => ({
  apiPaths: {
    USER: {
      REGISTER: "/api/user/register",
    },
  },
  apiClient: {
    post: jest.fn(),
  },
}));

beforeAll(() => {
  // Mock window.alert
  window.alert = jest.fn();
});

describe("RegisterPage", () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the registration form", () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByText(/Register as a Student/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Major/i)).toBeInTheDocument();
  });

  test("displays validation errors for empty fields", async () => {
    renderWithRouter(<RegisterPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Register/i }));
    });
    await waitFor(() => {
      expect(screen.getByText(/First name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Major is required/i)).toBeInTheDocument();
    });
  });

  test("submits the form with valid data", async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
  
    renderWithRouter(<RegisterPage />);
  
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: "Jane" } });
      fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: "Doe" } });
      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "jane.doe@example.com" } });
      fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: "jane_doe" } });
      fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: "Password123" } });
      fireEvent.change(screen.getByLabelText(/Major/i), { target: { value: "Computer Science" } });
      fireEvent.click(screen.getByRole("button", { name: /Register/i }));
    });
  
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/api/user/register", {
        first_name: "Jane",
        last_name: "Doe",
        email: "jane.doe@example.com",
        username: "jane_doe",
        password: "Password123",
        major: "Computer Science",
      });
    });
  });
  
  test("handles API errors gracefully", async () => {
    // Mock the API call to reject with an email error
    (apiClient.post as jest.Mock).mockRejectedValueOnce({
      response: { data: { email: ["Email already exists."] } },
    });
  
    // Render the component
    renderWithRouter(<RegisterPage />);
  
    // Fill out the form
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: "Jane" } });
      fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: "Doe" } });
      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "existing_email@example.com" } });
      fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: "jane_doe" } });
      fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: "Password123" } });
      fireEvent.change(screen.getByLabelText(/Major/i), { target: { value: "Computer Science" } });
      fireEvent.click(screen.getByRole("button", { name: /Register/i }));
    });
  
    // Debug DOM state
    console.log("After API call:");
    screen.debug();
  
    // Verify the error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });
  
  
});
