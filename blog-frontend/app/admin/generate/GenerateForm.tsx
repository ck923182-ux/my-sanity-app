"use client";

// app/admin/generate/GenerateForm.tsx
import { useEffect, useRef, useState } from "react";
import { startGeneration, checkGenerationStatus } from "./actions";

interface Option {
  _id: string;
  label: string;
}

type Phase =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "polling"; taskId: string; note?: string }
  | { kind: "done"; studioEditUrl: string }
  | { kind: "error"; message: string };

const AUDIENCES = ["beginner", "intermediate", "advanced"] as const;
const TONES = ["professional", "casual", "technical", "friendly"] as const;
const LENGTHS = ["short", "medium", "long"] as const;

export function GenerateForm({
  categories,
  authors,
}: {
  categories: Option[];
  authors: Option[];
}) {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>("intermediate");
  const [tone, setTone] = useState<(typeof TONES)[number]>("professional");
  const [length, setLength] = useState<(typeof LENGTHS)[number]>("medium");
  const [categoryId, setCategoryId] = useState(categories[0]?._id ?? "");
  const [authorId, setAuthorId] = useState(authors[0]?._id ?? "");
  const [keywords, setKeywords] = useState("");

  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function startPolling(taskId: string) {
    setPhase({ kind: "polling", taskId });
    pollRef.current = setInterval(async () => {
      const result = await checkGenerationStatus(taskId, categoryId, authorId);

      if (!result.ok) {
        clearInterval(pollRef.current!);
        setPhase({ kind: "error", message: result.error });
        return;
      }
      if (result.state === "running") return; // keep polling
      if (result.state === "waiting") {
        setPhase({ kind: "polling", taskId, note: result.description });
        return;
      }
      clearInterval(pollRef.current!);
      if (result.state === "completed") {
        setPhase({ kind: "done", studioEditUrl: result.studioEditUrl });
      } else {
        // already_created - a previous poll already finished this task
        setPhase({ kind: "idle" });
      }
    }, 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId || !authorId) {
      setPhase({ kind: "error", message: "Add a category and author to the CMS first." });
      return;
    }

    setPhase({ kind: "starting" });
    const result = await startGeneration({
      topic,
      audience,
      tone,
      length,
      keywords,
      categoryId,
      authorId,
    });

    if (!result.ok) {
      setPhase({ kind: "error", message: result.error });
      return;
    }
    startPolling(result.taskId);
  }

  const isBusy = phase.kind === "starting" || phase.kind === "polling";

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <Field label="Topic">
        <input
          required
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Next.js Middleware"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Audience">
          <Select value={audience} onChange={setAudience} options={AUDIENCES} />
        </Field>
        <Field label="Tone">
          <Select value={tone} onChange={setTone} options={TONES} />
        </Field>
        <Field label="Length">
          <Select value={length} onChange={setLength} options={LENGTHS} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Category">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm capitalize focus:border-gray-900 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Author">
          <select
            value={authorId}
            onChange={(e) => setAuthorId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          >
            {authors.map((a) => (
              <option key={a._id} value={a._id}>
                {a.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Keywords (comma separated, optional)">
        <input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="nextjs, react, seo"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </Field>

      <button
        type="submit"
        disabled={isBusy}
        className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {isBusy ? "Generating..." : "Generate"}
      </button>

      <StatusMessage phase={phase} />
    </form>
  );
}

function StatusMessage({ phase }: { phase: Phase }) {
  if (phase.kind === "idle" || phase.kind === "starting") return null;

  if (phase.kind === "polling") {
    return (
      <p className="text-sm text-gray-500">
        {phase.note ?? "Manus is writing the post. This usually takes a couple of minutes."}
      </p>
    );
  }
  if (phase.kind === "error") {
    return <p className="text-sm text-red-600">{phase.message}</p>;
  }
  return (
    <p className="text-sm text-green-700">
      Draft ready.{" "}
      <a href={phase.studioEditUrl} className="underline">
        Open in Studio to review and publish
      </a>
      .
    </p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm capitalize focus:border-gray-900 focus:outline-none"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
