import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, UserX, Megaphone, Upload, Sparkles, Settings, LogOut,
  BarChart3, Database,
} from "lucide-react";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/inactive", label: "Inactive", icon: UserX },
  { to: "/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/database", label: "Database Viewer", icon: Database },
  { to: "/upload", label: "Upload Data", icon: Upload },
  { to: "/copilot", label: "AI Copilot", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export default function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { logout } = useAuth();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-6 py-6 border-b border-sidebar-border">
        <Logo variant="light" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item, i) => {
          const active = pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={item.to}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-lg shadow-sidebar-accent/30"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/5"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-accent"
                  />
                )}
                <Icon size={18} strokeWidth={2.25} />
                <span>{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
