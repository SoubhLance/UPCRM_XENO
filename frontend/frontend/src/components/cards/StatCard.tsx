import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger" | "info" | "neutral";
  prefix?: string;
  suffix?: string;
  delay?: number;
  trend?: ReactNode;
}

const toneMap: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600",
  warning: "bg-accent/20 text-amber-600",
  danger: "bg-red-500/10 text-red-600",
  info: "bg-sky-500/10 text-sky-600",
  neutral: "bg-muted text-foreground",
};

function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export default function StatCard({
  label, value, icon: Icon, tone = "neutral", prefix, suffix, delay = 0, trend,
}: StatCardProps) {
  const count = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="card-elevated rounded-2xl bg-card border border-border p-5 transition-shadow hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {prefix}{count.toLocaleString()}{suffix}
          </p>
          {trend && <div className="mt-1 text-xs text-muted-foreground">{trend}</div>}
        </div>
        <div className={`shrink-0 grid h-11 w-11 place-items-center rounded-xl ${toneMap[tone]}`}>
          <Icon size={20} strokeWidth={2.25} />
        </div>
      </div>
    </motion.div>
  );
}
