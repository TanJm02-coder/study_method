import { Router } from "express";
import { prisma } from "../db.js";

export const subjectsRouter = Router();

// List all subjects with their weeks (and file counts)
subjectsRouter.get("/", async (_req, res) => {
  const subjects = await prisma.subject.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      weeks: {
        orderBy: { number: "asc" },
        include: { _count: { select: { files: true } } },
      },
    },
  });
  res.json(subjects);
});

// Get one subject (full detail)
subjectsRouter.get("/:id", async (req, res) => {
  const subject = await prisma.subject.findUnique({
    where: { id: req.params.id },
    include: {
      weeks: {
        orderBy: { number: "asc" },
        include: { files: { orderBy: { createdAt: "asc" } } },
      },
    },
  });
  if (!subject) return res.status(404).json({ error: "Subject not found" });
  res.json(subject);
});

// Create a subject
subjectsRouter.post("/", async (req, res) => {
  const { name, examDate, preReadingDays } = req.body as {
    name?: string;
    examDate?: string;
    preReadingDays?: number;
  };
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "name is required" });
  }
  const subject = await prisma.subject.create({
    data: {
      name: name.trim(),
      examDate: examDate ? new Date(examDate) : null,
      ...(preReadingDays != null
        ? { preReadingDays: clampDays(preReadingDays) }
        : {}),
    },
  });
  res.status(201).json(subject);
});

// Update a subject
subjectsRouter.patch("/:id", async (req, res) => {
  const { name, examDate, preReadingDays } = req.body as {
    name?: string;
    examDate?: string | null;
    preReadingDays?: number;
  };
  const subject = await prisma.subject.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(examDate !== undefined
        ? { examDate: examDate ? new Date(examDate) : null }
        : {}),
      ...(preReadingDays !== undefined
        ? { preReadingDays: clampDays(preReadingDays) }
        : {}),
    },
  });
  res.json(subject);
});

function clampDays(n: number): number {
  const v = Math.round(Number(n));
  if (Number.isNaN(v)) return 7;
  return Math.min(60, Math.max(1, v));
}

// Delete a subject (cascades to weeks + files rows)
subjectsRouter.delete("/:id", async (req, res) => {
  await prisma.subject.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
