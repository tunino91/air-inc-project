"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  boardQueryKey,
  createBoard,
  deleteBoard,
  moveBoard,
  seedBoards,
} from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { useAppDispatch } from "@/store/hooks";
import {
  closeCreateModal,
  closeDeleteModal,
  closeMoveModal,
  closeSeedWizard,
  expandBoard,
  selectBoard,
} from "@/store/uiSlice";
import { SeedBoardsInput } from "@/types/board";

export const useBoardMutations = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [createError, setCreateError] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createBoard,
    onSuccess: async (_data, variables) => {
      setCreateError(null);
      if (variables.parentId) {
        // Expanding the parent helps the newly created child stay visible.
        dispatch(expandBoard(variables.parentId));
      }
      dispatch(closeCreateModal());
      await queryClient.invalidateQueries({ queryKey: boardQueryKey });
    },
    onError: (error) => {
      setCreateError(getApiErrorMessage(error, "Unable to create board."));
    },
  });

  const moveMutation = useMutation({
    mutationFn: moveBoard,
    onSuccess: async (_data, variables) => {
      setMoveError(null);
      if (variables.parentId) {
        // Expanding the destination keeps the moved board visible after refetch.
        dispatch(expandBoard(variables.parentId));
      }
      dispatch(closeMoveModal());
      await queryClient.invalidateQueries({ queryKey: boardQueryKey });
    },
    onError: (error) => {
      setMoveError(getApiErrorMessage(error, "Unable to move board."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBoard,
    onSuccess: async () => {
      setDeleteError(null);
      dispatch(closeDeleteModal());
      // Clear selection in case the selected board was part of the deleted subtree.
      dispatch(selectBoard(null));
      await queryClient.invalidateQueries({ queryKey: boardQueryKey });
    },
    onError: (error) => {
      setDeleteError(getApiErrorMessage(error, "Unable to delete board."));
    },
  });

  const seedMutation = useMutation({
    mutationFn: seedBoards,
    onSuccess: async () => {
      setSeedError(null);
      dispatch(closeSeedWizard());
      await queryClient.invalidateQueries({ queryKey: boardQueryKey });
    },
    onError: (error) => {
      setSeedError(getApiErrorMessage(error, "Unable to generate starter hierarchy."));
    },
  });

  return {
    createError,
    moveError,
    deleteError,
    seedError,
    isCreating: createMutation.isPending,
    isMoving: moveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSeeding: seedMutation.isPending,
    clearCreateError: () => setCreateError(null),
    clearMoveError: () => setMoveError(null),
    clearDeleteError: () => setDeleteError(null),
    clearSeedError: () => setSeedError(null),
    submitCreateBoard: createMutation.mutate,
    submitMoveBoard: moveMutation.mutate,
    submitDeleteBoard: deleteMutation.mutate,
    submitSeedBoards: (input: SeedBoardsInput) => seedMutation.mutate(input),
  };
};
