import { NextFunction, Request, Response } from "express";
import { AppError } from "./AppError";

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Resource not found.",
    },
  });
};

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof AppError) {
    // Domain errors are already safe and intentional to expose to the client.
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  // Unexpected failures are logged server-side but intentionally hidden behind a generic message.
  console.error(error);

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error.",
    },
  });
};
