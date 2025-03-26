import { fetchPendingRequests } from "../utils";
import { apiClient } from "../../../api";
import { vi, describe, it, expect } from "vitest";
vi.mock("../../../api", () => ({
    apiClient: {
        get: vi.fn().mockResolvedValue({}),
    },
}));
describe("fetchPendingRequests", () => {
    it("should fetch pending requests and return data", async () => {
        const mockData = [{ id: 1, name: "Test Request" }];
        apiClient.get.mockResolvedValueOnce({ data: mockData });
        const result = await fetchPendingRequests("/test-path");
        expect(apiClient.get).toHaveBeenCalledWith("/test-path");
        expect(result).toEqual(mockData);
    });
    it("should log an error when fetching fails", async () => {
        console.error = vi.fn();
        const mockError = new Error("Network Error");
        apiClient.get.mockRejectedValueOnce(mockError);
        const result = await fetchPendingRequests("/error-path");
        expect(apiClient.get).toHaveBeenCalledWith("/error-path");
        expect(console.error).toHaveBeenCalledWith("Error fetching pending requests from /error-path:", mockError);
        expect(result).toBeUndefined();
    });
});
