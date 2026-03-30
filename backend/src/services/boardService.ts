import { randomUUID } from "crypto";
import { Database } from "../db/pool";
import { AppError } from "../errors/AppError";
import { BoardEventPublisher } from "../events/boardEvents";
import { BoardRepository } from "../repositories/boardRepository";
import {
  BoardNode,
  BoardRecord,
  CreateBoardInput,
  MoveBoardInput,
  SeedTemplateInput,
} from "../types/board";

const MAX_DEPTH = 10;

const normalizeName = (name: string) => name.trim();

const ensureName = (name: string) => {
  const normalized = normalizeName(name);

  if (!normalized) {
    throw new AppError(400, "INVALID_NAME", "Board name cannot be empty.");
  }

  return normalized;
};

const buildTree = (records: BoardRecord[]) => {
  const nodes = new Map<string, BoardNode>();

  for (const record of records) {
    nodes.set(record.id, {
      ...record,
      depth: 0,
      children: [],
    });
  }

  const roots: BoardNode[] = [];

  for (const node of nodes.values()) {
    if (node.parentId) {
      const parent = nodes.get(node.parentId);
      if (parent) {
        parent.children.push(node);
        continue;
      }
    }

    // Any node without a resolvable parent is treated as a root in the response tree.
    roots.push(node);
  }

  const assignDepth = (node: BoardNode, depth: number) => {
    node.depth = depth;
    // Sorting at each level keeps the tree stable and easy to scan in the UI.
    node.children.sort((left, right) => left.name.localeCompare(right.name));
    node.children.forEach((child) => assignDepth(child, depth + 1));
  };

  roots.sort((left, right) => left.name.localeCompare(right.name));
  roots.forEach((root) => assignDepth(root, 1));

  return roots;
};

const createTemplateDefinition = (input: SeedTemplateInput) => {
  const projectLabel = input.projectType.trim() || "Creative";
  const teamLabel = input.teamType.trim() || "Studio";
  // Clamp seed size so generated demo data stays readable and within the challenge depth limit.
  const campaignCount = Math.max(1, Math.min(6, Math.floor(input.campaignCount)));

  return {
    name: `${projectLabel} Workspace`,
    children: [
      {
        name: "Briefs",
        children: [
          { name: `${teamLabel} Intake` },
          { name: "Approved Concepts" },
        ],
      },
      {
        name: "Campaigns",
        children: Array.from({ length: campaignCount }, (_, index) => ({
          name: `${projectLabel} Campaign ${index + 1}`,
          children: [
            { name: "Pre-production" },
            { name: "Production" },
            { name: "Delivery" },
          ],
        })),
      },
      {
        name: "Shared Assets",
        children: [{ name: "Brand Library" }, { name: "Templates" }],
      },
      ...(input.includeArchive
        ? [
            {
              name: "Archive",
              children: [{ name: "Past Campaigns" }],
            },
          ]
        : []),
    ],
  };
};

type TemplateNode = ReturnType<typeof createTemplateDefinition>;

export class BoardService {
  constructor(
    private readonly database: Database,
    private readonly events: BoardEventPublisher
  ) {}

  private getRepository(client?: ReturnType<Database["getPool"]>) {
    return new BoardRepository(client ?? this.database.getPool());
  }

  private async ensureParentDepth(
    repository: BoardRepository,
    parentId: string | null
  ) {
    if (!parentId) {
      // Root boards conceptually sit above depth 1, so parent depth is treated as 0.
      return 0;
    }

    const parent = await repository.findById(parentId);

    if (!parent) {
      throw new AppError(404, "PARENT_NOT_FOUND", "Parent board was not found.");
    }

    const parentDepth = await repository.getBoardDepth(parentId);

    if (parentDepth === null) {
      throw new AppError(404, "PARENT_NOT_FOUND", "Parent board was not found.");
    }

    return parentDepth;
  }

  private async createBoardInternal(
    repository: BoardRepository,
    input: CreateBoardInput
  ) {
    const name = ensureName(input.name);
    const parentId = input.parentId ?? null;
    const parentDepth = await this.ensureParentDepth(repository, parentId);

    // A child may only be created if its resulting depth remains within the hard cap.
    if (parentDepth + 1 > MAX_DEPTH) {
      throw new AppError(
        400,
        "MAX_DEPTH_EXCEEDED",
        `Boards cannot exceed depth ${MAX_DEPTH}.`
      );
    }

    return repository.insertBoard({
      id: randomUUID(),
      name,
      parentId,
    });
  }

