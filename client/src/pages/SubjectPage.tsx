import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import type { Subject, Week } from "../types";
import { Spinner } from "../components/Spinner";
import { STAGE_META, fmtDate, relativeDays, weekStage } from "../lib/week";

function toDateInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function SubjectPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  async function load() {
    if (!subjectId) return;
    setSubject(await api.getSubject(subjectId));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  if (!subject) return <Spinner />;

  async function removeSubject() {
    if (!subject) return;
    if (!confirm(`Delete subject "${subject.name}" and all its weeks?`)) return;
    await api.deleteSubject(subject.id);
    navigate("/");
  }

  const nextNumber =
    subject.weeks.reduce((m, w) => Math.max(m, w.number), 0) + 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/" className="text-sm text-slate-400 hover:text-slate-600">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold">{subject.name}</h1>
          <p className="text-sm text-slate-500">
            {subject.examDate && (
              <span className="text-red-600">Exam on {fmtDate(subject.examDate)} · </span>
            )}
            Pre-reading prompts {subject.preReadingDays} day
            {subject.preReadingDays === 1 ? "" : "s"} before each lesson
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/subjects/${subject.id}/revision`}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
          >
            🎯 Final Revision
          </Link>
          <button
            onClick={() => {
              setShowSettings((v) => !v);
              setShowAdd(false);
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ⚙ Settings
          </button>
          <button
            onClick={() => {
              setShowAdd((v) => !v);
              setShowSettings(false);
            }}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            ＋ Add weeks
          </button>
        </div>
      </div>

      {showSettings && (
        <SubjectSettings
          subject={subject}
          onDone={() => {
            setShowSettings(false);
            load();
          }}
        />
      )}

      {showAdd && (
        <AddWeeks
          subjectId={subject.id}
          startNumber={nextNumber}
          onDone={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}

      {subject.weeks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No weeks yet. Click <strong>Add weeks</strong> to build your schedule.
        </div>
      ) : (
        <ul className="space-y-2">
          {subject.weeks.map((w) => (
            <WeekRow
              key={w.id}
              week={w}
              preReadingDays={subject.preReadingDays}
              onChange={load}
            />
          ))}
        </ul>
      )}

      <div className="pt-4">
        <button
          onClick={removeSubject}
          className="text-sm text-red-500 hover:underline"
        >
          Delete this subject
        </button>
      </div>
    </div>
  );
}

function AddWeeks({
  subjectId,
  startNumber,
  onDone,
}: {
  subjectId: string;
  startNumber: number;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // single
  const [number, setNumber] = useState(startNumber);
  const [title, setTitle] = useState("");
  const [lessonDate, setLessonDate] = useState("");

  // bulk
  const [firstDate, setFirstDate] = useState("");
  const [titlesText, setTitlesText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function addSingle(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !lessonDate) return;
    setBusy(true);
    setError("");
    try {
      await api.createWeek({ subjectId, number, title, lessonDate });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function addBulk(e: React.FormEvent) {
    e.preventDefault();
    const titles = titlesText
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    if (titles.length === 0 || !firstDate) {
      setError("Add a first lesson date and at least one title.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const base = new Date(firstDate);
      const weeks = titles.map((t, i) => {
        const d = new Date(base);
        d.setDate(base.getDate() + i * 7);
        return {
          number: startNumber + i,
          title: t,
          lessonDate: d.toISOString(),
        };
      });
      await api.createWeeksBulk(subjectId, weeks);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 inline-flex rounded-lg bg-slate-100 p-1 text-sm">
        <button
          onClick={() => setMode("single")}
          className={`rounded-md px-3 py-1 font-medium ${mode === "single" ? "bg-white shadow" : "text-slate-500"}`}
        >
          One week
        </button>
        <button
          onClick={() => setMode("bulk")}
          className={`rounded-md px-3 py-1 font-medium ${mode === "bulk" ? "bg-white shadow" : "text-slate-500"}`}
        >
          Whole schedule
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {mode === "single" ? (
        <form onSubmit={addSingle} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-sm">
            <span className="mb-1 font-medium text-slate-600">Week #</span>
            <input
              type="number"
              value={number}
              onChange={(e) => setNumber(Number(e.target.value))}
              className="w-20 rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 font-medium text-slate-600">Lesson title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. First Law of Thermodynamics"
              className="w-64 rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 font-medium text-slate-600">Lesson date</span>
            <input
              type="date"
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            Add week
          </button>
        </form>
      ) : (
        <form onSubmit={addBulk} className="space-y-3">
          <p className="text-sm text-slate-500">
            Paste one lesson title per line. Lessons are scheduled weekly from the
            first date (numbering starts at {startNumber}).
          </p>
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col text-sm">
              <span className="mb-1 font-medium text-slate-600">
                First lesson date
              </span>
              <input
                type="date"
                value={firstDate}
                onChange={(e) => setFirstDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
          <textarea
            value={titlesText}
            onChange={(e) => setTitlesText(e.target.value)}
            rows={6}
            placeholder={"Introduction\nKinematics\nNewton's Laws\nEnergy & Work"}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {busy ? "Adding…" : "Create schedule"}
          </button>
        </form>
      )}
    </div>
  );
}

function WeekRow({
  week,
  preReadingDays,
  onChange,
}: {
  week: Week;
  preReadingDays: number;
  onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(week.title);
  const [lessonDate, setLessonDate] = useState(toDateInput(week.lessonDate));
  const [busy, setBusy] = useState(false);

  const stage = weekStage(week, preReadingDays);
  const meta = STAGE_META[stage];

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !lessonDate) return;
    setBusy(true);
    try {
      await api.updateWeek(week.id, {
        title: title.trim(),
        lessonDate: new Date(lessonDate).toISOString(),
      });
      setEditing(false);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <li>
        <form
          onSubmit={save}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-300 bg-white p-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-600">
            {week.number}
          </div>
          <label className="flex flex-1 flex-col text-sm">
            <span className="mb-1 font-medium text-slate-600">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 font-medium text-slate-600">Lesson date</span>
            <input
              type="date"
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setTitle(week.title);
              setLessonDate(toDateInput(week.lessonDate));
              setEditing(false);
            }}
            className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-600">
        {week.number}
      </div>
      <Link to={`/weeks/${week.id}`} className="min-w-0 flex-1">
        <p className="truncate font-medium">{week.title}</p>
        <p className="text-xs text-slate-500">
          {fmtDate(week.lessonDate)} · {relativeDays(week.lessonDate)}
          {week._count ? ` · ${week._count.files} file(s)` : ""}
        </p>
      </Link>
      <div className="flex items-center gap-2">
        {week.preReadDone && (
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-600">
            pre ✓
          </span>
        )}
        {week.understanding != null && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
            {"★".repeat(week.understanding)}
          </span>
        )}
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>
          {meta.label}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="rounded-md px-2 py-1 text-xs text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
          title="Edit week"
        >
          ✎
        </button>
      </div>
    </li>
  );
}

function SubjectSettings({
  subject,
  onDone,
}: {
  subject: Subject;
  onDone: () => void;
}) {
  const [name, setName] = useState(subject.name);
  const [examDate, setExamDate] = useState(
    subject.examDate ? toDateInput(subject.examDate) : ""
  );
  const [preReadingDays, setPreReadingDays] = useState(subject.preReadingDays);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.updateSubject(subject.id, {
        name: name.trim() || subject.name,
        examDate: examDate || null,
        preReadingDays,
      });
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <label className="flex flex-col text-sm">
        <span className="mb-1 font-medium text-slate-600">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-56 rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col text-sm">
        <span className="mb-1 font-medium text-slate-600">Exam date</span>
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
          <span className="text-slate-500">days</span>
        </span>
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
