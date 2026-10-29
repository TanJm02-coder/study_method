import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import type { Subject, Week } from "../types";
import { Spinner } from "../components/Spinner";
import { FilePanel } from "../components/FilePanel";
import { STAGE_META, fmtDate, relativeDays, weekStage } from "../lib/week";

type FullWeek = Week & { subject: Subject };

export function WeekPage() {
  const { weekId } = useParams();
  const navigate = useNavigate();
  const [week, setWeek] = useState<FullWeek | null>(null);
  const [savingFlag, setSavingFlag] = useState(false);

  const load = useCallback(async () => {
    if (!weekId) return;
    setWeek(await api.getWeek(weekId));
  }, [weekId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!week) return <Spinner />;

  const stage = weekStage(week, week.subject.preReadingDays);
  const meta = STAGE_META[stage];
  const lessonPassed = new Date(week.lessonDate) < new Date();

  async function patch(data: Partial<Week>) {
    if (!week) return;
    setSavingFlag(true);
    try {
      const updated = await api.updateWeek(week.id, data);
      setWeek({ ...week, ...updated });
    } finally {
      setSavingFlag(false);
    }
  }

  async function removeWeek() {
    if (!week) return;
    if (!confirm(`Delete Week ${week.number}?`)) return;
    await api.deleteWeek(week.id);
    navigate(`/subjects/${week.subjectId}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/subjects/${week.subjectId}`}
          className="text-sm text-slate-400 hover:text-slate-600"
        >
          ← {week.subject.name}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">
            <span className="text-slate-400">Week {week.number} ·</span> {week.title}
          </h1>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>
            {meta.label}
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Lesson {relativeDays(week.lessonDate)} · {fmtDate(week.lessonDate)}
        </p>
      </div>

      {/* Stage hint */}
      <StageHint stage={stage} />

      {/* BEFORE */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-blue-800">
            🔵 Before the lesson — Pre-reading
          </h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-blue-700">
            <input
              type="checkbox"
              checked={week.preReadDone}
              disabled={savingFlag}
              onChange={(e) => patch({ preReadDone: e.target.checked })}
              className="h-4 w-4 accent-blue-600"
            />
            Pre-reading done
          </label>
        </div>
        <p className="mb-2 text-sm text-blue-700/80">
          What do you already know? What are your goals / questions going in?
        </p>
        <AutosaveNotes
          value={week.beforeNotes}
          placeholder="Jot down what you expect to learn, prior knowledge, questions…"
          onSave={(v) => patch({ beforeNotes: v })}
        />
      </section>

      {/* AFTER */}
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-emerald-800">
            🟢 After the lesson — Consolidation
          </h2>
          <div className="flex items-center gap-4">
            <Rating
              value={week.understanding}
              onChange={(v) => patch({ understanding: v })}
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-emerald-700">
              <input
                type="checkbox"
                checked={week.afterDone}
                disabled={savingFlag}
                onChange={(e) => patch({ afterDone: e.target.checked })}
                className="h-4 w-4 accent-emerald-600"
              />
              Consolidated
            </label>
          </div>
        </div>
        {!lessonPassed && !week.afterDone && (
          <p className="mb-2 text-xs text-emerald-700/70">
            Tip: fill this in after the lesson — but you can start anytime.
          </p>
        )}
        <p className="mb-2 text-sm text-emerald-700/80">
          Key takeaways, worked examples, things that surprised you, gaps to revisit.
        </p>
        <AutosaveNotes
          value={week.afterNotes}
          placeholder="What did you actually learn? Summaries, formulas, mistakes to avoid…"
          onSave={(v) => patch({ afterNotes: v })}
        />
      </section>

      {/* FILES */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold">📎 Files & past-year questions</h2>
        <FilePanel weekId={week.id} files={week.files} onChange={load} />
      </section>

      <div className="pt-2">
        <button onClick={removeWeek} className="text-sm text-red-500 hover:underline">
          Delete this week
        </button>
      </div>
    </div>
  );
}

function StageHint({ stage }: { stage: ReturnType<typeof weekStage> }) {
  const map: Record<string, string> = {
    upcoming: "This lesson is more than a week away. Upload any material early if you like.",
    preReading:
      "📖 Your lesson is coming up within a week — do the pre-reading and fill in the Before section.",
    today: "🎓 Lesson is today! Review your pre-reading notes beforehand.",
    after: "✍️ The lesson has passed — consolidate what you learned in the After section.",
    done: "✅ This week is consolidated. Revisit it anytime in Final Revision.",
  };
  return (
    <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
      {map[stage]}
    </div>
  );
}

function Rating({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-1" title="How well did you understand it?">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(value === n ? null : n)}
          className={`text-lg leading-none transition ${
            value && n <= value ? "text-amber-400" : "text-slate-300 hover:text-amber-200"
          }`}
          aria-label={`${n} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/** Textarea that autosaves ~700ms after you stop typing. */
function AutosaveNotes({
  value,
  placeholder,
  onSave,
}: {
  value: string;
  placeholder?: string;
  onSave: (v: string) => void;
}) {
  const [text, setText] = useState(value);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep in sync when the week changes underneath us.
  useEffect(() => {
    setText(value);
  }, [value]);

  function onChange(v: string) {
    setText(v);
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await onSave(v);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1200);
    }, 700);
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed focus:border-slate-400 focus:outline-none"
      />
      <div className="mt-1 h-4 text-right text-xs text-slate-400">
        {status === "saving" && "Saving…"}
        {status === "saved" && "Saved ✓"}
      </div>
    </div>
  );
}