  private async createTemplateNodes(
    repository: BoardRepository,
    node: TemplateNode,
    parentId: string | null,
    stats: { count: number }
  ): Promise<void> {
    const created = await this.createBoardInternal(repository, {
      name: node.name,
      parentId,
    });
    stats.count += 1;

    // Seed generation recursively creates the template tree one level at a time.
    for (const child of node.children ?? []) {
      await this.createTemplateNodes(
        repository,
        child as TemplateNode,
        created.id,
        stats
      );
    }
  }

  async getBoardTree() {
    const records = await this.getRepository().getAllBoards();
    return buildTree(records);
  }

  async createBoard(input: CreateBoardInput) {
    const board = await this.createBoardInternal(this.getRepository(), input);
    const depth = await this.getRepository().getBoardDepth(board.id);

    // Events let the frontend refresh other open tabs after a successful mutation.
    this.events.emit("board.created", {
      boardId: board.id,
      parentId: board.parentId,
    });

    return {
      ...board,
      depth: depth ?? 1,
      children: [],
    };
  }

  async moveBoard(input: MoveBoardInput) {
    const repository = this.getRepository();
    const board = await repository.findById(input.id);

    if (!board) {
      throw new AppError(404, "BOARD_NOT_FOUND", "Board was not found.");
    }

    if (input.parentId === input.id) {
      throw new AppError(
        400,
        "INVALID_MOVE",
        "A board cannot be moved into itself."
      );
    }

    if (input.parentId) {
      const parent = await repository.findById(input.parentId);

      if (!parent) {
        throw new AppError(404, "PARENT_NOT_FOUND", "Parent board was not found.");
      }

      const isDescendant = await repository.isDescendant(board.id, input.parentId);
      if (isDescendant) {
        throw new AppError(
          400,
          "INVALID_MOVE",
          "A board cannot be moved into one of its descendants."
        );
      }
    }

    const parentDepth = input.parentId
      ? await repository.getBoardDepth(input.parentId)
      : 0;
    const subtreeHeight = await repository.getSubtreeHeight(board.id);

    if (subtreeHeight === null) {
      throw new AppError(404, "BOARD_NOT_FOUND", "Board was not found.");
    }

    // The move is valid only if the destination depth plus the subtree's height
    // still fits under the global depth cap.
    if ((parentDepth ?? 0) + subtreeHeight > MAX_DEPTH) {
      throw new AppError(
        400,
        "MAX_DEPTH_EXCEEDED",
        `Boards cannot exceed depth ${MAX_DEPTH}.`
      );
    }

    const moved = await repository.updateBoardParent(board.id, input.parentId);

    if (!moved) {
      throw new AppError(404, "BOARD_NOT_FOUND", "Board was not found.");
    }

    const depth = await repository.getBoardDepth(moved.id);

    this.events.emit("board.moved", {
      boardId: moved.id,
      parentId: moved.parentId,
    });

    return {
      ...moved,
      depth: depth ?? 1,
      children: [],
    };
  }

  async deleteBoard(id: string) {
    const repository = this.getRepository();
    const board = await repository.findById(id);

    if (!board) {
      throw new AppError(404, "BOARD_NOT_FOUND", "Board was not found.");
    }

    // Collect IDs before delete so the API and event payload can describe the full cascade.
    const deletedIds = await repository.listSubtreeIds(id);
    await repository.deleteBoard(id);

    this.events.emit("board.deleted", {
      boardId: id,
      deletedIds,
    });

    return { deletedIds };
  }

  async seedBoards(input: SeedTemplateInput) {
    if (!Number.isFinite(input.campaignCount)) {
      throw new AppError(
        400,
        "INVALID_SEED_INPUT",
        "Campaign count must be a valid number."
      );
    }

    const template = createTemplateDefinition(input);
    const stats = { count: 0 };

    await this.database.withTransaction(async (client) => {
      const repository = this.getRepository(client);
      // Use one transaction so a seed failure never leaves behind a partial template.
      await this.createTemplateNodes(repository, template, null, stats);
    });

    this.events.emit("boards.seeded", {
      createdCount: stats.count,
      template,
    });

    return { createdCount: stats.count };
  }
}
