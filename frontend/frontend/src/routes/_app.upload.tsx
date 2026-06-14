import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ingestCustomers } from "@/lib/api/customers";
import { ingestOrders } from "@/lib/api/orders";
import { useNotifications } from "@/context/NotificationContext";

export const Route = createFileRoute("/_app/upload")({
  component: UploadPage,
});

function UploadCard({ title, description, onUpload }: { title: string; description: string; onUpload: (f: File, p: (n: number) => void) => Promise<any> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [drag, setDrag] = useState(false);
  const { addNotification } = useNotifications();

  const handleFile = (f: File) => { setFile(f); setDone(false); setProgress(0); };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file, setProgress);
      setDone(true);
      toast.success(`${title} imported successfully!`);
      addNotification({ title: `${title} imported`, message: `File "${file.name}" processed.`, type: "success" });
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally { setUploading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="card-elevated rounded-2xl bg-card border border-border p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <FileSpreadsheet size={20} />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/40"}`}
      >
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <Upload size={28} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium">{file ? file.name : "Drag & drop or click to upload"}</p>
        <p className="text-xs text-muted-foreground mt-1">CSV or Excel</p>
      </div>

      {file && (
        <div className="mt-4 space-y-2">
          {uploading && <Progress value={progress} className="h-2" />}
          {done && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 size={16} /> Uploaded successfully
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleUpload} disabled={uploading || done} className="flex-1">
              {uploading ? `${progress}%` : done ? "Done" : "Upload"}
            </Button>
            <Button variant="outline" size="icon" onClick={() => { setFile(null); setDone(false); }}>
              <X size={16} />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function UploadPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Upload Data</h1>
        <p className="text-sm text-muted-foreground mt-1">Import your customer and order datasets.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <UploadCard title="Customer Dataset" description="Names, contact info, segments" onUpload={ingestCustomers} />
        <UploadCard title="Orders Dataset" description="Purchases, amounts, dates" onUpload={ingestOrders} />
      </div>
    </div>
  );
}
