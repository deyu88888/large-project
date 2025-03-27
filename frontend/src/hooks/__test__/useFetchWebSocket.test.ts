import { describe, it, vi, beforeEach, afterEach, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFetchWebSocket, failedWebSocketRoutes } from "../../hooks/useFetchWebSocket";
import { ACCESS_TOKEN } from "../../constants";

vi.mock("../../hooks/useWebSocketManager", () => {
  const subscribeMock = vi.fn(() => vi.fn()); // Unsubscribe function

  return {
    useWebSocketManager: () => ({
      status: "AUTHENTICATED",
      subscribe: subscribeMock,
    }),
    CONNECTION_STATES: {
      AUTHENTICATED: "AUTHENTICATED",
    },
    __test: {
      subscribeMock,
    },
  };
});

vi.mock("../../utils/websocket", () => ({
  getWebSocketUrl: () => "ws://localhost/ws/test/",
}));

describe("useFetchWebSocket", () => {
  const mockFetchData = vi.fn().mockResolvedValue([{ id: 1, name: "Item 1" }]);
  const mockSetItem = vi.spyOn(window.localStorage.__proto__, "setItem");
  const mockGetItem = vi.spyOn(window.localStorage.__proto__, "getItem");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    window.localStorage.clear();
    failedWebSocketRoutes.clear();

    mockGetItem.mockImplementation((key: string) => {
      if (key === ACCESS_TOKEN) return "test-token";
      if (key === "useWebSockets") return "true";
      return null;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should fetch data and return it via state", async () => {
    const { result } = renderHook(() =>
      useFetchWebSocket(mockFetchData, "/test-channel")
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockFetchData).toHaveBeenCalled();
    expect(result.current).toEqual([{ id: 1, name: "Item 1" }]);
  });

  it("should fallback to polling if WebSockets are disabled in localStorage", async () => {
    mockGetItem.mockImplementation((key: string) => {
      if (key === "useWebSockets") return "false";
      return null;
    });

    const { result, unmount } = renderHook(() =>
      useFetchWebSocket(mockFetchData, "/fallback-channel")
    );

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockFetchData).toHaveBeenCalledTimes(2); // initial + one poll
    unmount();
  });

  it("should skip WebSocket if route previously failed", async () => {
    failedWebSocketRoutes.add("/test-failed");

    const { result } = renderHook(() =>
      useFetchWebSocket(mockFetchData, "/test-failed")
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockFetchData).toHaveBeenCalled();
    expect(result.current).toEqual([{ id: 1, name: "Item 1" }]);
  });

  it("should use new WebSocketManager if available", async () => {
    const { __test } = await import("../../hooks/useWebSocketManager");
    const { subscribeMock } = __test;

    const { unmount } = renderHook(() =>
      useFetchWebSocket(mockFetchData, "/new-manager")
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(subscribeMock).toHaveBeenCalled();
    unmount();
  });
});
