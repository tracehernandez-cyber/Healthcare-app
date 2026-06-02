import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet, formatApiError } from "../api/client";
import type { PatientDashboard } from "../api/types";
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { StatusBadge } from "../components/StatusBadge";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PatientDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const dashboard = await apiGet<PatientDashboard>(
          `/api/workflows/patients/${id}/dashboard`
        );
        if (!cancelled) setData(dashboard);
      } catch (e) {
        if (!cancelled) setError(formatApiError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <LoadingSpinner label="Loading patient chart…" />;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={error ?? "Patient not found"} />
        <Link to="/" className="text-sm font-medium text-teal-700 hover:underline">
          ← Back to clinic dashboard
        </Link>
      </div>
    );
  }

  const { patient, enrollments } = data;
  const fullName = [patient.firstName, patient.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm font-medium text-teal-700 hover:underline">
        ← Back to clinic dashboard
      </Link>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          {fullName || "Patient"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">Oncology post-op patient chart</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-500">Email</dt>
            <dd className="text-slate-900">{patient.user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Phone</dt>
            <dd className="text-slate-900">{patient.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Account status</dt>
            <dd className="mt-1">
              {patient.user?.status ? (
                <StatusBadge status={patient.user.status} />
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Patient since</dt>
            <dd className="text-slate-900">{formatDate(patient.createdAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-medium text-slate-900">Pathway enrollments</h2>
        </div>
        {enrollments.length === 0 ? (
          <p className="px-4 py-6 text-slate-600">No enrollments on file.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {enrollments.map((enrollment) => (
              <li key={enrollment.id} className="px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">
                    {enrollment.pathway?.name ?? "Recovery pathway"}
                  </p>
                  <StatusBadge status={enrollment.status} />
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Enrolled {formatDate(enrollment.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
