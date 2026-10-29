import type { Subject, Week, StudyFile, FileCategory } from "./types";

const BASE = "/api";

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Subjects
  listSubjects: () => req<Subject[]>("/subjects"),
  getSubject: (id: string) => req<Subject>(`/subjects/${id}`),
  createSubject: (data: {
    name: string;
    examDate?: string | null;
    preReadingDays?: number;
  }) => req<Subject>("/subjects", { method: "POST", body: JSON.stringify(data) }),
  updateSubject: (
    id: string,
    data: { name?: string; examDate?: string | null; preReadingDays?: number }
  ) => req<Subject>(`/subjects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteSubject: (id: string) =>
    req<void>(`/subjects/${id}`, { method: "DELETE" }),

  // Weeks
  getWeek: (id: string) => req<Week & { subject: Subject }>(`/weeks/${id}`),
  createWeek: (data: {
    subjectId: string;
    number: number;
    title: string;
    lessonDate: string;
  }) => req<Week>("/weeks", { method: "POST", body: JSON.stringify(data) }),
  createWeeksBulk: (
    subjectId: string,
    weeks: { number: number; title: string; lessonDate: string }[]
  ) =>
    req<Week[]>("/weeks/bulk", {
      method: "POST",
      body: JSON.stringify({ subjectId, weeks }),
    }),
  updateWeek: (id: string, data: Partial<Week>) =>
    req<Week>(`/weeks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteWeek: (id: string) => req<void>(`/weeks/${id}`, { method: "DELETE" }),

  // Files
  uploadFiles: async (weekId: string, files: FileList | File[], category: FileCategory) => {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    fd.append("category", category);
    const res = await fetch(`${BASE}/files/week/${weekId}`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json() as Promise<StudyFile[]>;
  },
  deleteFile: (id: string) => req<void>(`/files/${id}`, { method: "DELETE" }),
  fileUrl: (id: string, download = false) =>
    `${BASE}/files/${id}${download ? "?download=1" : ""}`,
};
