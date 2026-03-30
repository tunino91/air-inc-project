"use client";

import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface CreateModalState {
  isOpen: boolean;
  parentId: string | null;
}

interface MoveModalState {
  isOpen: boolean;
  boardId: string | null;
}

interface DeleteModalState {
  isOpen: boolean;
  boardId: string | null;
}

interface SeedWizardState {
  isOpen: boolean;
  step: number;
  projectType: string;
  teamType: string;
  campaignCount: number;
  includeArchive: boolean;
}

interface UiState {
  selectedBoardId: string | null;
  expandedBoardIds: string[];
  hasInitializedExpansion: boolean;
  createModal: CreateModalState;
  moveModal: MoveModalState;
  deleteModal: DeleteModalState;
  seedWizard: SeedWizardState;
}

const initialState: UiState = {
  selectedBoardId: null,
  expandedBoardIds: [],
  // Used to expand the initial tree once without re-expanding after every refetch.
  hasInitializedExpansion: false,
  createModal: {
    isOpen: false,
    parentId: null,
  },
  moveModal: {
    isOpen: false,
    boardId: null,
  },
  deleteModal: {
    isOpen: false,
    boardId: null,
  },
  seedWizard: {
    isOpen: false,
    step: 1,
    projectType: "Campaign Launch",
    teamType: "Brand Studio",
    campaignCount: 3,
    includeArchive: true,
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    selectBoard(state, action: PayloadAction<string | null>) {
      state.selectedBoardId = action.payload;
    },
    initializeExpandedBoards(state, action: PayloadAction<string[]>) {
      // The first successful tree load expands every branch with children
      // so the demo data is easy to inspect immediately.
      state.expandedBoardIds = action.payload;
      state.hasInitializedExpansion = true;
    },
    syncExpandedBoards(state, action: PayloadAction<string[]>) {
      // After refetches, keep only expansions that still point to valid nodes.
      state.expandedBoardIds = action.payload;
    },
    toggleBoardExpanded(state, action: PayloadAction<string>) {
      const boardId = action.payload;

      if (state.expandedBoardIds.includes(boardId)) {
        state.expandedBoardIds = state.expandedBoardIds.filter(
          (expandedId) => expandedId !== boardId
        );
        return;
      }

      state.expandedBoardIds.push(boardId);
    },
    expandBoard(state, action: PayloadAction<string>) {
      const boardId = action.payload;

      if (!state.expandedBoardIds.includes(boardId)) {
        state.expandedBoardIds.push(boardId);
      }
    },
    collapseBoard(state, action: PayloadAction<string>) {
      state.expandedBoardIds = state.expandedBoardIds.filter(
        (expandedId) => expandedId !== action.payload
      );
    },
    openCreateModal(state, action: PayloadAction<string | null>) {
      // A null parent means "create a new root board".
      state.createModal = { isOpen: true, parentId: action.payload };
    },
    closeCreateModal(state) {
      state.createModal = { isOpen: false, parentId: null };
    },
    openMoveModal(state, action: PayloadAction<string>) {
      state.moveModal = { isOpen: true, boardId: action.payload };
    },
    closeMoveModal(state) {
      state.moveModal = { isOpen: false, boardId: null };
    },
    openDeleteModal(state, action: PayloadAction<string>) {
      state.deleteModal = { isOpen: true, boardId: action.payload };
    },
    closeDeleteModal(state) {
      state.deleteModal = { isOpen: false, boardId: null };
    },
    openSeedWizard(state) {
      state.seedWizard.isOpen = true;
    },
    closeSeedWizard(state) {
      // Closing the wizard resets the flow back to step 1 for the next run.
      state.seedWizard.isOpen = false;
      state.seedWizard.step = 1;
    },
    setSeedField(
      state,
      action: PayloadAction<{
        field: keyof Omit<SeedWizardState, "isOpen" | "step">;
        value: string | number | boolean;
      }>
    ) {
      const { field, value } = action.payload;
      state.seedWizard[field] = value as never;
    },
    setSeedStep(state, action: PayloadAction<number>) {
      state.seedWizard.step = action.payload;
    },
  },
});

export const {
  selectBoard,
  initializeExpandedBoards,
  syncExpandedBoards,
  toggleBoardExpanded,
  expandBoard,
  collapseBoard,
  openCreateModal,
  closeCreateModal,
  openMoveModal,
  closeMoveModal,
  openDeleteModal,
  closeDeleteModal,
  openSeedWizard,
  closeSeedWizard,
  setSeedField,
  setSeedStep,
} = uiSlice.actions;

export default uiSlice.reducer;
