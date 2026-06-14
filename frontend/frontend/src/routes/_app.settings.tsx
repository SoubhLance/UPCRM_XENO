import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { checkHealth } from "@/lib/api/health";
import type { SystemService } from "@/types";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<SystemService[]>([
    { name: "FastAPI Backend", status: "down" },
    { name: "MySQL Database", status: "down" },
    { name: "Gemini AI", status: "healthy" },
    { name: "Groq Fallback", status: "healthy" },
    { name: "Campaign Service", status: "healthy" },
  ]);

  useEffect(() => {
    checkHealth()
      .then(() => setServices((p) => p.map((s) =>
        s.name === "FastAPI Backend" || s.name === "MySQL Database" ? { ...s, status: "healthy" as const } : s)))
      .catch(() => {});
  }, []);

  const dot = (s: string) => s === "healthy" ? "bg-emerald-500" : s === "degraded" ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="text-primary" size={26} /> Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Account settings and system status.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="card-elevated rounded-2xl bg-card border border-border p-6">
        <h3 className="text-sm font-semibold mb-4">Profile</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium mt-0.5">{user?.name || "Admin"}</p></div>
          <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium mt-0.5">{user?.email || "admin@upcrm.com"}</p></div>
          <div><p className="text-xs text-muted-foreground">Role</p><p className="font-medium mt-0.5">Administrator</p></div>
          <div><p className="text-xs text-muted-foreground">Plan</p><p className="font-medium mt-0.5">Enterprise</p></div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="card-elevated rounded-2xl bg-card border border-border p-6">
        <h3 className="text-sm font-semibold mb-4">System Status</h3>
        <div className="space-y-2">
          {services.map((s) => (
            <div key={s.name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/60">
              <span className="text-sm font-medium">{s.name}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${dot(s.status)}`} />
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
