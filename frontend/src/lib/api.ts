import axios from "axios";
import {
  BoardResponse,
  BoardTreeResponse,
  DeleteBoardResponse,
  SeedBoardsInput,
  SeedBoardsResponse,
} from "@/types/board";

const api = axios.create({
  // Next.js rewrites proxy /api requests to the backend at runtime.
  baseURL: "/api",
});

// Shared query key so mutations and socket listeners can invalidate the same cache entry.
export const boardQueryKey = ["boards", "tree"] as const;

export const fetchBoardTree = async () => {
  const response = await api.get<BoardTreeResponse>("/boards/tree");
  return response.data;
};

export const createBoard = async (input: { name: string; parentId: string | null }) => {
  const response = await api.post<BoardResponse>("/boards", input);
  return response.data;
};

export const moveBoard = async (input: { id: string; parentId: string | null }) => {
  const response = await api.patch<BoardResponse>(`/boards/${input.id}/move`, {
    parentId: input.parentId,
  });
  return response.data;
};

export const deleteBoard = async (id: string) => {
  const response = await api.delete<DeleteBoardResponse>(`/boards/${id}`);
  return response.data;
};

export const seedBoards = async (input: SeedBoardsInput) => {
  const response = await api.post<SeedBoardsResponse>("/boards/seed", input);
  return response.data;
};
