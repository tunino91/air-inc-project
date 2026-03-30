"use client";

import { FormEvent } from "react";
import Modal from "@/components/Modal";
import { closeSeedWizard, setSeedField, setSeedStep } from "@/store/uiSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

interface SeedWizardProps {
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: () => void;
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2 text-sm text-slate-200">
      <span>{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 pr-12 text-white"
        >
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3.5 6 8 10.5 12.5 6" />
          </svg>
        </span>
      </div>
    </label>
  );
}

export default function SeedWizard({
  isSubmitting,
  errorMessage,
  onSubmit,
}: SeedWizardProps) {
  const dispatch = useAppDispatch();
  const seedWizard = useAppSelector((state) => state.ui.seedWizard);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (seedWizard.step === 1) {
      // Step 1 collects high-level context; step 2 finalizes shape and preview.
      dispatch(setSeedStep(2));
      return;
    }

    onSubmit();
  };

  return (
    <Modal
      isOpen={seedWizard.isOpen}
      title="Generate starter hierarchy"
      description="Answer a few constrained questions and create a realistic board structure in one click."
      onClose={() => dispatch(closeSeedWizard())}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        {seedWizard.step === 1 ? (
          // Step 1 narrows the template family that the backend will generate.
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Project type"
              value={seedWizard.projectType}
              onChange={(value) =>
                dispatch(
                  setSeedField({
                    field: "projectType",
                    value,
                  })
                )
              }
            >
              <option>Campaign Launch</option>
              <option>Brand Refresh</option>
              <option>Product Marketing</option>
              <option>Editorial Production</option>
            </SelectField>

            <SelectField
              label="Team type"
              value={seedWizard.teamType}
              onChange={(value) =>
                dispatch(
                  setSeedField({
                    field: "teamType",
                    value,
                  })
                )
              }
            >
              <option>Brand Studio</option>
              <option>Performance Marketing</option>
              <option>Creative Ops</option>
              <option>Social Content</option>
            </SelectField>
          </div>
        ) : (
          // Step 2 tunes the size of the generated hierarchy and shows a readable preview.
          <div className="space-y-4 rounded-[24px] border border-white/10 bg-slate-900/80 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-200">
                <span>Campaign count</span>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={seedWizard.campaignCount}
                  onChange={(event) =>
                    dispatch(
                      setSeedField({
                        field: "campaignCount",
                        value: Number(event.target.value),
                      })
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200">
                <span>Include archive branch</span>
                <input
                  type="checkbox"
                  checked={seedWizard.includeArchive}
                  onChange={(event) =>
                    dispatch(
                      setSeedField({
                        field: "includeArchive",
                        value: event.target.checked,
                      })
                    )
                  }
                  className="h-4 w-4 accent-amber-400"
                />
              </label>
            </div>

            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-300">
                Preview
              </p>
              <p className="mt-3 text-sm text-slate-200">
                Creates a <strong>{seedWizard.projectType}</strong> workspace for the{" "}
                <strong>{seedWizard.teamType}</strong> team with{" "}
                <strong>{seedWizard.campaignCount}</strong> campaign branches, shared
                asset boards, and {seedWizard.includeArchive ? "an archive path." : "no archive path."}
              </p>
            </div>
          </div>
        )}

        {errorMessage ? (
          <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              seedWizard.step === 1
                ? dispatch(closeSeedWizard())
                : dispatch(setSeedStep(1))
            }
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300"
          >
            {seedWizard.step === 1 ? "Cancel" : "Back"}
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {seedWizard.step === 1
              ? "Continue"
              : isSubmitting
                ? "Generating..."
                : "Generate hierarchy"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
