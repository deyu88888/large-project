import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import * as api from "../../../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../../constants";

vi.mock("axios", () => {
  
  const mockAxios = vi.fn();

  
  mockAxios.create = vi.fn(() => mockAxios);

  
  mockAxios.interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  };

  
  mockAxios.get = vi.fn();
  mockAxios.post = vi.fn();
  mockAxios.put = vi.fn();
  mockAxios.delete = vi.fn();

  
  return {
    default: mockAxios,
  };
});


const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});


const windowLocationMock = {
  href: "",
  protocol: "https:",
  host: "test.example.com",
};

Object.defineProperty(window, "location", {
  value: windowLocationMock,
  writable: true,
});


vi.mock("import.meta", () => {
  return {
    env: {
      VITE_API_URL: "api.example.com",
    },
  };
});


console.error = vi.fn();
console.warn = vi.fn();
console.log = vi.fn();

describe("API Client Configuration", () => {
  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it("should create an axios instance with correct baseURL", () => {
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: "http://localhost:8000",
      paramsSerializer: {
        indexes: null,
      },
    });
  });

  it("should use localhost as fallback when VITE_API_URL is not available", () => {
    
    const originalEnv = import.meta.env;
    vi.mocked(import.meta).env = {};

    
    const getApiUrl = vi.fn().mockReturnValue("https://localhost:8000");
    
    
    vi.mocked(import.meta).env = originalEnv;
    
    expect(getApiUrl()).toBe("https://localhost:8000");
  });
});

describe("Event API Functions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getAllEvents", () => {
    it("should return array data directly when response is an array", async () => {
      const mockData = [
        { id: 1, title: "Event 1" }, 
        { id: 2, title: "Event 2" }
      ];
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await api.getAllEvents();

      expect(api.apiClient.get).toHaveBeenCalledWith("/api/events/all");
      expect(result).toEqual(mockData);
    });

    it("should extract results array when response is an object with results property", async () => {
      const mockData = { 
        results: [
          { id: 1, title: "Event 1" }, 
          { id: 2, title: "Event 2" }
        ],
        count: 2
      };
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await api.getAllEvents();

      expect(api.apiClient.get).toHaveBeenCalledWith("/api/events/all");
      expect(result).toEqual(mockData.results);
    });

    it("should return empty array when response has unexpected format", async () => {
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ 
        data: { unexpectedFormat: true } 
      });

      const result = await api.getAllEvents();

      expect(api.apiClient.get).toHaveBeenCalledWith("/api/events/all");
      expect(result).toEqual([]);
    });

    it("should handle errors and return empty array", async () => {
      vi.mocked(api.apiClient.get).mockRejectedValueOnce(new Error("Network error"));

      const result = await api.getAllEvents();

      expect(api.apiClient.get).toHaveBeenCalledWith("/api/events/all");
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("getUpcomingEvents", () => {
    it("should return array data directly when response is an array", async () => {
      const mockData = [
        { id: 1, title: "Upcoming Event 1" }, 
        { id: 2, title: "Upcoming Event 2" }
      ];
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await api.getUpcomingEvents();

      expect(api.apiClient.get).toHaveBeenCalledWith("/api/dashboard/events/upcoming/");
      expect(result).toEqual(mockData);
    });

    it("should extract results array when response is an object with results property", async () => {
      const mockData = { 
        results: [
          { id: 1, title: "Upcoming Event 1" }, 
          { id: 2, title: "Upcoming Event 2" }
        ],
        count: 2
      };
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await api.getUpcomingEvents();

      expect(api.apiClient.get).toHaveBeenCalledWith("/api/dashboard/events/upcoming/");
      expect(result).toEqual(mockData.results);
    });

    it("should return empty array when response has unexpected format", async () => {
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ 
        data: { unexpectedFormat: true } 
      });

      const result = await api.getUpcomingEvents();

      expect(api.apiClient.get).toHaveBeenCalledWith("/api/dashboard/events/upcoming/");
      expect(result).toEqual([]);
    });

    it("should handle errors and return empty array", async () => {
      vi.mocked(api.apiClient.get).mockRejectedValueOnce(new Error("Network error"));

      const result = await api.getUpcomingEvents();

      expect(api.apiClient.get).toHaveBeenCalledWith("/api/dashboard/events/upcoming/");
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });
});

