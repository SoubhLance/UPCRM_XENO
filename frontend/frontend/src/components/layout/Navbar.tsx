import { Bell, Search, Calendar } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { Input } from "@/components/ui/input";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function Navbar() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const initials = (user?.name || "Admin")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-4 sm:px-6">
      <div className="relative hidden md:flex flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search customers, campaigns…"
          className="pl-9 h-10 rounded-xl bg-secondary border-transparent focus-visible:bg-card"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground px-3 py-2 rounded-lg bg-secondary">
          <Calendar size={14} />
          <span className="font-medium">{formatDate(new Date())}</span>
        </div>

        <div className="relative">
          <button
            onClick={() => { setOpen((v) => !v); if (!open) markAllRead(); }}
            className="relative grid h-10 w-10 place-items-center rounded-xl bg-secondary hover:bg-muted transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 px-1 place-items-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-popover shadow-2xl overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold">Notifications</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="px-4 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/50">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-secondary">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold">
            {initials}
          </div>
          <div className="hidden sm:block min-w-0">
            <p className="text-xs font-semibold leading-tight truncate">{user?.name || "Admin"}</p>
            <p className="text-[10px] text-muted-foreground leading-tight truncate">{user?.email || "admin@upcrm.com"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
