"use client";

import { useDroppable } from "@dnd-kit/react";
import BoardTree from "@/components/BoardTree";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { BoardNode } from "@/types/board";

function RootDropZone({
  draggedBoardName,
  disabled,
}: {
  draggedBoardName: string | null;
  disabled: boolean;
}) {
  const { ref, isDropTarget } = useDroppable({
    id: "root-drop-zone",
    disabled,
  });

  // Dropping on this zone moves the board back to the top level.
  return draggedBoardName ? (
    <div
      ref={ref}
      className={`mb-5 rounded-[24px] border border-dashed px-4 py-4 text-sm font-medium transition ${
        isDropTarget
          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
          : disabled
          ? "border-slate-300 bg-slate-50 text-slate-500"
          : "border-slate-300 bg-slate-50 text-slate-500"
      }`}
    >
      Drop here to move <span className="font-semibold">{draggedBoardName}</span> to the
      root level.
    </div>
  ) : null;
}

interface BoardTreePanelProps {
  boards: BoardNode[];
  selectedBoardId: string | null;
  expandedBoardIds: Set<string>;
  draggedBoardId: string | null;
  draggedBoardName: string | null;
  draggedBoardParentId: string | null;
  invalidDropIds: Set<string>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  moveError: string | null;
  isMoveModalOpen: boolean;
  onSelect: (boardId: string) => void;
  onToggleExpand: (boardId: string) => void;
  onCreate: (parentId: string | null) => void;
  onMove: (boardId: string) => void;
  onDelete: (boardId: string) => void;
  onCreateRoot: () => void;
  onOpenSeedWizard: () => void;
}

export default function BoardTreePanel({
  boards,
  selectedBoardId,
  expandedBoardIds,
  draggedBoardId,
  draggedBoardName,
  draggedBoardParentId,
  invalidDropIds,
  isLoading,
  isFetching,
  isError,
  error,
  moveError,
  isMoveModalOpen,
  onSelect,
  onToggleExpand,
  onCreate,
  onMove,
  onDelete,
  onCreateRoot,
  onOpenSeedWizard,
}: BoardTreePanelProps) {
  return (
    <section className="rounded-[32px] border border-white/60 bg-white/85 p-6 shadow-2xl shadow-slate-950/10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <svg
              viewBox="0 0 16 16"
              aria-hidden="true"
              className="h-4 w-4 text-slate-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 2.5v8.5" />
              <path d="M8 5.5H4.5" />
              <path d="M8 8.5h3" />
              <path d="M4.5 5.5v3" />
              <path d="M11 8.5v3" />
              <circle cx="4.5" cy="12" r="1.25" />
              <circle cx="11" cy="12" r="1.25" />
              <circle cx="8" cy="2.5" r="1.25" />
            </svg>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Workspace tree
            </p>
          </div>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">Current hierarchy</h2>
        </div>
        {isFetching ? (
          <span className="rounded-full bg-slate-950 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white">
            Syncing
          </span>
        ) : null}
      </div>

      {moveError && !isMoveModalOpen ? (
        // Drag-and-drop move errors surface here because there is no modal open to host them.
        <div className="mb-5 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {moveError}
        </div>
      ) : null}

      <RootDropZone
        draggedBoardName={draggedBoardName}
        disabled={!draggedBoardId || draggedBoardParentId === null}
      />

      {isLoading ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
          Loading boards...
        </div>
      ) : isError ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
          {getApiErrorMessage(error, "Unable to load the board hierarchy.")}
        </div>
      ) : boards.length === 0 ? (
        // Empty state encourages either manual creation or quick seed generation.
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <h3 className="text-xl font-semibold text-slate-900">No boards yet</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Start with a root board or let the template wizard generate a realistic
            workspace for you.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onCreateRoot}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Create board
            </button>
            <button
              type="button"
              onClick={onOpenSeedWizard}
              className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900"
            >
              Generate starter hierarchy
            </button>
          </div>
        </div>
      ) : (
        // The actual recursive tree renderer lives one level down in BoardTree/TreeNode.
        <BoardTree
          boards={boards}
          selectedBoardId={selectedBoardId}
          expandedBoardIds={expandedBoardIds}
          draggedBoardId={draggedBoardId}
          invalidDropIds={invalidDropIds}
          draggedBoardParentId={draggedBoardParentId}
          onSelect={onSelect}
          onToggleExpand={onToggleExpand}
          onCreate={onCreate}
          onMove={onMove}
          onDelete={onDelete}
        />
      )}
    </section>
  );
}
