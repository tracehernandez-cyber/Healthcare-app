import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, apiGet, apiPost, formatApiError } from "../api/client";
import type { Clinic, OnboardResult, Pathway } from "../api/types";
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingSpinner } from "../components/LoadingSpinner";

export function OnboardPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [clinicId, setClinicId] = useState("");
  const [pathwayId, setPathwayId] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<OnboardResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<Clinic[]>("/api/clinics");
        if (cancelled) return;
        setClinics(data);
        if (data[0]) setClinicId(data[0].id);
      } catch (e) {
        if (!cancelled) setError(formatApiError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!clinicId) {
      setPathways([]);
      setPathwayId("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<Pathway[]>(
          `/api/pathways?clinicId=${encodeURIComponent(clinicId)}`
        );
        if (cancelled) return;
        setPathways(data);
        setPathwayId(data[0]?.id ?? "");
      } catch (e) {
        if (!cancelled) setError(formatApiError(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors([]);
    setSuccess(null);
    try {
      const result = await apiPost<OnboardResult>("/api/workflows/onboard", {
        clinicId,
        pathwayId,
        patient: {
          email,
          firstName,
          lastName,
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        },
      });
      setSuccess(result);
      setEmail("");
      setFirstName("");
      setLastName("");
      setPhone("");
    } catch (err) {
      if (err instanceof ApiError && Array.isArray(err.details)) {
        setFieldErrors(
          (err.details as { message?: string }[]).map(
            (d) => d.message ?? "Invalid field"
          )
        );
      }
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingSpinner label="Loading clinics…" />;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Onboard oncology patient
        </h1>
        <p className="mt-1 text-slate-600">
          Enroll a patient on a post-operative recovery pathway
        </p>
      </div>

      {error && <ErrorAlert message={error} />}
      {fieldErrors.length > 0 && (
        <ul className="list-inside list-disc rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {fieldErrors.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-900">
          <p className="font-medium">Patient enrolled successfully</p>
          <p className="mt-2 text-sm">
            {success.patient.firstName} {success.patient.lastName} is on{" "}
            <strong>{success.enrollment.pathway?.name ?? "pathway"}</strong> at{" "}
            {success.clinic.name}.
          </p>
          <Link
            to={`/patients/${success.patient.id}`}
            className="mt-3 inline-block text-sm font-medium text-teal-800 hover:underline"
          >
            View patient chart →
          </Link>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Cancer clinic
          </label>
          <select
            value={clinicId}
            onChange={(e) => setClinicId(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Recovery pathway
          </label>
          <select
            value={pathwayId}
            onChange={(e) => setPathwayId(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {pathways.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="patient@example.com"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              First name
            </label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="Maria"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Last name
            </label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Garcia"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Phone (optional)
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="555-1001"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {submitting ? "Enrolling…" : "Enroll patient"}
        </button>
      </form>

      <Link to="/" className="text-sm font-medium text-teal-700 hover:underline">
        ← Back to clinic dashboard
      </Link>
    </div>
  );
}
