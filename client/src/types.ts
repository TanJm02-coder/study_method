export type FileCategory = "preReading" | "pastQuestion" | "material";

export interface StudyFile {
  id: string;
  weekId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  createdAt: string;
}

export interface Week {
  id: string;
  subjectId: string;
  number: number;
  title: string;
  lessonDate: string;
  beforeNotes: string;
  preReadDone: boolean;
  afterNotes: string;
  afterDone: boolean;
  understanding: number | null;
  createdAt: string;
  files: StudyFile[];
  _count?: { files: number };
}

export interface Subject {
  id: string;
  name: string;
  examDate: string | null;
  preReadingDays: number;
  createdAt: string;
  weeks: Week[];
}

export type WeekStage = "upcoming" | "preReading" | "today" | "after" | "done";
