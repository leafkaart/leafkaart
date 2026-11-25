import { io } from "socket.io-client";

export function connectNotifications(token) {
  const backend = new URL(import.meta.env.VITE_BACKEND_URL, window.location.origin);
  return io(backend.origin, {
    auth: { token },
    transports: ["websocket"],
  });
}