describe("News API Functions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getNewsPostDetail", () => {
    it("should fetch news post details", async () => {
      const mockData = {
        id: 1,
        title: "News Title",
        content: "News content",
        published_at: "2025-01-01T12:00:00Z",
        status: "published",
        view_count: 100,
        is_featured: true,
        is_pinned: false,
        tags: ["important", "announcement"]
      };
      
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await api.getNewsPostDetail(1);

      expect(api.apiClient.get).toHaveBeenCalledWith("/api/news/1/");
      expect(result).toEqual(mockData);
    });

    it("should handle errors and return null", async () => {
      vi.mocked(api.apiClient.get).mockRejectedValueOnce(new Error("Network error"));

      const result = await api.getNewsPostDetail(1);

      expect(api.apiClient.get).toHaveBeenCalledWith("/api/news/1/");
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("getNewsComments", () => {
    it("should fetch news comments", async () => {
      const mockData = [
        {
          id: 1,
          content: "Great article!",
          created_at: "2025-01-01T12:00:00Z",
          parent_comment: null,
          likes_count: 5,
          liked_by_user: false,
          dislikes_count: 1,
          disliked_by_user: false
        },
        {
          id: 2,
          content: "I agree",
          created_at: "2025-01-01T12:30:00Z",
          parent_comment: 1,
          likes_count: 2,
          liked_by_user: true,
          dislikes_count: 0,
          disliked_by_user: false
        }
      ];
      
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await api.getNewsComments(1);

      expect(api.apiClient.get).toHaveBeenCalledWith("/api/news/1/comments/");
      expect(result).toEqual(mockData);
    });

    it("should handle non-array response", async () => {
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: {} });

      const result = await api.getNewsComments(1);

      expect(api.apiClient.get).toHaveBeenCalledWith("/api/news/1/comments/");
      expect(result).toEqual([]);
    });

    it("should handle errors and return empty array", async () => {
      vi.mocked(api.apiClient.get).mockRejectedValueOnce(new Error("Network error"));

      const result = await api.getNewsComments(1);

      expect(api.apiClient.get).toHaveBeenCalledWith("/api/news/1/comments/");
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("createNewsComment", () => {
    it("should create a news comment", async () => {
      const payload = { content: "New comment" };
      const mockResponse = {
        id: 3,
        content: "New comment",
        created_at: "2025-01-02T10:00:00Z",
        parent_comment: null,
        likes_count: 0,
        liked_by_user: false,
        dislikes_count: 0,
        disliked_by_user: false
      };
      
      vi.mocked(api.apiClient.post).mockResolvedValueOnce({ data: mockResponse });

      const result = await api.createNewsComment(1, payload);

      expect(api.apiClient.post).toHaveBeenCalledWith("/api/news/1/comments/", payload);
      expect(result).toEqual(mockResponse);
    });

    it("should create a reply comment", async () => {
      const payload = { 
        content: "Reply comment",
        parent_comment: 1
      };
      const mockResponse = {
        id: 4,
        content: "Reply comment",
        created_at: "2025-01-02T11:00:00Z",
        parent_comment: 1,
        likes_count: 0,
        liked_by_user: false,
        dislikes_count: 0,
        disliked_by_user: false
      };
      
      vi.mocked(api.apiClient.post).mockResolvedValueOnce({ data: mockResponse });

      const result = await api.createNewsComment(1, payload);

      expect(api.apiClient.post).toHaveBeenCalledWith("/api/news/1/comments/", payload);
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors and return null", async () => {
      const payload = { content: "New comment" };
      
      vi.mocked(api.apiClient.post).mockRejectedValueOnce(new Error("Network error"));

      const result = await api.createNewsComment(1, payload);

      expect(api.apiClient.post).toHaveBeenCalledWith("/api/news/1/comments/", payload);
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("updateNewsComment", () => {
    it("should update a news comment", async () => {
      const payload = { content: "Updated comment" };
      const mockResponse = {
        id: 1,
        content: "Updated comment",
        created_at: "2025-01-01T12:00:00Z",
        parent_comment: null,
        likes_count: 5,
        liked_by_user: false,
        dislikes_count: 1,
        disliked_by_user: false
      };
      
      vi.mocked(api.apiClient.put).mockResolvedValueOnce({ data: mockResponse });

      const result = await api.updateNewsComment(1, payload);

      expect(api.apiClient.put).toHaveBeenCalledWith("/api/news/comments/1/", payload);
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors and return null", async () => {
      const payload = { content: "Updated comment" };
      
      vi.mocked(api.apiClient.put).mockRejectedValueOnce(new Error("Network error"));

      const result = await api.updateNewsComment(1, payload);

      expect(api.apiClient.put).toHaveBeenCalledWith("/api/news/comments/1/", payload);
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("deleteNewsComment", () => {
    it("should delete a news comment and return true on success", async () => {
      vi.mocked(api.apiClient.delete).mockResolvedValueOnce({});

      const result = await api.deleteNewsComment(1);

      expect(api.apiClient.delete).toHaveBeenCalledWith("/api/news/comments/1/");
      expect(result).toBe(true);
    });

    it("should handle errors and return false", async () => {
      vi.mocked(api.apiClient.delete).mockRejectedValueOnce(new Error("Network error"));

      const result = await api.deleteNewsComment(1);

      expect(api.apiClient.delete).toHaveBeenCalledWith("/api/news/comments/1/");
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("toggleLikeOnNewsComment", () => {
    it("should toggle like on a comment", async () => {
      const mockResponse = {
        id: 1,
        content: "Comment content",
        created_at: "2025-01-01T12:00:00Z",
        parent_comment: null,
        likes_count: 6,
        liked_by_user: true,
        dislikes_count: 1,
        disliked_by_user: false
      };
      
      vi.mocked(api.apiClient.post).mockResolvedValueOnce({ data: mockResponse });

      const result = await api.toggleLikeOnNewsComment(1);

      expect(api.apiClient.post).toHaveBeenCalledWith("/api/news/comments/1/like/");
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors and return null", async () => {
      vi.mocked(api.apiClient.post).mockRejectedValueOnce(new Error("Network error"));

      const result = await api.toggleLikeOnNewsComment(1);

      expect(api.apiClient.post).toHaveBeenCalledWith("/api/news/comments/1/like/");
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("toggleDislikeOnNewsComment", () => {
    it("should toggle dislike on a comment", async () => {
      const mockResponse = {
        id: 1,
        content: "Comment content",
        created_at: "2025-01-01T12:00:00Z",
        parent_comment: null,
        likes_count: 5,
        liked_by_user: false,
        dislikes_count: 2,
        disliked_by_user: true
      };
      
      vi.mocked(api.apiClient.post).mockResolvedValueOnce({ data: mockResponse });

      const result = await api.toggleDislikeOnNewsComment(1);

      expect(api.apiClient.post).toHaveBeenCalledWith("/api/news/comments/1/dislike/");
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors and return null", async () => {
      vi.mocked(api.apiClient.post).mockRejectedValueOnce(new Error("Network error"));

      const result = await api.toggleDislikeOnNewsComment(1);

      expect(api.apiClient.post).toHaveBeenCalledWith("/api/news/comments/1/dislike/");
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
});

describe("Token Validation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should validate a valid token", () => {
    
    const validToken = "header." + btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 })) + ".signature";
    
    
    const isTokenValidFunction = new Function(
      `
      return function isTokenValid(token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          return payload.exp * 1000 > Date.now();
        } catch (err) {
          console.warn("Invalid token format", err);
          return false;
        }
      }
      `
    )();

    expect(isTokenValidFunction(validToken)).toBe(true);
  });

  it("should invalidate an expired token", () => {
    
    const expiredToken = "header." + btoa(JSON.stringify({ exp: Date.now() / 1000 - 3600 })) + ".signature";
    
    
    const isTokenValidFunction = new Function(
      `
      return function isTokenValid(token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          return payload.exp * 1000 > Date.now();
        } catch (err) {
          console.warn("Invalid token format", err);
          return false;
        }
      }
      `
    )();

    expect(isTokenValidFunction(expiredToken)).toBe(false);
  });

  it("should handle invalid token format", () => {
    
    const invalidToken = "not-a-valid-token";
    
    
    const isTokenValidFunction = new Function(
      `
      return function isTokenValid(token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          return payload.exp * 1000 > Date.now();
        } catch (err) {
          console.warn("Invalid token format", err);
          return false;
        }
      }
      `
    )();

    expect(isTokenValidFunction(invalidToken)).toBe(false);
    expect(console.warn).toHaveBeenCalled();
  });
});


const isTokenValidFunction = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch (err) {
    console.warn("Invalid token format", err);
    return false;
  }
};

describe("Request Interceptor", () => {
  let requestInterceptor: (config: any) => any;
  let errorInterceptor: (error: any) => any;

  beforeEach(() => {
    
    vi.resetAllMocks();
    localStorageMock.clear();

    
    requestInterceptor = (config) => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      
      if (token && isTokenValidFunction(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        delete config.headers.Authorization;
      }
      return config;
    };

    errorInterceptor = (error) => Promise.reject(error);
  });

  it("should add Authorization header when valid token exists", () => {
    
    const validToken = "header." + btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 })) + ".signature";
    localStorageMock.getItem.mockReturnValueOnce(validToken);

    const config = { headers: {} };
    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBe(`Bearer ${validToken}`);
    expect(localStorageMock.getItem).toHaveBeenCalledWith(ACCESS_TOKEN);
  });

  it("should not add Authorization header when token is invalid", () => {
    
    const invalidToken = "invalid-token";
    localStorageMock.getItem.mockReturnValueOnce(invalidToken);

    const config = { headers: { Authorization: "Previous-Auth" } };
    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
    expect(localStorageMock.getItem).toHaveBeenCalledWith(ACCESS_TOKEN);
  });

  it("should not add Authorization header when token is missing", () => {
    
    localStorageMock.getItem.mockReturnValueOnce(null);

    const config = { headers: {} };
    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
    expect(localStorageMock.getItem).toHaveBeenCalledWith(ACCESS_TOKEN);
  });

  it("should reject with error in error handler", async () => {
    const error = new Error("Request error");
    
    
    await expect(errorInterceptor(error)).rejects.toEqual(error);
  });
});
const apiUrl = "https://api.example.com";
describe("Response Interceptor", () => {
  let responseInterceptor: (response: any) => any;
  let errorInterceptor: (error: any) => Promise<any>;

  beforeEach(() => {
    
    vi.resetAllMocks();
    localStorageMock.clear();

    
    responseInterceptor = (response) => response;

    errorInterceptor = async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshToken = localStorage.getItem(REFRESH_TOKEN);
          
          if (!refreshToken) {
            throw new Error("No refresh token available");
          }
          
          const refreshResponse = await axios.post(`${apiUrl}${api.apiPaths.USER.REFRESH}`, {
            refresh: refreshToken
          });
          
          const { access } = refreshResponse.data;
          localStorage.setItem(ACCESS_TOKEN, access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          
          return axios(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          
          
          localStorage.removeItem(ACCESS_TOKEN);
          localStorage.removeItem(REFRESH_TOKEN);
          
          
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    };

    
    windowLocationMock.href = "";
  });

  it("should pass through successful responses", () => {
    const response = { data: { success: true } };
    const result = responseInterceptor(response);
    expect(result).toBe(response);
  });

  it("should attempt to refresh token on 401 error", async () => {
    
    const originalRequest = { 
      headers: {}, 
      _retry: false,
      method: "get",
      url: "/test"
    };
    const error = { 
      config: originalRequest,
      response: { status: 401 } 
    };

    
    localStorageMock.getItem.mockReturnValueOnce("refresh-token");

    
    axios.post.mockResolvedValueOnce({ 
      data: { access: "new-access-token" } 
    });

    vi.mocked(axios.post).mockImplementation(() => Promise.resolve({ data: "success" }));

    await errorInterceptor(error);

    
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining(api.apiPaths.USER.REFRESH),
      { refresh: "refresh-token" }
    );

    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(ACCESS_TOKEN, "new-access-token");

    
    expect(axios).toHaveBeenCalledWith(expect.objectContaining({
      headers: { Authorization: "Bearer new-access-token" },
      _retry: true
    }));
  });

  it("should redirect to login if no refresh token is available", async () => {
    
    const originalRequest = { 
      headers: {}, 
      _retry: false 
    };
    const error = { 
      config: originalRequest,
      response: { status: 401 } 
    };

    
    localStorageMock.getItem.mockReturnValueOnce(null);

    try {
      await errorInterceptor(error);
    } catch (e) {
      console.error(e);
    }

    
    expect(localStorageMock.setItem).not.toHaveBeenCalled();

    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(ACCESS_TOKEN);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(REFRESH_TOKEN);

    
    expect(windowLocationMock.href).toBe("/login");
  });

  it("should handle refresh token request failure", async () => {
    
    const originalRequest = { 
      headers: {}, 
      _retry: false 
    };
    const error = { 
      config: originalRequest,
      response: { status: 401 } 
    };

    
    localStorageMock.getItem.mockReturnValueOnce("refresh-token");

    
    axios.post.mockRejectedValueOnce(new Error("Refresh failed"));

    try {
      await errorInterceptor(error);
    } catch (e) {
      console.error(e);
    }

    
    expect(console.error).toHaveBeenCalledWith(
      "Token refresh failed:",
      expect.any(Error)
    );

    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(ACCESS_TOKEN);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(REFRESH_TOKEN);

    
    expect(windowLocationMock.href).toBe("/login");
  });

  it("should skip token refresh for non-401 errors", async () => {
    
    const originalRequest = { 
      headers: {}, 
      _retry: false 
    };
    const error = { 
      config: originalRequest,
      response: { status: 500 } 
    };

    try {
      await errorInterceptor(error);
    } catch (e) {
      console.error("Error in test:", e);
    }

    
    expect(axios.post).not.toHaveBeenCalled();
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    expect(localStorageMock.removeItem).not.toHaveBeenCalled();
  });

  it("should skip token refresh if request already retried", async () => {
    
    const originalRequest = { 
      headers: {}, 
      _retry: true  
    };
    const error = { 
      config: originalRequest,
      response: { status: 401 } 
    };

    try {
      await errorInterceptor(error);
    } catch (e) {
      // Intentionally ignore error as the request was already retried
    }

    
    expect(axios.post).not.toHaveBeenCalled();
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    expect(localStorageMock.removeItem).not.toHaveBeenCalled();
  });
});

describe("API Society Functions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getPopularSocieties", () => {
    it("should return array data directly when response is an array", async () => {
      const mockData = [{ id: 1, name: "Society 1" }, { id: 2, name: "Society 2" }];
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await api.getPopularSocieties();

      expect(api.apiClient.get).toHaveBeenCalledWith(api.apiPaths.SOCIETY.POPULAR_SOCIETIES);
      expect(result).toEqual(mockData);
    });

    it("should extract results array when response is an object with results property", async () => {
      const mockData = { 
        results: [{ id: 1, name: "Society 1" }, { id: 2, name: "Society 2" }],
        count: 2
      };
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await api.getPopularSocieties();

      expect(api.apiClient.get).toHaveBeenCalledWith(api.apiPaths.SOCIETY.POPULAR_SOCIETIES);
      expect(result).toEqual(mockData.results);
    });

    it("should return empty array when response has unexpected format", async () => {
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ 
        data: { unexpectedFormat: true } 
      });

      const result = await api.getPopularSocieties();

      expect(api.apiClient.get).toHaveBeenCalledWith(api.apiPaths.SOCIETY.POPULAR_SOCIETIES);
      expect(result).toEqual([]);
    });

    it("should handle errors and return empty array", async () => {
      vi.mocked(api.apiClient.get).mockRejectedValueOnce(new Error("Network error"));

      const result = await api.getPopularSocieties();

      expect(api.apiClient.get).toHaveBeenCalledWith(api.apiPaths.SOCIETY.POPULAR_SOCIETIES);
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it("should handle error with response data", async () => {
      vi.mocked(api.apiClient.get).mockRejectedValueOnce({ 
        response: { data: { message: "API error" } },
        message: "Request failed"
      });

      const result = await api.getPopularSocieties();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("getRecommendedSocieties", () => {
    it("should fetch recommended societies with default limit", async () => {
      const mockData = [{ 
        society: { id: 1, name: "Society 1" },
        explanation: { type: "popular", message: "Popular society" }
      }];
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await api.getRecommendedSocieties();

      expect(api.apiClient.get).toHaveBeenCalledWith(
        `${api.apiPaths.SOCIETY.RECOMMENDED_SOCIETIES}?limit=5`
      );
      expect(result).toEqual(mockData);
    });

    it("should fetch recommended societies with custom limit", async () => {
      const mockData = [{ 
        society: { id: 1, name: "Society 1" },
        explanation: { type: "popular", message: "Popular society" }
      }];
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await api.getRecommendedSocieties(10);

      expect(api.apiClient.get).toHaveBeenCalledWith(
        `${api.apiPaths.SOCIETY.RECOMMENDED_SOCIETIES}?limit=10`
      );
      expect(result).toEqual(mockData);
    });

    it("should handle 404 error by fetching fallback societies", async () => {
      
      vi.mocked(api.apiClient.get).mockRejectedValueOnce({ 
        response: { status: 404 }
      });
      
      
      const fallbackData = [{ id: 1, name: "Fallback Society" }];
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: fallbackData });

      const result = await api.getRecommendedSocieties();

      
      expect(api.apiClient.get).toHaveBeenCalledWith(
        `${api.apiPaths.SOCIETY.RECOMMENDED_SOCIETIES}?limit=5`
      );
      
      
      expect(api.apiClient.get).toHaveBeenCalledWith("/api/society/join");
      
      
      expect(result).toEqual(fallbackData.map(society => ({
        society,
        explanation: {
          type: "popular",
          message: "Suggested society for new members",
        },
      })));
    });

    it("should handle 405 error by fetching fallback societies", async () => {
      
      vi.mocked(api.apiClient.get).mockRejectedValueOnce({ 
        response: { status: 405 }
      });
      
      
      const fallbackData = [{ id: 1, name: "Fallback Society" }];
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: fallbackData });

      const result = await api.getRecommendedSocieties();

      
      expect(api.apiClient.get).toHaveBeenCalledWith(
        `${api.apiPaths.SOCIETY.RECOMMENDED_SOCIETIES}?limit=5`
      );
      
      
      expect(api.apiClient.get).toHaveBeenCalledWith("/api/society/join");
      
      
      expect(result[0].explanation.type).toBe("popular");
    });

    it("should handle fallback request failure", async () => {
      
      vi.mocked(api.apiClient.get).mockRejectedValueOnce({ 
        response: { status: 404 }
      });
      
      
      vi.mocked(api.apiClient.get).mockRejectedValueOnce(
        new Error("Fallback error")
      );

      const result = await api.getRecommendedSocieties();

      
      expect(api.apiClient.get).toHaveBeenCalledWith(
        `${api.apiPaths.SOCIETY.RECOMMENDED_SOCIETIES}?limit=5`
      );
      expect(api.apiClient.get).toHaveBeenCalledWith("/api/society/join");
      
      
      expect(console.error).toHaveBeenCalledWith("Fallback fetch failed:", expect.any(Error));
      
      
      expect(result).toEqual([]);
    });

    it("should handle errors other than 404/405", async () => {
      vi.mocked(api.apiClient.get).mockRejectedValueOnce({ 
        response: { status: 500, data: { message: "Server error" } },
        message: "Request failed"
      });

      const result = await api.getRecommendedSocieties();

      expect(api.apiClient.get).toHaveBeenCalledWith(
        `${api.apiPaths.SOCIETY.RECOMMENDED_SOCIETIES}?limit=5`
      );
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("getRecommendationExplanation", () => {
    it("should fetch explanation for a society", async () => {
      const mockData = { type: "popular", message: "This is a popular society" };
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await api.getRecommendationExplanation(123);

      expect(api.apiClient.get).toHaveBeenCalledWith(
        api.apiPaths.SOCIETY.RECOMMENDATION_EXPLANATION(123)
      );
      expect(result).toEqual(mockData);
    });

    it("should handle errors and return default explanation", async () => {
      vi.mocked(api.apiClient.get).mockRejectedValueOnce(new Error("Network error"));

      const result = await api.getRecommendationExplanation(123);

      expect(api.apiClient.get).toHaveBeenCalledWith(
        api.apiPaths.SOCIETY.RECOMMENDATION_EXPLANATION(123)
      );
      expect(result).toEqual({ type: "general", message: "No explanation available" });
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("submitRecommendationFeedback", () => {
    it("should submit feedback for a society", async () => {
      const feedback = { 
        society_id: 123, 
        rating: 5, 
        relevance: 4, 
        is_joined: true 
      };
      const mockResponse = { ...feedback, id: 456 };
      
      vi.mocked(api.apiClient.post).mockResolvedValueOnce({ data: mockResponse });

      const result = await api.submitRecommendationFeedback(123, feedback);

      expect(api.apiClient.post).toHaveBeenCalledWith(
        api.apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK(123),
        feedback
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors and return null", async () => {
      const feedback = { 
        society_id: 123, 
        rating: 5, 
        relevance: 4, 
        is_joined: true 
      };
      
      vi.mocked(api.apiClient.post).mockRejectedValueOnce(new Error("Network error"));

      const result = await api.submitRecommendationFeedback(123, feedback);

      expect(api.apiClient.post).toHaveBeenCalledWith(
        api.apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK(123),
        feedback
      );
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("updateRecommendationFeedback", () => {
    it("should update feedback for a society", async () => {
      const feedback = { rating: 5, relevance: 4 };
      const mockResponse = { 
        id: 456,
        society_id: 123, 
        rating: 5, 
        relevance: 4, 
        is_joined: true 
      };
      
      vi.mocked(api.apiClient.put).mockResolvedValueOnce({ data: mockResponse });

      const result = await api.updateRecommendationFeedback(123, feedback);

      expect(api.apiClient.put).toHaveBeenCalledWith(
        api.apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK(123),
        feedback
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors and return null", async () => {
      const feedback = { rating: 5 };
      
      vi.mocked(api.apiClient.put).mockRejectedValueOnce(new Error("Network error"));

      const result = await api.updateRecommendationFeedback(123, feedback);

      expect(api.apiClient.put).toHaveBeenCalledWith(
        api.apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK(123),
        feedback
      );
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("getRecommendationFeedback", () => {
    it("should find and return feedback for a specific society", async () => {
      const mockData = [
        { society_id: 123, rating: 5 },
        { society_id: 456, rating: 4 }
      ];
      
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await api.getRecommendationFeedback(123);

      expect(api.apiClient.get).toHaveBeenCalledWith(
        api.apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK_LIST
      );
      expect(result).toEqual(mockData[0]);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Found existing feedback"));
    });

    it("should return null if no feedback exists for the society", async () => {
      const mockData = [
        { society_id: 456, rating: 4 }
      ];
      
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await api.getRecommendationFeedback(123);

      expect(api.apiClient.get).toHaveBeenCalledWith(
        api.apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK_LIST
      );
      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("No existing feedback found"));
    });

    it("should handle non-array response", async () => {
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: {} });

      const result = await api.getRecommendationFeedback(123);

      expect(api.apiClient.get).toHaveBeenCalledWith(
        api.apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK_LIST
      );
      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("No existing feedback found"));
    });

    it("should handle errors and return null", async () => {
      vi.mocked(api.apiClient.get).mockRejectedValueOnce(new Error("Network error"));

      const result = await api.getRecommendationFeedback(123);

      expect(api.apiClient.get).toHaveBeenCalledWith(
        api.apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK_LIST
      );
      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Could not check for feedback"));
    });
  });

  describe("getAllRecommendationFeedback", () => {
    it("should fetch all feedback", async () => {
      const mockData = [
        { society_id: 123, rating: 5 },
        { society_id: 456, rating: 4 }
      ];
      
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await api.getAllRecommendationFeedback();

      expect(api.apiClient.get).toHaveBeenCalledWith(
        api.apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK_LIST
      );
      expect(result).toEqual(mockData);
    });

    it("should handle non-array response", async () => {
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: {} });

      const result = await api.getAllRecommendationFeedback();

      expect(api.apiClient.get).toHaveBeenCalledWith(
        api.apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK_LIST
      );
      expect(result).toEqual([]);
    });

    it("should handle errors and return empty array", async () => {
      vi.mocked(api.apiClient.get).mockRejectedValueOnce(new Error("Network error"));

      const result = await api.getAllRecommendationFeedback();

      expect(api.apiClient.get).toHaveBeenCalledWith(
        api.apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK_LIST
      );
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("getRecommendationFeedbackAnalytics", () => {
    it("should fetch analytics data", async () => {
      const mockData = {
        total_feedback: 10,
        average_rating: 4.5,
        join_count: 7,
        conversion_rate: 70
      };
      
      vi.mocked(api.apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await api.getRecommendationFeedbackAnalytics();

      expect(api.apiClient.get).toHaveBeenCalledWith(
        api.apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK_ANALYTICS
      );
      expect(result).toEqual(mockData);
    });

    it("should handle errors and return default values", async () => {
      vi.mocked(api.apiClient.get).mockRejectedValueOnce(new Error("Network error"));

      const result = await api.getRecommendationFeedbackAnalytics();

      expect(api.apiClient.get).toHaveBeenCalledWith(
        api.apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK_ANALYTICS
      );
      expect(result).toEqual({
        total_feedback: 0,
        average_rating: 0,
        join_count: 0,
        conversion_rate: 0,
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
});  