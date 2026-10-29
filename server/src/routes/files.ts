import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { prisma } from "../db.js";
import { UPLOAD_DIR } from "../config.js";

export const filesRouter = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// Upload one or more files to a week
filesRouter.post("/week/:weekId", upload.array("files", 20), async (req, res) => {
  const week = await prisma.week.findUnique({ where: { id: req.params.weekId } });
  if (!week) return res.status(404).json({ error: "Week not found" });

  const category = (req.body?.category as string) || "material";
  const uploaded = (req.files as Express.Multer.File[]) || [];

  const records = await prisma.$transaction(
    uploaded.map((f) =>
      prisma.file.create({
        data: {
          weekId: week.id,
          originalName: f.originalname,
          storedName: f.filename,
          mimeType: f.mimetype,
          size: f.size,
          category,
        },
      })
    )
  );
  res.status(201).json(records);
});

// Stream / preview a file inline
filesRouter.get("/:id", async (req, res) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!file) return res.status(404).json({ error: "File not found" });
  const full = path.join(UPLOAD_DIR, file.storedName);
  if (!fs.existsSync(full)) return res.status(404).json({ error: "File missing on disk" });

  res.setHeader("Content-Type", file.mimeType);
  const disposition = req.query.download ? "attachment" : "inline";
  res.setHeader(
    "Content-Disposition",
    `${disposition}; filename="${encodeURIComponent(file.originalName)}"`
  );
  fs.createReadStream(full).pipe(res);
});

// Delete a file (db row + disk)
filesRouter.delete("/:id", async (req, res) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!file) return res.status(404).json({ error: "File not found" });
  const full = path.join(UPLOAD_DIR, file.storedName);
  fs.promises.unlink(full).catch(() => {});
  await prisma.file.delete({ where: { id: file.id } });
  res.status(204).end();
});
