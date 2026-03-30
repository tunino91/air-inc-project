export interface BoardRecord {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardNode extends BoardRecord {
  depth: number;
  children: BoardNode[];
}

export interface CreateBoardInput {
  name: string;
  parentId?: string | null;
}

export interface MoveBoardInput {
  id: string;
  parentId: string | null;
}

export interface SeedTemplateInput {
  projectType: string;
  teamType: string;
  campaignCount: number;
  includeArchive: boolean;
}
