import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Megaphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/cards/StatusBadge";
import { getCampaigns } from "@/lib/api/campaigns";

export const Route = createFileRoute("/_app/campaigns")({
  component: CampaignsList,
});

function CampaignsList() {
  const navigate = useNavigate();
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns"], queryFn: getCampaigns, retry: false,
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Megaphone className="text-primary" size={26} /> Campaigns
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Track and manage all your marketing campaigns.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="card-elevated rounded-2xl bg-card border border-border overflow-hidden"
      >
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No campaigns yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 border-b border-border">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">ID</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Campaign</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Segment</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Channel</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Sent</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Delivered</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Opened</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Clicked</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Failed</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => (
                  <motion.tr
                    key={c.campaign_id}
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }}
                    onClick={() => navigate({ to: "/campaigns/$id", params: { id: String(c.campaign_id) } })}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/40 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">#{c.campaign_id}</td>
                    <td className="px-4 py-3 font-medium">{c.campaign_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.segment || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.channel || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.sent_count}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-600">{c.delivered_count}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-600">{c.opened_count}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-violet-600">{c.clicked_count}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-red-600">{c.failed_count}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
