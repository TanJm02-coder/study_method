# 📚 Study Notes

A full-stack personal study app. Organize your course into a **schedule of weeks**, upload any study material (past-year questions, PDFs, images of handwritten notes, slides), and work through each lesson with a **Before / After** flow. When exams approach, a **Final Revision** view pulls everything together.

## How it works

1. **Create a subject** and add a **schedule of weeks**. Each week has a *lesson date*. Each subject has a configurable **pre-reading window** (default 7 days) that controls how far ahead you get nudged.
2. The **Dashboard** looks at today's date and tells you what to do:
   - If a lesson is coming up within the pre-reading window → it prompts you to do the **pre-reading** for that week.
   - After the lesson date passes → it nudges you to write your **after-lesson** consolidation.
3. For each week you can:
   - 🔵 Write **Before (pre-reading)** notes + goals.
   - 🟢 Write **After (consolidation)** notes + rate how well you understood it.
   - 📎 Upload **files** (PDF, images, Word, PPT, text) — PDFs/images preview inline.
4. 🎯 **Final Revision** mode lists every week, its key notes, and attached material in one place for exam prep. Search across all notes, filter to **weak spots** (understanding ★≤2), and **Print / Save as PDF** a clean study sheet of whatever's on screen.

You can also **edit** weeks (title & date) inline, and tweak each subject's name, exam date, and pre-reading window from its **⚙ Settings** panel.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | Node + Express + TypeScript |
| Database | SQLite via Prisma |
| File storage | Local disk (`server/uploads`) |

## Getting started

```bash
# from the repo root — installs everything and sets up the database
npm run setup

# run server (http://localhost:4000) + client (http://localhost:5173) together
npm run dev
```

Then open http://localhost:5173.

## Project layout

```
.
├── client/        # React + Vite frontend
├── server/        # Express API + Prisma + SQLite
│   ├── prisma/    # schema + sqlite db
│   └── uploads/   # uploaded files (gitignored)
└── package.json   # root scripts (dev / setup)
```
