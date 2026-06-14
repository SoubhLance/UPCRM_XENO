interface StatusBadgeProps {
  status?: string;
  className?: string;
}

const styles: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30",
  sent: "bg-sky-500/10 text-sky-700 ring-sky-500/30",
  delivered: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30",
  opened: "bg-amber-500/10 text-amber-700 ring-amber-500/30",
  clicked: "bg-violet-500/10 text-violet-700 ring-violet-500/30",
  failed: "bg-red-500/10 text-red-700 ring-red-500/30",
  draft: "bg-slate-500/10 text-slate-700 ring-slate-500/30",
  pending: "bg-amber-500/10 text-amber-700 ring-amber-500/30",
  completed: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30",
  running: "bg-primary/10 text-primary ring-primary/30",
  paused: "bg-slate-500/10 text-slate-700 ring-slate-500/30",
};

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const key = (status || "draft").toLowerCase();
  const style = styles[key] || styles.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style} ${className}`}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status || "—"}
    </span>
  );
}
