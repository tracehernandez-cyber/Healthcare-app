import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, formatApiError } from "../api/client";
import type { Clinic, QueueEntry } from "../api/types";
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

export function DashboardPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [clinicId, setClinicId] = useState("");
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<Clinic[]>("/api/clinics");
        if (cancelled) return;
        setClinics(data);
        const lakeside = data.find((c) =>
          c.name.includes("Lakeside Oncology Center")
        );
        if (lakeside) setClinicId(lakeside.id);
        else if (data[0]) setClinicId(data[0].id);
      } catch (e) {
        if (!cancelled) setError(formatApiError(e));
      } finally {
        if (!cancelled) setLoadingClinics(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadQueue = useCallback(async (id: string) => {
    if (!id) return;
    setLoadingQueue(true);
    setError(null);
    try {
      const data = await apiGet<QueueEntry[]>(
        `/api/workflows/clinics/${id}/queue`
      );
      setQueue(data);
    } catch (e) {
      setQueue([]);
      setError(formatApiError(e));
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    if (clinicId) void loadQueue(clinicId);
  }, [clinicId, loadQueue]);

  if (loadingClinics) {
    return <LoadingSpinner label="Loading oncology clinics…" />;
  }

  const selectedClinic = clinics.find((c) => c.id === clinicId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Oncology post-op care coordination
        </h1>
        <p className="mt-1 text-slate-600">
          Active post-operative enrollments for your cancer clinic
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label
          htmlFor="clinic-select"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Oncology clinic
        </label>
        <select
          id="clinic-select"
          value={clinicId}
          onChange={(e) => setClinicId(e.target.value)}
          className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
        >
          <option value="">Select a clinic…</option>
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loadingQueue ? (
        <LoadingSpinner label="Loading active care queue…" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-medium text-slate-900">
              Active enrollments
              {selectedClinic ? ` — ${selectedClinic.name}` : ""}
            </h2>
          </div>
          {queue.length === 0 ? (
            <p className="px-4 py-8 text-center text-slate-600">
              No active enrollments in the queue. Onboard a patient on a
              recovery pathway such as mastectomy or lumpectomy recovery.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Patient</th>
                    <th className="px-4 py-3 font-medium">Pathway</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Enrolled</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.map((row) => (
                    <tr key={row.enrollmentId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {row.patientName}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.pathwayName}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(row.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/patients/${row.patientId}`}
                          className="font-medium text-teal-700 hover:text-teal-900"
                        >
                          View patient
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-slate-600">
        <Link to="/onboard" className="font-medium text-teal-700 hover:underline">
          Onboard a new oncology patient →
        </Link>
      </p>
    </div>
  );
}
