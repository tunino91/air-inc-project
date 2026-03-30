import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // REST calls use a Next.js rewrite, but the browser connects to Socket.IO directly.
    const socketUrl =
      process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";
    const socketOptions = {
      path: "/socket.io",
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket", "polling"],
      withCredentials: true,
    };
    const nextSocket = io(socketUrl, socketOptions);

    setSocket(nextSocket);

    nextSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return () => {
      // Each hook consumer gets a clean connection lifecycle.
      nextSocket.disconnect();
    };
  }, []);

  return socket;
};
