import { fetchPendingDescriptions } from "../fetchPendingDescriptions";
import { apiClient, apiPaths } from "../../../api";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Mock the API client
vi.mock("../../../api", () => ({
  apiClient: {
    get: vi.fn(),
  },
  apiPaths: {
    USER: {
      PENDINGDESCRIPTIONREQUEST: "/api/pending-descriptions"
    }
  }
}));

describe("fetchPendingDescriptions", () => {
  // Setup console spy before each test
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  // Restore console after each test
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch pending descriptions and return data", async () => {
    // Mock data
    const mockData = [{ id: 1, description: "Test Description" }];
    
    // Setup the mock to return our data
    (apiClient.get as vi.Mock).mockResolvedValueOnce({ data: mockData });

    // Call the function
    const result = await fetchPendingDescriptions();
    
    // Assert expectations
    expect(apiClient.get).toHaveBeenCalledWith(apiPaths.USER.PENDINGDESCRIPTIONREQUEST);
    expect(result).toEqual(mockData);
  });

  it("should log an error when fetching fails", async () => {
    // Create mock error
    const mockError = new Error("Network Error");
    
    // Setup the mock to reject with our error
    (apiClient.get as vi.Mock).mockRejectedValueOnce(mockError);

    // Call the function
    const result = await fetchPendingDescriptions();
    
    // Assert expectations
    expect(apiClient.get).toHaveBeenCalledWith(apiPaths.USER.PENDINGDESCRIPTIONREQUEST);
    expect(console.error).toHaveBeenCalledWith("Error fetching pending descriptions:", mockError);
    expect(result).toBeUndefined();
  });
});