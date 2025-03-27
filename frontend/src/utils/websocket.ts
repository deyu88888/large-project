export const getWebSocketUrl = (): string => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = import.meta.env.VITE_API_URL || "localhost:8000";
  return `${protocol}//${host}/ws`;
};

export const getApiUrl = (): string => {
  const protocol = window.location.protocol;
  const host = import.meta.env.VITE_API_URL || "localhost:8000";
  return `${protocol}//${host}`;
};
