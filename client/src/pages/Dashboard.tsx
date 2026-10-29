import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { Subject, Week } from "../types";
import { Spinner } from "../components/Spinner";
import {
  STAGE_META,
  daysUntil,
  fmtDate,
  relativeDays,
  weekStage,
} from "../lib/week";

interface Actionable {
  subject: Subject;
  week: Week;
}

export function Dashboard() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [name, setName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [preReadingDays, setPreReadingDays] = useState(7);
  const [creating, setCreating] = useState(false);

  async function load() {
    setSubjects(await api.listSubjects());
  }
  useEffect(() => {
    load();
  }, []);

  async function createSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.createSubject({
        name,
        examDate: examDate || null,
        preReadingDays,
      });
      setName("");
      setExamDate("");
      setPreReadingDays(7);
      await load();
    } finally {
      setCreating(false);
    }
  }

  if (!subjects) return <Spinner />;

  // Build the "what to do now" list: pre-reading due, lessons today, or to consolidate.
  const todo: Actionable[] = [];
  for (const s of subjects) {
    for (const w of s.weeks) {
      const stage = weekStage(w, s.preReadingDays);
      if (stage === "preReading" || stage === "today" || stage === "after") {
        todo.push({ subject: s, week: w });
      }
    }
  }
  todo.sort((a, b) => daysUntil(a.week.lessonDate) - daysUntil(b.week.lessonDate));

  return (
    <div className="space-y-8">
      {/* This week's focus */}
      <section>
        <h1 className="mb-1 text-2xl font-bold">This week's focus</h1>
        <p className="mb-4 text-sm text-slate-500">
          What to do now, based on today&apos;s date.
        </p>

        {todo.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            Nothing due right now. Add a subject and schedule below to get started. 🎯
          </div>
        ) : (
          <ul className="space-y-2">
            {todo.map(({ subject, week }) => {
              const stage = weekStage(week, subject.preReadingDays);
              const meta = STAGE_META[stage];
              return (
                <li key={week.id}>
                  <Link
                    to={`/weeks/${week.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        <span className="text-slate-400">{subject.name} · W{week.number}</span>{" "}
                        {week.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        Lesson {relativeDays(week.lessonDate)} · {fmtDate(week.lessonDate)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}
                    >
                      {stage === "preReading"
                        ? "Do pre-reading"
                        : stage === "today"
                          ? "Lesson today"
                          : "Consolidate"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Subjects */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Subjects</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {subjects.map((s) => {
            const total = s.weeks.length;
            const done = s.weeks.filter((w) => w.afterDone).length;
            return (
              <Link
                key={s.id}
                to={`/subjects/${s.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{s.name}</h3>
                  {s.examDate && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                      Exam {fmtDate(s.examDate)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {total} week{total === 1 ? "" : "s"} · {done} consolidated
                </p>
                {total > 0 && (
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${(done / total) * 100}%` }}
                    />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* New subject */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Add a subject</h2>
        <form
          onSubmit={createSubject}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <label className="flex flex-col text-sm">
            <span className="mb-1 font-medium text-slate-600">Subject name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Organic Chemistry"
              className="w-56 rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 font-medium text-slate-600">Exam date (optional)</span>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 font-medium text-slate-600">Pre-reading window</span>
            <span className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={60}
                value={preReadingDays}
                onChange={(e) => setPreReadingDays(Number(e.target.value))}
                className="w-20 rounded-lg border border-slate-300 px-3 py-2"
              />
              <span className="text-slate-500">days before</span>
            </span>
          </label>
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {creating ? "Adding…" : "Add subject"}
          </button>
        </form>
      </section>
    </div>
  );
}
