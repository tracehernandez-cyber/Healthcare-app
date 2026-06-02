export function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900"
      role="alert"
    >
      {message}
    </div>
  );
}
