import { Router } from "express";
import { prisma } from "../db.js";

export const weeksRouter = Router();

// Create a week under a subject
weeksRouter.post("/", async (req, res) => {
  const { subjectId, number, title, lessonDate } = req.body as {
    subjectId?: string;
    number?: number;
    title?: string;
    lessonDate?: string;
  };
  if (!subjectId || number == null || !title || !lessonDate) {
    return res
      .status(400)
      .json({ error: "subjectId, number, title and lessonDate are required" });
  }
  try {
    const week = await prisma.week.create({
      data: {
        subjectId,
        number: Number(number),
        title: title.trim(),
        lessonDate: new Date(lessonDate),
      },
      include: { files: true },
    });
    res.status(201).json(week);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res
        .status(409)
        .json({ error: `Week ${number} already exists for this subject` });
    }
    throw err;
  }
});

// Bulk-create a schedule of weeks
weeksRouter.post("/bulk", async (req, res) => {
  const { subjectId, weeks } = req.body as {
    subjectId?: string;
    weeks?: Array<{ number: number; title: string; lessonDate: string }>;
  };
  if (!subjectId || !Array.isArray(weeks) || weeks.length === 0) {
    return res.status(400).json({ error: "subjectId and weeks[] are required" });
  }
  const created = await prisma.$transaction(
    weeks.map((w) =>
      prisma.week.create({
        data: {
          subjectId,
          number: Number(w.number),
          title: w.title.trim(),
          lessonDate: new Date(w.lessonDate),
        },
      })
    )
  );
  res.status(201).json(created);
});

// Get a single week with files
weeksRouter.get("/:id", async (req, res) => {
  const week = await prisma.week.findUnique({
    where: { id: req.params.id },
    include: { files: { orderBy: { createdAt: "asc" } }, subject: true },
  });
  if (!week) return res.status(404).json({ error: "Week not found" });
  res.json(week);
});

// Update a week (notes, flags, rating, title, date)
weeksRouter.patch("/:id", async (req, res) => {
  const {
    title,
    lessonDate,
    beforeNotes,
    preReadDone,
    afterNotes,
    afterDone,
    understanding,
  } = req.body as Record<string, unknown>;

  const week = await prisma.week.update({
    where: { id: req.params.id },
    data: {
      ...(title !== undefined ? { title: String(title).trim() } : {}),
      ...(lessonDate !== undefined ? { lessonDate: new Date(String(lessonDate)) } : {}),
      ...(beforeNotes !== undefined ? { beforeNotes: String(beforeNotes) } : {}),
      ...(preReadDone !== undefined ? { preReadDone: Boolean(preReadDone) } : {}),
      ...(afterNotes !== undefined ? { afterNotes: String(afterNotes) } : {}),
      ...(afterDone !== undefined ? { afterDone: Boolean(afterDone) } : {}),
      ...(understanding !== undefined
        ? { understanding: understanding === null ? null : Number(understanding) }
        : {}),
    },
    include: { files: { orderBy: { createdAt: "asc" } } },
  });
  res.json(week);
});

// Delete a week
weeksRouter.delete("/:id", async (req, res) => {
  await prisma.week.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
