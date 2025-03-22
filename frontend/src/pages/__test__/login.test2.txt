import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { vi } from "vitest";
import LoginPage, { ACCESS_TOKEN, REFRESH_TOKEN } from "../login";
import { apiClient } from "../../api";
import * as router from "react-router-dom";

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

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

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
    
    expect(screen.getByTestId("login-heading")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByTestId("login-button")).toBeInTheDocument();
    expect(screen.getByText(/Need to sign up\?/)).toBeInTheDocument();
    expect(screen.getByText("Please register.")).toBeInTheDocument();
  });

  it("allows typing in the username and password fields", async () => {
    renderLoginPage();
    
    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    
    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
    });
    
    expect(usernameInput).toHaveValue("testuser");
    expect(passwordInput).toHaveValue("password123");
  });

  it("toggles password visibility when the visibility icon is clicked", async () => {
    renderLoginPage();
    
    const passwordInput = screen.getByLabelText("Password");
    
    expect(passwordInput).toHaveAttribute("type", "password");
    
    await act(async () => {
      const visibilityButton = screen.getByRole("button", { name: "" });
      fireEvent.click(visibilityButton);
    });
    
    expect(passwordInput).toHaveAttribute("type", "text");
    
    await act(async () => {
      const visibilityButton = screen.getByRole("button", { name: "" });
      fireEvent.click(visibilityButton);
    });
    
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
    const loginButton = screen.getByTestId("login-button");
    
    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
    });
    
    await act(async () => {
      fireEvent.click(loginButton);
    });
    
    expect(apiClient.post).toHaveBeenCalledWith("/api/user/login", {
      username: "testuser",
      password: "password123"
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(ACCESS_TOKEN, "mock-access-token");
    expect(localStorageMock.setItem).toHaveBeenCalledWith(REFRESH_TOKEN, "mock-refresh-token");
    
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("shows loading state while submitting the form", async () => {
    let resolvePromise;
    
    apiClient.post.mockImplementationOnce(() => 
      new Promise(resolve => {
        resolvePromise = () => resolve({ data: { access: "token", refresh: "token" } });
      })
    );
    
    renderLoginPage();
    
    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const loginButton = screen.getByTestId("login-button");
    
    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
    });
    
    await act(async () => {
      fireEvent.click(loginButton);
    });
    
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    
    await act(async () => {
      resolvePromise();
    });
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled();
    });
  });

  it("handles API errors during login", async () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    
    const errorMessage = "Invalid credentials";
    apiClient.post.mockRejectedValueOnce(errorMessage);
    
    renderLoginPage();
    
    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const loginButton = screen.getByTestId("login-button");
    
    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
    });
    
    await act(async () => {
      fireEvent.click(loginButton);
    });
    
    expect(alertMock).toHaveBeenCalledWith(errorMessage);
    
    expect(mockNavigate).not.toHaveBeenCalled();
    
    alertMock.mockRestore();
  });

  it("has a register link that points to the register page", () => {
    renderLoginPage();
    
    const registerLink = screen.getByText("Please register.");
    expect(registerLink).toHaveAttribute("href", "/register");
  });
});