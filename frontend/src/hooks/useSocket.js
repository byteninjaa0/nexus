import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore.js";

const url = import.meta.env.VITE_SOCKET_URL ?? "";

export function useSocket() {
  const token = useAuthStore((s) => s.accessToken);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      setSocket((s) => {
        s?.disconnect();
        return null;
      });
      return;
    }
    const s = io(url || undefined, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
    });
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [token]);

  return socket;
}
