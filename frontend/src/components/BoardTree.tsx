"use client";

import TreeNode from "@/components/board-tree/TreeNode";
import { BoardNode } from "@/types/board";

export interface BoardTreeSharedProps {
  selectedBoardId: string | null;
  expandedBoardIds: Set<string>;
  draggedBoardId: string | null;
  invalidDropIds: Set<string>;
  draggedBoardParentId: string | null;
  onSelect: (boardId: string) => void;
  onToggleExpand: (boardId: string) => void;
  onCreate: (parentId: string | null) => void;
  onMove: (boardId: string) => void;
  onDelete: (boardId: string) => void;
}

interface BoardTreeProps extends BoardTreeSharedProps {
  boards: BoardNode[];
}

export default function BoardTree(props: BoardTreeProps) {
  return (
    // Each TreeNode renders itself and, when expanded, recurses into its children.
    <ul className="space-y-4">
      {props.boards.map((board) => (
        <TreeNode key={board.id} board={board} {...props} />
      ))}
    </ul>
  );
}
