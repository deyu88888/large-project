import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { vi } from "vitest";
import LoginPage from "../login";
import { apiClient } from "../../api";
import * as router from "react-router-dom";

// Mock dependencies
vi.mock("../../api", () => ({
  apiClient: {
    post: vi.fn()
  },
  apiPaths: {
    USER: {
      LOGIN: "/api/user/login"
    }
  }
}));

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    })
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("LoginPage Component", () => {
  const mockTheme = createTheme({
    palette: {
      mode: "light",
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  const renderLoginPage = () => {
    return render(
      <ThemeProvider theme={mockTheme}>
        <LoginPage />
      </ThemeProvider>
    );
  };

  it("renders the login form correctly", () => {
    renderLoginPage();
    
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByText(/Need to sign up\?/)).toBeInTheDocument();
    expect(screen.getByText("Please register.")).toBeInTheDocument();
  });

  it("allows typing in the username and password fields", () => {
    renderLoginPage();
    
    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    
    expect(usernameInput).toHaveValue("testuser");
    expect(passwordInput).toHaveValue("password123");
  });

  it("toggles password visibility when the visibility icon is clicked", () => {
    renderLoginPage();
    
    const passwordInput = screen.getByLabelText("Password");
    
    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute("type", "password");
    
    // Click the visibility toggle button
    const visibilityButton = screen.getByRole("button", { name: "" });
    fireEvent.click(visibilityButton);
    
    // Password should now be visible
    expect(passwordInput).toHaveAttribute("type", "text");
    
    // Click again to hide
    fireEvent.click(visibilityButton);
    
    // Password should be hidden again
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("submits the form with correct credentials and navigates on success", async () => {
    const mockTokens = {
      access: "mock-access-token",
      refresh: "mock-refresh-token"
    };
    
    apiClient.post.mockResolvedValueOnce({ data: mockTokens });
    
    renderLoginPage();
    
    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const loginButton = screen.getByRole("button", { name: "Login" });
    
    // Fill the form
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    
    // Submit the form
    await act(async () => {
      fireEvent.click(loginButton);
    });
    
    // Check API was called with correct data
    expect(apiClient.post).toHaveBeenCalledWith("/api/user/login", {
      username: "testuser",
      password: "password123"
    });
    
    // Check tokens were saved to localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith("ACCESS_TOKEN", "mock-access-token");
    expect(localStorageMock.setItem).toHaveBeenCalledWith("REFRESH_TOKEN", "mock-refresh-token");
    
    // Check navigation happened
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("shows loading state while submitting the form", async () => {
    // Delay the API response to show loading state
    apiClient.post.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ data: { access: "token", refresh: "token" } }), 100)
      )
    );
    
    renderLoginPage();
    
    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const loginButton = screen.getByRole("button", { name: "Login" });
    
    // Fill the form
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    
    // Submit the form
    fireEvent.click(loginButton);
    
    // Loading indicator should appear
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    
    // Wait for API call to resolve
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled();
    });
  });

  it("handles API errors during login", async () => {
    // Mock the window.alert
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    
    // Mock API to reject
    const errorMessage = "Invalid credentials";
    apiClient.post.mockRejectedValueOnce(errorMessage);
    
    renderLoginPage();
    
    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const loginButton = screen.getByRole("button", { name: "Login" });
    
    // Fill the form
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
    
    // Submit the form
    await act(async () => {
      fireEvent.click(loginButton);
    });
    
    // Check alert was shown with error message
    expect(alertMock).toHaveBeenCalledWith(errorMessage);
    
    // Navigation should not happen
    expect(mockNavigate).not.toHaveBeenCalled();
    
    // Cleanup
    alertMock.mockRestore();
  });

  it("has a register link that points to the register page", () => {
    renderLoginPage();
    
    const registerLink = screen.getByText("Please register.");
    expect(registerLink).toHaveAttribute("href", "/register");
  });
});