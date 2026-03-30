import { BoardNode } from "@/types/board";

export const flattenBoards = (boards: BoardNode[]): BoardNode[] => {
  const items: BoardNode[] = [];

  // Depth-first flattening is useful for move dropdowns and summary counts.
  const visit = (node: BoardNode) => {
    items.push(node);
    node.children.forEach(visit);
  };

  boards.forEach(visit);

  return items;
};

export const findBoard = (
  boards: BoardNode[],
  boardId: string | null
): BoardNode | null => {
  if (!boardId) {
    return null;
  }

  for (const board of boards) {
    if (board.id === boardId) {
      return board;
    }

    const nested = findBoard(board.children, boardId);
    if (nested) {
      return nested;
    }
  }

  return null;
};

export const collectSubtreeIds = (
  board: BoardNode | null,
  ids = new Set<string>()
): Set<string> => {
  if (!board) {
    return ids;
  }

  // Used to prevent invalid move targets such as moving a board into itself
  // or into one of its descendants.
  ids.add(board.id);
  board.children.forEach((child) => collectSubtreeIds(child, ids));
  return ids;
};

export const countBoards = (boards: BoardNode[]) =>
  flattenBoards(boards).length;
