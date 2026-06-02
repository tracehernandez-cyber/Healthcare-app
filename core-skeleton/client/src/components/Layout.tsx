import { Link, Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <Link to="/" className="text-lg font-semibold text-teal-800">
              Oncology Post-Op Care
            </Link>
            <p className="text-sm text-slate-600">
              Cancer clinic care coordination
            </p>
          </div>
          <nav className="flex gap-4 text-sm font-medium">
            <Link
              to="/"
              className="text-teal-700 hover:text-teal-900"
            >
              Clinic dashboard
            </Link>
            <Link
              to="/onboard"
              className="rounded-md bg-teal-700 px-3 py-2 text-white hover:bg-teal-800"
            >
              Onboard patient
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
