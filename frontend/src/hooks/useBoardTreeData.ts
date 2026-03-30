"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/hooks/useSocket";
import { boardQueryKey, fetchBoardTree } from "@/lib/api";
import { collectSubtreeIds, findBoard, flattenBoards } from "@/lib/boards";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { initializeExpandedBoards, syncExpandedBoards } from "@/store/uiSlice";

export const useBoardTreeData = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const ui = useAppSelector((state) => state.ui);

  // The backend returns the hierarchy as a fully nested tree.
  const boardTreeQuery = useQuery({
    queryKey: boardQueryKey,
    queryFn: fetchBoardTree,
  });

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleBoardEvent = () => {
      // Re-fetch instead of patching nested client state manually.
      queryClient.invalidateQueries({ queryKey: boardQueryKey });
    };

    socket.on("board.created", handleBoardEvent);
    socket.on("board.moved", handleBoardEvent);
    socket.on("board.deleted", handleBoardEvent);
    socket.on("boards.seeded", handleBoardEvent);

    return () => {
      socket.off("board.created", handleBoardEvent);
      socket.off("board.moved", handleBoardEvent);
      socket.off("board.deleted", handleBoardEvent);
      socket.off("boards.seeded", handleBoardEvent);
    };
  }, [queryClient, socket]);

  const boards = boardTreeQuery.data?.boards ?? [];
  const flatBoards = flattenBoards(boards);
  const expandedBoardIds = new Set(ui.expandedBoardIds);
  const selectedBoard = findBoard(boards, ui.selectedBoardId);
  const createParent = findBoard(boards, ui.createModal.parentId);
  const moveBoardTarget = findBoard(boards, ui.moveModal.boardId);
  const deleteBoardTarget = findBoard(boards, ui.deleteModal.boardId);
  const excludedIds = collectSubtreeIds(moveBoardTarget);
  // Prevent invalid move destinations in the modal by excluding the board
  // being moved and every board inside its subtree.
  const moveOptions = flatBoards.filter((board) => !excludedIds.has(board.id));

  useEffect(() => {
    const nextExpandableIds = flatBoards
      .filter((board) => board.children.length > 0)
      .map((board) => board.id);

    if (!ui.hasInitializedExpansion) {
      if (nextExpandableIds.length > 0) {
        dispatch(initializeExpandedBoards(nextExpandableIds));
      }
      return;
    }

    // Keep expansion state stable through refetches, but prune IDs that no
    // longer correspond to expandable nodes after deletes or moves.
    const validExpandedIds = ui.expandedBoardIds.filter((boardId) =>
      nextExpandableIds.includes(boardId)
    );

    if (
      validExpandedIds.length !== ui.expandedBoardIds.length ||
      validExpandedIds.some((boardId, index) => boardId !== ui.expandedBoardIds[index])
    ) {
      dispatch(syncExpandedBoards(validExpandedIds));
    }
  }, [dispatch, flatBoards, ui.expandedBoardIds, ui.hasInitializedExpansion]);

  return {
    ui,
    boardTreeQuery,
    boards,
    flatBoards,
    expandedBoardIds,
    selectedBoard,
    createParent,
    moveBoardTarget,
    deleteBoardTarget,
    moveOptions,
  };
};
