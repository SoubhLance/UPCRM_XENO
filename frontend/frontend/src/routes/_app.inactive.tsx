import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, Megaphone, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getCustomers } from "@/lib/api/customers";
import { createCampaign } from "@/lib/api/campaigns";
import { useNotifications } from "@/context/NotificationContext";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/inactive")({
  component: InactivePage,
});

function InactivePage() {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [campaignName, setCampaignName] = useState("Re-engagement Campaign");
  const [channel, setChannel] = useState("Email");
  const [message, setMessage] = useState("We miss you! Come back and get 10% off your next order.");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["inactive-customers"],
    queryFn: () => getCustomers({ days_inactive_min: 90, limit: 100 }),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: (data) => {
      toast.success("Campaign launched successfully!");
      addNotification({
        title: "Campaign Launched",
        message: `"${data.campaign_name}" targeting ${customers.length} inactive customers`,
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setShowCreate(false);
    },
    onError: () => toast.error("Failed to create campaign"),
  });

  const filtered = customers.filter((c) =>
    !search || [c.name, c.email_addr].some((f) => f?.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Inactive Customers</h1>
        <p className="text-sm text-muted-foreground mt-1">Customers who haven't ordered in 90+ days.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="card-elevated rounded-2xl p-6 bg-gradient-to-br from-red-500/5 via-card to-amber-500/5 border border-red-500/20 flex flex-wrap items-center gap-4 justify-between"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10 text-red-600">
            <AlertTriangle size={26} />
          </div>
          <div>
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Customers at risk of churn</p>
            <p className="text-3xl font-bold tracking-tight mt-1">{customers.length.toLocaleString()}</p>
          </div>
        </div>
        <Button size="lg" onClick={() => setShowCreate(true)} className="rounded-xl gap-2 shadow-lg shadow-primary/20">
          <Megaphone size={16} /> Re-engage Customers
        </Button>
      </motion.div>

      <div className="card-elevated rounded-2xl bg-card border border-border p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search inactive customers…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
        </div>
      </div>

      <div className="card-elevated rounded-2xl bg-card border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">🎉 No inactive customers</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 border-b border-border">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Name</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Email</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Spent</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Inactive</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <motion.tr
                    key={c.customer_id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/40"
                  >
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email_addr}</td>
                    <td className="px-4 py-3 text-right tabular-nums">${c.total_spent?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="outline" className="border-red-500/30 text-red-600 bg-red-500/5">{c.days_since_last_order}d</Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>Create Re-engagement Campaign</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Campaign Name</Label>
              <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className="mt-1.5 h-10 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="mt-1.5 h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="Push">Push</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Message</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="mt-1.5 rounded-xl" />
            </div>
            <p className="text-xs text-muted-foreground">Targeting <span className="font-semibold text-foreground">{customers.length}</span> inactive customers.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={() => mutation.mutate({
                campaign_name: campaignName, channel, message, segment: "Churned",
                customer_ids: customers.map((c) => c.customer_id),
              })}
              disabled={mutation.isPending}
            >{mutation.isPending ? "Launching…" : "Launch Campaign"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
