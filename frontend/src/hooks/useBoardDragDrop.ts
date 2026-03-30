"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/react";
import { collectSubtreeIds, findBoard } from "@/lib/boards";
import { BoardNode } from "@/types/board";

interface UseBoardDragDropInput {
  boards: BoardNode[];
  expandedBoardIds: Set<string>;
  onExpandBoard: (boardId: string) => void;
  onMoveBoard: (input: { id: string; parentId: string | null }) => void;
  onDragStart?: () => void;
}

type DragStartPayload = Parameters<DragStartEvent>[0];
type DragOverPayload = Parameters<DragOverEvent>[0];
type DragEndPayload = Parameters<DragEndEvent>[0];

export const useBoardDragDrop = ({
  boards,
  expandedBoardIds,
  onExpandBoard,
  onMoveBoard,
  onDragStart,
}: UseBoardDragDropInput) => {
  const [draggedBoardId, setDraggedBoardId] = useState<string | null>(null);
  const dragExpandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragExpandBoardIdRef = useRef<string | null>(null);

  const draggedBoard = findBoard(boards, draggedBoardId);
  // The dragged subtree cannot be used as a drop target for itself.
  const invalidDropIds = collectSubtreeIds(draggedBoard);

  const clearDragExpandTimeout = useCallback(() => {
    if (dragExpandTimeoutRef.current) {
      clearTimeout(dragExpandTimeoutRef.current);
      dragExpandTimeoutRef.current = null;
    }

    dragExpandBoardIdRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearDragExpandTimeout();
    };
  }, [clearDragExpandTimeout]);

  const handleDropMove = useCallback(
    (targetBoardId: string | null) => {
      // Avoid no-op moves such as dropping back onto the current parent.
      if (!draggedBoard || draggedBoard.parentId === targetBoardId) {
        return;
      }

      onMoveBoard({
        id: draggedBoard.id,
        parentId: targetBoardId,
      });
    },
    [draggedBoard, onMoveBoard]
  );

  const handleDragStart = useCallback(
    (event: DragStartPayload) => {
      if (!event.operation.source) {
        return;
      }

      onDragStart?.();
      clearDragExpandTimeout();
      setDraggedBoardId(String(event.operation.source.id));
    },
    [clearDragExpandTimeout, onDragStart]
  );

  const handleDragOver = useCallback(
    (event: DragOverPayload) => {
      const targetId = event.operation.target?.id;

      if (typeof targetId !== "string" || !targetId.startsWith("board:")) {
        clearDragExpandTimeout();
        return;
      }

      const targetBoardId = targetId.replace("board:", "");
      const targetBoard = findBoard(boards, targetBoardId);
      if (!targetBoard || !targetBoard.children.length) {
        clearDragExpandTimeout();
        return;
      }

      if (expandedBoardIds.has(targetBoardId)) {
        clearDragExpandTimeout();
        return;
      }

      if (dragExpandBoardIdRef.current === targetBoardId) {
        return;
      }

      clearDragExpandTimeout();
      dragExpandBoardIdRef.current = targetBoardId;
      dragExpandTimeoutRef.current = setTimeout(() => {
        // Auto-expand collapsed parents during drag so users can keep drilling
        // deeper without dropping and restarting the move flow.
        onExpandBoard(targetBoardId);
        clearDragExpandTimeout();
      }, 450);
    },
    [boards, clearDragExpandTimeout, expandedBoardIds, onExpandBoard]
  );

  const handleDragEnd = useCallback(
    (event: DragEndPayload) => {
      clearDragExpandTimeout();

      const targetId = event.operation.target?.id;

      setDraggedBoardId(null);

      if (event.canceled || !targetId) {
        return;
      }

      if (targetId === "root-drop-zone") {
        handleDropMove(null);
        return;
      }

      if (typeof targetId === "string" && targetId.startsWith("board:")) {
        handleDropMove(targetId.replace("board:", ""));
      }
    },
    [clearDragExpandTimeout, handleDropMove]
  );

  return {
    draggedBoardId,
    draggedBoard,
    invalidDropIds,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};
