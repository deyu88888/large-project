import { describe, it, vi, beforeEach, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { useWebSocketManager, WebSocketProvider, CONNECTION_STATES } from "../useWebSocketManager";

vi.mock("../socketConnectionManager", () => {
  const connectMock = vi.fn();
  const disconnectMock = vi.fn();
  const subscribeMock = vi.fn(() => vi.fn());
  const isChannelSupportedMock = vi.fn(() => true);
  const getDebugInfoMock = vi.fn(() => ({ test: true }));
  const getStatusMock = vi.fn(() => CONNECTION_STATES.CONNECTED);
  const getSupportedChannelsMock = vi.fn(() => ["channel-1", "channel-2"]);
  const onStatusChangeMock = vi.fn((cb) => {
    cb(CONNECTION_STATES.AUTHENTICATING);
    return vi.fn();
  });
  const onChannelListChangeMock = vi.fn((cb) => {
    cb(["channel-3"]);
    return vi.fn();
  });

  return {
    default: {
      connect: connectMock,
      disconnect: disconnectMock,
      subscribe: subscribeMock,
      isChannelSupported: isChannelSupportedMock,
      getDebugInfo: getDebugInfoMock,
      getStatus: getStatusMock,
      getSupportedChannels: getSupportedChannelsMock,
      onStatusChange: onStatusChangeMock,
      onChannelListChange: onChannelListChangeMock,
    },
    CONNECTION_STATES: {
      CONNECTING: "connecting",
      CONNECTED: "connected",
      AUTHENTICATING: "authenticating",
      AUTHENTICATED: "authenticated",
      DISCONNECTED: "disconnected",
    },
  };
});

const TestComponent = () => {
  const {
    status,
    connect,
    disconnect,
    subscribe,
    isChannelSupported,
    supportedChannels,
    debugInfo,
  } = useWebSocketManager();

  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="channels">{supportedChannels.join(",")}</div>
      <div data-testid="debug">{JSON.stringify(debugInfo())}</div>
      <button onClick={connect}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
      <button onClick={() => subscribe("channel-1", vi.fn())}>Subscribe</button>
      <button onClick={() => isChannelSupported("channel-1")}>Is Supported</button>
    </div>
  );
};

describe("WebSocketProvider with useWebSocketManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should provide correct context values and allow interaction", () => {
    render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );

    expect(screen.getByTestId("status").textContent).toBe("authenticating");
    expect(screen.getByTestId("channels").textContent).toBe("channel-3");
    expect(screen.getByTestId("debug").textContent).toContain('"test":true');

    screen.getByText("Connect").click();
    screen.getByText("Disconnect").click();
    screen.getByText("Subscribe").click();
    screen.getByText("Is Supported").click();

  });

  it("should throw if useWebSocketManager is used outside of WebSocketProvider", () => {
    const BreakingComponent = () => {
      useWebSocketManager();
      return null;
    };

    expect(() => render(<BreakingComponent />)).toThrow(
      /useWebSocketManager must be used within a WebSocketProvider/
    );
  });
});
