type Status = "ACTIVE" | "PAUSED" | "COMPLETED" | "INVITED" | "DISABLED";

const styles: Record<Status, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  PAUSED: "bg-amber-100 text-amber-900",
  COMPLETED: "bg-slate-200 text-slate-700",
  INVITED: "bg-sky-100 text-sky-800",
  DISABLED: "bg-rose-100 text-rose-800",
};

export function StatusBadge({ status }: { status: Status | string }) {
  const className =
    styles[status as Status] ?? "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {status}
    </span>
  );
}
