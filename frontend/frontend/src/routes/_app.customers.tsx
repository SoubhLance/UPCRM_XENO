import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, ChevronLeft, ChevronRight, Mail, Phone, MapPin, AlertCircle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getCustomers } from "@/lib/api/customers";
import type { Customer } from "@/types";
import StatusBadge from "@/components/cards/StatusBadge";

export const Route = createFileRoute("/_app/customers")({
  component: Customers,
});

const SEGMENTS = ["All", "High-Value", "Medium-Value", "Low-Value", "Churned"];
const CHANNELS = ["All", "Email", "SMS", "Push"];
const GENDERS = ["All", "Male", "Female", "Other"];
const PAGE_SIZE = 20;

function Customers() {
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("All");
  const [channel, setChannel] = useState("All");
  const [gender, setGender] = useState("All");
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState("default");
  const [selected, setSelected] = useState<Customer | null>(null);

  const { data: customers = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["customers", segment, channel, page, search],
    queryFn: () => getCustomers({
      segment: segment !== "All" ? segment : undefined,
      channel: channel !== "All" ? channel : undefined,
      search: search || undefined,
      limit: PAGE_SIZE, offset: page * PAGE_SIZE,
    }),
    retry: false,
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <AlertCircle size={48} className="text-destructive animate-pulse" />
        <h3 className="text-lg font-semibold">Failed to load customers</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          There was an error retrieving customer records. Please check your backend connection.
        </p>
        <Button onClick={() => refetch()} className="gap-2 rounded-xl">
          <RefreshCw size={14} /> Retry
        </Button>
      </div>
    );
  }

  let filtered = customers.filter((c) => {
    const matchGender = gender === "All" || c.gender?.toLowerCase() === gender.toLowerCase();
    return matchGender;
  });
  if (sortBy === "spent") filtered = [...filtered].sort((a, b) => b.total_spent - a.total_spent);
  if (sortBy === "orders") filtered = [...filtered].sort((a, b) => b.total_orders - a.total_orders);
  if (sortBy === "inactive") filtered = [...filtered].sort((a, b) => b.days_since_last_order - a.days_since_last_order);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage and explore your customer base.</p>
      </motion.div>

      <div className="card-elevated rounded-2xl bg-card border border-border p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, email, phone…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9 h-10 rounded-xl" />
          </div>
          <Select value={segment} onValueChange={setSegment}>
            <SelectTrigger className="w-[150px] h-10 rounded-xl"><SelectValue placeholder="Segment" /></SelectTrigger>
            <SelectContent>{SEGMENTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="w-[130px] h-10 rounded-xl"><SelectValue placeholder="Channel" /></SelectTrigger>
            <SelectContent>{CHANNELS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="w-[130px] h-10 rounded-xl"><SelectValue placeholder="Gender" /></SelectTrigger>
            <SelectContent>{GENDERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-10 rounded-xl"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="spent">Top spenders</SelectItem>
              <SelectItem value="orders">Most orders</SelectItem>
              <SelectItem value="inactive">Most inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="card-elevated rounded-2xl bg-card border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 border-b border-border">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Name</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Email</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Segment</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Orders</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Spent</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <motion.tr
                    key={c.customer_id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.015 }}
                    onClick={() => setSelected(c)}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email_addr}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.segment} /></td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.total_orders}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">${c.total_spent?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{c.days_since_last_order}d ago</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Page {page + 1} · Showing {filtered.length}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            <ChevronLeft size={14} /> Prev
          </Button>
          <Button variant="outline" size="sm" disabled={customers.length < PAGE_SIZE} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight size={14} />
          </Button>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-lg font-bold">
                    {selected.name?.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selected.name}</DialogTitle>
                    <StatusBadge status={selected.segment} className="mt-1" />
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                <Row icon={<Mail size={14} />} label="Email" value={selected.email_addr} />
                <Row icon={<Phone size={14} />} label="Phone" value={selected.phone} />
                <Row icon={<MapPin size={14} />} label="City" value={selected.city} />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <Mini label="Orders" value={selected.total_orders} />
                <Mini label="Spent" value={`$${selected.total_spent?.toLocaleString()}`} />
                <Mini label="Inactive" value={`${selected.days_since_last_order}d`} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Favorite category</p><p className="font-medium mt-0.5">{selected.favorite_category || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Channel</p><p className="font-medium mt-0.5">{selected.preferred_channel || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Communication</p><p className="font-medium mt-0.5">{selected.communication_status || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Last contacted</p><p className="font-medium mt-0.5">{selected.last_contacted || "—"}</p></div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/60">
      <div className="text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value || "—"}</p>
      </div>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-secondary/60 p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
