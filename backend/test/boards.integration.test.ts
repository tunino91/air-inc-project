import request, { Response as SupertestResponse } from "supertest";
import { createApp } from "../src/app";
import { Database } from "../src/db/pool";
import { runMigrations } from "../src/db/runMigrations";
import { NoopBoardEventPublisher } from "../src/events/boardEvents";
import { BoardService } from "../src/services/boardService";

describe("Board API", () => {
  const database = new Database();
  // The integration suite uses the real app stack and database queries,
  // but swaps realtime publishing for a no-op implementation.
  const app = createApp(new BoardService(database, new NoopBoardEventPublisher()));

  beforeAll(async () => {
    await runMigrations(database.getPool());
  });

  beforeEach(async () => {
    await database.getPool().query("TRUNCATE TABLE boards CASCADE");
  });

  afterAll(async () => {
    await database.close();
  });

  it("creates a root board and child board", async () => {
    const rootResponse = await request(app)
      .post("/api/boards")
      .send({ name: "Marketing" })
      .expect(201);

    const childResponse = await request(app)
      .post("/api/boards")
      .send({ name: "Campaigns", parentId: rootResponse.body.board.id })
      .expect(201);

    expect(rootResponse.body.board.depth).toBe(1);
    expect(childResponse.body.board.parentId).toBe(rootResponse.body.board.id);
    expect(childResponse.body.board.depth).toBe(2);
  });

  it("rejects create when parent does not exist", async () => {
    const response = await request(app)
      .post("/api/boards")
      .send({ name: "Orphan", parentId: "3561e4a3-89ef-45ff-b54c-52c7c30f7ab6" })
      .expect(404);

    expect(response.body.error.code).toBe("PARENT_NOT_FOUND");
  });

  it("rejects create beyond max depth", async () => {
    let parentId: string | null = null;

    for (let depth = 1; depth <= 10; depth += 1) {
      const createResponse: SupertestResponse = await request(app)
        .post("/api/boards")
        .send({ name: `Level ${depth}`, parentId })
        .expect(201);

      parentId = createResponse.body.board.id;
    }

    const response = await request(app)
      .post("/api/boards")
      .send({ name: "Too Deep", parentId })
      .expect(400);

    expect(response.body.error.code).toBe("MAX_DEPTH_EXCEEDED");
  });

  it("returns the hierarchy as a tree", async () => {
    const root = await request(app).post("/api/boards").send({ name: "Root" });
    await request(app)
      .post("/api/boards")
      .send({ name: "Child", parentId: root.body.board.id });

    const response = await request(app).get("/api/boards/tree").expect(200);

    expect(response.body.boards).toHaveLength(1);
    expect(response.body.boards[0].children).toHaveLength(1);
    expect(response.body.boards[0].children[0].depth).toBe(2);
  });

  it("moves a board to another parent", async () => {
    const rootA = await request(app).post("/api/boards").send({ name: "Root A" });
    const rootB = await request(app).post("/api/boards").send({ name: "Root B" });
    const child = await request(app)
      .post("/api/boards")
      .send({ name: "Child", parentId: rootA.body.board.id });

    const response = await request(app)
      .patch(`/api/boards/${child.body.board.id}/move`)
      .send({ parentId: rootB.body.board.id })
      .expect(200);

    expect(response.body.board.parentId).toBe(rootB.body.board.id);
    expect(response.body.board.depth).toBe(2);
  });

  it("moves a board to root", async () => {
    const root = await request(app).post("/api/boards").send({ name: "Root" });
    const child = await request(app)
      .post("/api/boards")
      .send({ name: "Child", parentId: root.body.board.id });

    const response = await request(app)
      .patch(`/api/boards/${child.body.board.id}/move`)
      .send({ parentId: null })
      .expect(200);

    expect(response.body.board.parentId).toBeNull();
    expect(response.body.board.depth).toBe(1);
  });

  it("rejects moving into itself", async () => {
    const root = await request(app).post("/api/boards").send({ name: "Root" });

    const response = await request(app)
      .patch(`/api/boards/${root.body.board.id}/move`)
      .send({ parentId: root.body.board.id })
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_MOVE");
  });

  it("rejects moving into a descendant", async () => {
    const root = await request(app).post("/api/boards").send({ name: "Root" });
    const child = await request(app)
      .post("/api/boards")
      .send({ name: "Child", parentId: root.body.board.id });

    const response = await request(app)
      .patch(`/api/boards/${root.body.board.id}/move`)
      .send({ parentId: child.body.board.id })
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_MOVE");
  });

  it("rejects moving when depth would exceed the max", async () => {
    const chainIds: string[] = [];
    let parentId: string | null = null;

    for (let depth = 1; depth <= 8; depth += 1) {
      const createResponse: SupertestResponse = await request(app)
        .post("/api/boards")
        .send({ name: `Chain ${depth}`, parentId })
        .expect(201);
      chainIds.push(createResponse.body.board.id);
      parentId = createResponse.body.board.id;
    }

    const subtreeRoot = await request(app).post("/api/boards").send({ name: "Subtree Root" });
    const subtreeChild = await request(app)
      .post("/api/boards")
      .send({ name: "Subtree Child", parentId: subtreeRoot.body.board.id })
      .expect(201);

    await request(app)
      .post("/api/boards")
      .send({ name: "Subtree Grandchild", parentId: subtreeChild.body.board.id })
      .expect(201);

    const response = await request(app)
      .patch(`/api/boards/${subtreeRoot.body.board.id}/move`)
      .send({ parentId: chainIds[7] })
      .expect(400);

    expect(response.body.error.code).toBe("MAX_DEPTH_EXCEEDED");
  });

  it("deletes a board and its descendants", async () => {
    const root = await request(app).post("/api/boards").send({ name: "Root" });
    const child = await request(app)
      .post("/api/boards")
      .send({ name: "Child", parentId: root.body.board.id });

    await request(app)
      .post("/api/boards")
      .send({ name: "Grandchild", parentId: child.body.board.id });

    const response = await request(app)
      .delete(`/api/boards/${root.body.board.id}`)
      .expect(200);

    expect(response.body.deletedIds).toHaveLength(3);

    const tree = await request(app).get("/api/boards/tree").expect(200);
    expect(tree.body.boards).toHaveLength(0);
  });

  it("creates a starter hierarchy from the seed endpoint", async () => {
    const response = await request(app)
      .post("/api/boards/seed")
      .send({
        projectType: "Launch",
        teamType: "Brand",
        campaignCount: 3,
        includeArchive: true,
      })
      .expect(201);

    expect(response.body.createdCount).toBeGreaterThan(0);

    const tree = await request(app).get("/api/boards/tree").expect(200);
    expect(tree.body.boards[0].name).toContain("Launch");
  });
});
