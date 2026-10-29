import express from "express";
import cors from "cors";
import { PORT } from "./config.js";
import { subjectsRouter } from "./routes/subjects.js";
import { weeksRouter } from "./routes/weeks.js";
import { filesRouter } from "./routes/files.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/subjects", subjectsRouter);
app.use("/api/weeks", weeksRouter);
app.use("/api/files", filesRouter);

// Basic error handler (e.g. multer file-size errors)
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Server error" });
  }
);

app.listen(PORT, () => {
  console.log(`📚 Study Notes API running on http://localhost:${PORT}`);
});
