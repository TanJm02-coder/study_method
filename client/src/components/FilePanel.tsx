import { useRef, useState } from "react";
import type { StudyFile, FileCategory } from "../types";
import { api } from "../api";
import { fmtSize } from "../lib/week";

const CATEGORY_LABEL: Record<FileCategory, string> = {
  preReading: "Pre-reading",
  pastQuestion: "Past-year question",
  material: "Material",
};

const CATEGORY_STYLE: Record<FileCategory, string> = {
  preReading: "bg-blue-100 text-blue-700",
  pastQuestion: "bg-purple-100 text-purple-700",
  material: "bg-slate-100 text-slate-600",
};

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return "🖼️";
  if (mime === "application/pdf") return "📄";
  if (mime.includes("word") || mime.includes("document")) return "📝";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "📊";
  return "📎";
}

const previewable = (mime: string) =>
  mime.startsWith("image/") || mime === "application/pdf";

export function FilePanel({
  weekId,
  files,
  onChange,
}: {
  weekId: string;
  files: StudyFile[];
  onChange: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<FileCategory>("material");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<StudyFile | null>(null);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setUploading(true);
    try {
      await api.uploadFiles(weekId, list, category);
      onChange();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(f: StudyFile) {
    if (!confirm(`Delete "${f.originalName}"?`)) return;
    await api.deleteFile(f.id);
    if (preview?.id === f.id) setPreview(null);
    onChange();
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as FileCategory)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="material">Material</option>
          <option value="preReading">Pre-reading</option>
          <option value="pastQuestion">Past-year question</option>
        </select>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "＋ Upload files"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {files.length === 0 ? (
        <p className="text-sm text-slate-400">No files yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-3 py-2">
              <span className="text-lg">{fileIcon(f.mimeType)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.originalName}</p>
                <p className="text-xs text-slate-400">{fmtSize(f.size)}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_STYLE[f.category]}`}
              >
                {CATEGORY_LABEL[f.category]}
              </span>
              {previewable(f.mimeType) && (
                <button
                  onClick={() => setPreview(f)}
                  className="rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                >
                  View
                </button>
              )}
              <a
                href={api.fileUrl(f.id, true)}
                className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              >
                Download
              </a>
              <button
                onClick={() => remove(f)}
                className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="flex h-full max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="truncate text-sm font-medium">{preview.originalName}</span>
              <button
                onClick={() => setPreview(null)}
                className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                ✕ Close
              </button>
            </div>
            {preview.mimeType.startsWith("image/") ? (
              <img
                src={api.fileUrl(preview.id)}
                alt={preview.originalName}
                className="mx-auto max-h-full max-w-full object-contain"
              />
            ) : (
              <iframe
                src={api.fileUrl(preview.id)}
                title={preview.originalName}
                className="h-full w-full flex-1 rounded-lg border"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
