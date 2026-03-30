"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { BoardNode } from "@/types/board";

interface CreateBoardModalProps {
  isOpen: boolean;
  parentBoard: BoardNode | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export function CreateBoardModal({
  isOpen,
  parentBoard,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: CreateBoardModalProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Reset the input each time the modal opens so stale text is not carried over.
      setName("");
    }
  }, [isOpen, parentBoard?.id]);

  return (
    <Modal
      isOpen={isOpen}
      title={parentBoard ? `Add child to ${parentBoard.name}` : "Create root board"}
      description={
        parentBoard
          ? `This new board will sit directly inside ${parentBoard.name}.`
          : "Create a new top-level board in the workspace."
      }
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(name);
        }}
      >
        <label className="block space-y-2 text-sm text-slate-200">
          <span>Board name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="For example, Spring launch"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500"
          />
        </label>

        {errorMessage ? (
          <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create board"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface MoveBoardModalProps {
  isOpen: boolean;
  board: BoardNode | null;
  options: BoardNode[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (parentId: string | null) => void;
}

export function MoveBoardModal({
  isOpen,
  board,
  options,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: MoveBoardModalProps) {
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Default the destination to the board's current parent for easier editing.
      setParentId(board?.parentId ?? null);
    }
  }, [isOpen, board?.id, board?.parentId]);

  return (
    <Modal
      isOpen={isOpen}
      title={board ? `Move ${board.name}` : "Move board"}
      description="Choose a new parent board. Root keeps the board at the top level."
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(parentId);
        }}
      >
        <label className="block space-y-2 text-sm text-slate-200">
          <span>Destination</span>
          <select
            value={parentId ?? ""}
            onChange={(event) => setParentId(event.target.value || null)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
          >
            <option value="">Root</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {/* Indent options visually so the move list still communicates hierarchy. */}
                {"— ".repeat(Math.max(0, option.depth - 1))}
                {option.name}
              </option>
            ))}
          </select>
        </label>

        {errorMessage ? (
          <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {isSubmitting ? "Moving..." : "Move board"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface DeleteBoardModalProps {
  isOpen: boolean;
  board: BoardNode | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: () => void;
}

export function DeleteBoardModal({
  isOpen,
  board,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: DeleteBoardModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title={board ? `Delete ${board.name}?` : "Delete board"}
      // The warning explicitly calls out cascade behavior so the UI matches backend semantics.
      description="Deleting a board recursively removes every nested board under it."
      onClose={onClose}
    >
      <div className="space-y-5">
        <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          This action cannot be undone.
        </p>

        {errorMessage ? (
          <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="rounded-full bg-rose-400 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Deleting..." : "Delete board"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
