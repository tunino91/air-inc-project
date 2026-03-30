export interface BoardNode {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;
  createdAt: string;
  updatedAt: string;
  children: BoardNode[];
}

export interface BoardResponse {
  board: BoardNode;
}

export interface BoardTreeResponse {
  boards: BoardNode[];
}

export interface DeleteBoardResponse {
  deletedIds: string[];
}

export interface SeedBoardsInput {
  projectType: string;
  teamType: string;
  campaignCount: number;
  includeArchive: boolean;
}

export interface SeedBoardsResponse {
  createdCount: number;
}

export interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}
