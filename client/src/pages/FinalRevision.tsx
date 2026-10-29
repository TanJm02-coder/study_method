import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import type { Subject, StudyFile } from "../types";
import { Spinner } from "../components/Spinner";
import { fmtDate } from "../lib/week";

export function FinalRevision() {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [onlyWeak, setOnlyWeak] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (subjectId) api.getSubject(subjectId).then(setSubject);
  }, [subjectId]);

  const stats = useMemo(() => {
    if (!subject) return null;
    const weeks = subject.weeks;
    const rated = weeks.filter((w) => w.understanding != null);
    const avg = rated.length
      ? rated.reduce((s, w) => s + (w.understanding || 0), 0) / rated.length
      : null;
    return {
      total: weeks.length,
      consolidated: weeks.filter((w) => w.afterDone).length,
      avg,
      files: weeks.reduce((s, w) => s + w.files.length, 0),
    };
  }, [subject]);

  if (!subject || !stats) return <Spinner />;

  const q = query.trim().toLowerCase();
  const weeks = subject.weeks.filter((w) => {
    if (onlyWeak && !(w.understanding != null && w.understanding <= 2)) return false;
    if (!q) return true;
    return (
      w.title.toLowerCase().includes(q) ||
      w.beforeNotes.toLowerCase().includes(q) ||
      w.afterNotes.toLowerCase().includes(q)
    );
  });

  const pastQuestions = subject.weeks
    .flatMap((w) => w.files.map((f) => ({ f, week: w })))
    .filter((x) => x.f.category === "pastQuestion");

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/subjects/${subject.id}`}
          className="no-print text-sm text-slate-400 hover:text-slate-600"
        >
          ← {subject.name}
        </Link>
        <h1 className="text-2xl font-bold">🎯 Final Revision — {subject.name}</h1>
        {subject.examDate && (
          <p className="text-sm text-red-600">Exam on {fmtDate(subject.examDate)}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Weeks" value={String(stats.total)} />
        <Stat label="Consolidated" value={`${stats.consolidated}/${stats.total}`} />
        <Stat
          label="Avg understanding"
          value={stats.avg ? `${stats.avg.toFixed(1)} / 5` : "—"}
        />
        <Stat label="Files" value={String(stats.files)} />
      </div>

      {/* Controls */}
      <div className="no-print flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes & titles…"
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={onlyWeak}
            onChange={(e) => setOnlyWeak(e.target.checked)}
            className="h-4 w-4 accent-red-500"
          />
          Only weak spots (★≤2)
        </label>
        <button
          onClick={() => window.print()}
          className="ml-auto rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          🖨 Print / Save as PDF
        </button>
      </div>

      {/* Past-year questions quick access */}
      {pastQuestions.length > 0 && (
        <section className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4">
          <h2 className="mb-2 font-semibold text-purple-800">
            📝 Past-year questions ({pastQuestions.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {pastQuestions.map(({ f, week }) => (
              <FileChip key={f.id} file={f} badge={`W${week.number}`} />
            ))}
          </div>
        </section>
      )}

      {/* Week-by-week review */}
      <div className="space-y-4">
        {weeks.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            Nothing matches your filters.
          </p>
        )}
        {weeks.map((w) => (
          <section
            key={w.id}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">
                <span className="text-slate-400">Week {w.number} ·</span> {w.title}
              </h3>
              <div className="flex items-center gap-2 text-xs">
                {w.understanding != null && (
                  <span className="text-amber-400">
                    {"★".repeat(w.understanding)}
                    <span className="text-slate-200">
                      {"★".repeat(5 - w.understanding)}
                    </span>
                  </span>
                )}
                <Link
                  to={`/weeks/${w.id}`}
                  className="no-print rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
                >
                  Open ↗
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <NoteBlock
                label="🔵 Before"
                text={w.beforeNotes}
                tone="text-blue-700"
              />
              <NoteBlock
                label="🟢 After"
                text={w.afterNotes}
                tone="text-emerald-700"
              />
            </div>

            {w.files.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                {w.files.map((f) => (
                  <FileChip key={f.id} file={f} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function NoteBlock({
  label,
  text,
  tone,
}: {
  label: string;
  text: string;
  tone: string;
}) {
  return (
    <div>
      <p className={`mb-1 text-sm font-semibold ${tone}`}>{label}</p>
      {text.trim() ? (
        <p className="whitespace-pre-wrap text-sm text-slate-700">{text}</p>
      ) : (
        <p className="text-sm italic text-slate-300">No notes.</p>
      )}
    </div>
  );
}

function FileChip({ file, badge }: { file: StudyFile; badge?: string }) {
  return (
    <a
      href={api.fileUrl(file.id)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-50"
    >
      {badge && (
        <span className="rounded bg-slate-100 px-1 font-medium text-slate-500">
          {badge}
        </span>
      )}
      📎 {file.originalName}
    </a>
  );
}
