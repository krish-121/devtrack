export function LoadingState({ label }: { label: string }) {
  return (
    <div className="panel loading-state" role="status">
      <span className="loading-mark" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
