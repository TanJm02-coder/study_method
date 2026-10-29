import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { SubjectPage } from "./pages/SubjectPage";
import { WeekPage } from "./pages/WeekPage";
import { FinalRevision } from "./pages/FinalRevision";

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          isActive
            ? "bg-slate-800 text-white"
            : "text-slate-600 hover:bg-slate-200"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function App() {
  const location = useLocation();
  // Show the Final Revision shortcut on subject-scoped routes handled inside pages
  void location;

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <span>📚</span> Study Notes
          </Link>
          <nav className="flex items-center gap-1">
            <NavItem to="/">Dashboard</NavItem>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/subjects/:subjectId" element={<SubjectPage />} />
          <Route path="/subjects/:subjectId/revision" element={<FinalRevision />} />
          <Route path="/weeks/:weekId" element={<WeekPage />} />
        </Routes>
      </main>

      <footer className="no-print mx-auto max-w-5xl px-4 pb-10 pt-4 text-center text-xs text-slate-400">
        Your personal before-and-after study companion.
      </footer>
    </div>
  );
}
