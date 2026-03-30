import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./errors/errorHandler";
import { BoardService } from "./services/boardService";
import { createBoardRouter } from "./routes/boards";

export const createApp = (boardService: BoardService) => {
  const app = express();

  app.use(
    cors({
      // Browser clients can call the REST API directly and connect over Socket.IO from these origins.
      origin: env.corsOrigins,
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Routes stay thin; the service layer owns the actual board business rules.
  app.use("/api/boards", createBoardRouter(boardService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
