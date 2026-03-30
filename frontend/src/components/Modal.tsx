"use client";

import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({
  isOpen,
  title,
  description,
  onClose,
  children,
}: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    // Simple shared modal shell used by create/move/delete/seed flows.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-slate-950/40">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
            {description ? (
              <p className="mt-2 text-sm text-slate-300">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300 transition hover:border-rose-300 hover:text-white"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
