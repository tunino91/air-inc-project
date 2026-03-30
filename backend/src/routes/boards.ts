import { NextFunction, Router } from "express";
import { BoardService } from "../services/boardService";

const parseNullableParentId = (parentId: unknown) => {
  if (parentId === undefined || parentId === null || parentId === "") {
    return null;
  }

  if (typeof parentId !== "string") {
    return Symbol("invalid");
  }

  return parentId;
};

export const createBoardRouter = (boardService: BoardService) => {
  const router = Router();

  router.get("/tree", async (_req, res, next: NextFunction) => {
    try {
      // Returns the full hierarchy as a nested tree for the current challenge UI.
      const boards = await boardService.getBoardTree();
      res.json({ boards });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next: NextFunction) => {
    try {
      // Route-level validation only checks request shape; deeper business rules live in the service layer.
      if (typeof req.body?.name !== "string") {
        res.status(400).json({
          error: {
            code: "INVALID_NAME",
            message: "Board name must be a string.",
          },
        });
        return;
      }

      const parentId = parseNullableParentId(req.body?.parentId);
      if (typeof parentId === "symbol") {
        res.status(400).json({
          error: {
            code: "INVALID_PARENT_ID",
            message: "Parent id must be a string or null.",
          },
        });
        return;
      }

      const board = await boardService.createBoard({
        name: req.body.name,
        parentId,
      });
      res.status(201).json({ board });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:id/move", async (req, res, next: NextFunction) => {
    try {
      const parentId = parseNullableParentId(req.body?.parentId);
      if (typeof parentId === "symbol") {
        res.status(400).json({
          error: {
            code: "INVALID_PARENT_ID",
            message: "Parent id must be a string or null.",
          },
        });
        return;
      }

      const board = await boardService.moveBoard({
        id: req.params.id,
        parentId,
      });

      res.json({ board });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next: NextFunction) => {
    try {
      const result = await boardService.deleteBoard(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post("/seed", async (req, res, next: NextFunction) => {
    try {
      // The seed endpoint creates a predictable demo hierarchy from constrained inputs.
      if (
        typeof req.body?.projectType !== "string" ||
        typeof req.body?.teamType !== "string" ||
        typeof req.body?.includeArchive !== "boolean"
      ) {
        res.status(400).json({
          error: {
            code: "INVALID_SEED_INPUT",
            message: "Seed input must include projectType, teamType, and includeArchive.",
          },
        });
        return;
      }

      const campaignCount = Number(req.body?.campaignCount);
      if (!Number.isFinite(campaignCount)) {
        res.status(400).json({
          error: {
            code: "INVALID_SEED_INPUT",
            message: "Campaign count must be a valid number.",
          },
        });
        return;
      }

      const result = await boardService.seedBoards({
        projectType: req.body.projectType,
        teamType: req.body.teamType,
        campaignCount,
        includeArchive: req.body.includeArchive,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
