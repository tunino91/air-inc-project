"use client";

import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import BoardSidebar from "@/components/board-manager/BoardSidebar";
import {
  CreateBoardModal,
  DeleteBoardModal,
  MoveBoardModal,
} from "@/components/board-manager/BoardDialogs";
import BoardTreePanel from "@/components/board-manager/BoardTreePanel";
import SeedWizard from "@/components/SeedWizard";
import { countBoards } from "@/lib/boards";
import { useBoardDragDrop } from "@/hooks/useBoardDragDrop";
import { useBoardMutations } from "@/hooks/useBoardMutations";
import { useBoardTreeData } from "@/hooks/useBoardTreeData";
import { useAppDispatch } from "@/store/hooks";
import {
  closeCreateModal,
  closeDeleteModal,
  closeMoveModal,
  expandBoard,
  openCreateModal,
  openDeleteModal,
  openMoveModal,
  openSeedWizard,
  selectBoard,
  toggleBoardExpanded,
} from "@/store/uiSlice";

export default function BoardManager() {
  const dispatch = useAppDispatch();
  const {
    createError,
    moveError,
    deleteError,
    seedError,
    isCreating,
    isMoving,
    isDeleting,
    isSeeding,
    clearCreateError,
    clearMoveError,
    clearDeleteError,
    clearSeedError,
    submitCreateBoard,
    submitMoveBoard,
    submitDeleteBoard,
    submitSeedBoards,
  } = useBoardMutations();
  const boardData = useBoardTreeData();
  const dragDrop = useBoardDragDrop({
    boards: boardData.boards,
    expandedBoardIds: boardData.expandedBoardIds,
    // Drag-and-drop owns the "hover to expand" behavior during moves.
    onExpandBoard: (boardId) => dispatch(expandBoard(boardId)),
    onMoveBoard: submitMoveBoard,
    onDragStart: clearMoveError,
  });

  return (
    <>
      <DragDropProvider
        onDragStart={dragDrop.handleDragStart}
        onDragOver={dragDrop.handleDragOver}
        onDragEnd={dragDrop.handleDragEnd}
      >
        {/* Main layout: summary/actions on the left, interactive hierarchy on the right. */}
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_30%),linear-gradient(135deg,_#f8fafc_0%,_#e2e8f0_40%,_#fef3c7_100%)] px-4 py-8 text-slate-950 md:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <BoardSidebar
              totalBoards={countBoards(boardData.boards)}
              onCreateRoot={() => {
                clearCreateError();
                dispatch(openCreateModal(null));
              }}
              onOpenSeedWizard={() => {
                clearSeedError();
                dispatch(openSeedWizard());
              }}
            />

            <BoardTreePanel
              boards={boardData.boards}
              selectedBoardId={boardData.ui.selectedBoardId}
              expandedBoardIds={boardData.expandedBoardIds}
              draggedBoardId={dragDrop.draggedBoardId}
              draggedBoardName={dragDrop.draggedBoard?.name ?? null}
              draggedBoardParentId={dragDrop.draggedBoard?.parentId ?? null}
              invalidDropIds={dragDrop.invalidDropIds}
              isLoading={boardData.boardTreeQuery.isLoading}
              isFetching={boardData.boardTreeQuery.isFetching}
              isError={boardData.boardTreeQuery.isError}
              error={boardData.boardTreeQuery.error}
              moveError={moveError}
              isMoveModalOpen={boardData.ui.moveModal.isOpen}
              onSelect={(boardId) => dispatch(selectBoard(boardId))}
              onToggleExpand={(boardId) => dispatch(toggleBoardExpanded(boardId))}
              onCreate={(parentId) => {
                clearCreateError();
                dispatch(openCreateModal(parentId));
              }}
              onMove={(boardId) => {
                clearMoveError();
                dispatch(openMoveModal(boardId));
              }}
              onDelete={(boardId) => {
                clearDeleteError();
                dispatch(openDeleteModal(boardId));
              }}
              onCreateRoot={() => {
                clearCreateError();
                dispatch(openCreateModal(null));
              }}
              onOpenSeedWizard={() => {
                clearSeedError();
                dispatch(openSeedWizard());
              }}
            />
          </div>
        </main>

        <DragOverlay dropAnimation={null}>
          {/* Floating preview rendered while a board is being dragged. */}
          {dragDrop.draggedBoard ? (
            <div className="rounded-[22px] border border-slate-900 bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-slate-950/30">
              {dragDrop.draggedBoard.name}
            </div>
          ) : null}
        </DragOverlay>
      </DragDropProvider>

      <CreateBoardModal
        // Dialog state is stored in Redux, while submit state comes from React Query.
        isOpen={boardData.ui.createModal.isOpen}
        parentBoard={boardData.createParent}
        isSubmitting={isCreating}
        errorMessage={createError}
        onClose={() => dispatch(closeCreateModal())}
        onSubmit={(name) =>
          submitCreateBoard({
            name,
            parentId: boardData.ui.createModal.parentId,
          })
        }
      />

      <MoveBoardModal
        isOpen={boardData.ui.moveModal.isOpen}
        board={boardData.moveBoardTarget}
        // The destination list excludes the moved subtree to block obvious invalid moves in the UI.
        options={boardData.moveOptions}
        isSubmitting={isMoving}
        errorMessage={moveError}
        onClose={() => dispatch(closeMoveModal())}
        onSubmit={(parentId) => {
          if (!boardData.ui.moveModal.boardId) {
            return;
          }

          submitMoveBoard({
            id: boardData.ui.moveModal.boardId,
            parentId,
          });
        }}
      />

      <DeleteBoardModal
        isOpen={boardData.ui.deleteModal.isOpen}
        board={boardData.deleteBoardTarget}
        isSubmitting={isDeleting}
        errorMessage={deleteError}
        onClose={() => dispatch(closeDeleteModal())}
        onSubmit={() => {
          if (!boardData.ui.deleteModal.boardId) {
            return;
          }

          submitDeleteBoard(boardData.ui.deleteModal.boardId);
        }}
      />

      <SeedWizard
        isSubmitting={isSeeding}
        errorMessage={seedError}
        onSubmit={() =>
          submitSeedBoards({
            projectType: boardData.ui.seedWizard.projectType,
            teamType: boardData.ui.seedWizard.teamType,
            campaignCount: boardData.ui.seedWizard.campaignCount,
            includeArchive: boardData.ui.seedWizard.includeArchive,
          })
        }
      />
    </>
  );
}
