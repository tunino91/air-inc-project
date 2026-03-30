import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { createApp } from "./app";
import { env } from "./config/env";
import { Database } from "./db/pool";
import { runMigrations } from "./db/runMigrations";
import { BoardService } from "./services/boardService";

const start = async () => {
  const database = new Database();
  // Run schema setup on boot so a fresh environment can start without a separate manual step.
  await runMigrations(database.getPool());
  let io: SocketIOServer | null = null;
  const boardService = new BoardService(database, {
    emit: (event, payload) => {
      // The current challenge version uses a single global broadcast channel.
      io?.emit(event, payload);
    },
  });
  const app = createApp(boardService);
  const server = http.createServer(app);

  io = new SocketIOServer(server, {
    cors: {
      origin: env.corsOrigins,
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // No socket auth or room scoping yet; every connected client receives global board events.
    console.log(`Socket connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  server.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
