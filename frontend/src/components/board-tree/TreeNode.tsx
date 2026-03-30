"use client";

import { useDraggable, useDroppable } from "@dnd-kit/react";
import { BoardTreeSharedProps } from "@/components/BoardTree";
import { BoardNode } from "@/types/board";

interface TreeNodeProps extends BoardTreeSharedProps {
  board: BoardNode;
}

export default function TreeNode({
  board,
  selectedBoardId,
  expandedBoardIds,
  draggedBoardId,
  invalidDropIds,
  draggedBoardParentId,
  onSelect,
  onToggleExpand,
  onCreate,
  onMove,
  onDelete,
}: TreeNodeProps) {
  const isSelected = selectedBoardId === board.id;
  const hasChildren = board.children.length > 0;
  const isExpanded = expandedBoardIds.has(board.id);
  // Disable drops onto the dragged subtree or onto the board's current parent.
  const isDropDisabled =
    !draggedBoardId ||
    invalidDropIds.has(board.id) ||
    draggedBoardParentId === board.id;
  const { ref: draggableRef, handleRef, isDragging } = useDraggable({
    id: board.id,
    disabled: false,
    data: {
      boardId: board.id,
      parentId: board.parentId,
    },
  });
  const { ref: droppableRef, isDropTarget } = useDroppable({
    id: `board:${board.id}`,
    disabled: isDropDisabled,
    data: {
      boardId: board.id,
    },
  });

  const setRowRef = (element: Element | null) => {
    // The row acts as both drag source and drop target.
    draggableRef(element);
    droppableRef(element);
  };

  return (
    <li className="space-y-3">
      <div
        ref={setRowRef}
        role="button"
        tabIndex={0}
        aria-expanded={hasChildren ? isExpanded : undefined}
        onClick={() => onSelect(board.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(board.id);
          }
        }}
        className={`w-full rounded-[22px] border p-4 text-left transition ${
          isDropTarget
            ? "border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-100"
            : isSelected
              ? "border-amber-300/80 bg-amber-300/10 shadow-lg shadow-amber-950/15"
              : "border-slate-200/70 bg-white/85 hover:border-slate-300 hover:bg-white"
        } ${isDragging ? "opacity-55" : ""}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex items-center gap-2">
              <button
                ref={handleRef}
                type="button"
                aria-label={`Drag ${board.name}`}
                onClick={(event) => event.stopPropagation()}
                // The dedicated handle prevents accidental drag gestures from the whole row.
                className="flex h-8 w-8 cursor-grab items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-500 transition hover:border-slate-400 hover:text-slate-950 active:cursor-grabbing"
              >
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0"
                  fill="currentColor"
                >
                  <circle cx="5" cy="4" r="1.1" />
                  <circle cx="11" cy="4" r="1.1" />
                  <circle cx="5" cy="8" r="1.1" />
                  <circle cx="11" cy="8" r="1.1" />
                  <circle cx="5" cy="12" r="1.1" />
                  <circle cx="11" cy="12" r="1.1" />
                </svg>
              </button>

              <div className="flex h-8 w-8 items-center justify-center">
                {hasChildren ? (
                  <button
                    type="button"
                    aria-label={`${isExpanded ? "Collapse" : "Expand"} ${board.name}`}
                    aria-expanded={isExpanded}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleExpand(board.id);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 transition hover:border-slate-400 hover:text-slate-950"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                      className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 3.5 10.5 8 6 12.5" />
                    </svg>
                  </button>
                ) : (
                  <span className="h-8 w-8" aria-hidden="true" />
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-slate-900">{board.name}</span>
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-white">
                  Depth {board.depth}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {board.children.length}{" "}
                {board.children.length === 1 ? "direct child" : "direct children"}
              </p>
              {isDropTarget ? (
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Drop to move inside
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCreate(board.id);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
            >
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3.25v9.5" />
                <path d="M3.25 8h9.5" />
              </svg>
              Add child
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onMove(board.id);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
            >
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2.5 5.5h8" />
                <path d="M8 3l2.5 2.5L8 8" />
                <path d="M13.5 10.5h-8" />
                <path d="M8 8l-2.5 2.5L8 13" />
              </svg>
              Move
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(board.id);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:border-rose-500 hover:text-rose-800"
            >
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3.5 4.5h9" />
                <path d="M6 2.75h4" />
                <path d="M5 4.5l.5 8.25h5L11 4.5" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded ? (
        // Children are rendered recursively, preserving the same interaction contract at every depth.
        <ul className="ml-4 space-y-3 border-l border-dashed border-slate-300 pl-5">
          {board.children.map((child) => (
            <TreeNode
              key={child.id}
              board={child}
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
          ))}
        </ul>
      ) : null}
    </li>
  );
}
