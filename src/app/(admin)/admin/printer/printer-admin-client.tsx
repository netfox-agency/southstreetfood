"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Printer,
  RefreshCw,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Job {
  id: string;
  orderId: string;
  orderNumber: number | null;
  customerName: string | null;
  orderType: string | null;
  total: number | null;
  status: "pending" | "in_flight" | "printed" | "failed" | "expired";
  attempts: number;
  lastError: string | null;
  createdAt: string;
  servedAt: string | null;
  printedAt: string | null;
}

interface Props {
  jobs: Job[];
  stats: {
    pending: number;
    inFlight: number;
    printed: number;
    failed: number;
  };
  pollUrl: string;
}

const STATUS_CONFIG = {
  pending: {
    label: "En attente",
    icon: Clock,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  in_flight: {
    label: "Envoyé",
    icon: Loader2,
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  printed: {
    label: "Imprimé",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  failed: {
    label: "Échec",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200",
  },
  expired: {
    label: "Expiré",
    icon: XCircle,
    className: "bg-gray-50 text-gray-500 border-gray-200",
  },
};

export function PrinterAdminClient({ jobs, stats, pollUrl }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const copyPollUrl = () => {
    navigator.clipboard.writeText(pollUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const retryJob = async (jobId: string) => {
    const res = await fetch("/api/admin/printer/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    if (res.ok) {
      toast.success("Job remis en queue");
      startTransition(() => router.refresh());
    } else {
      toast.error("Échec du retry");
    }
  };

  const testPrint = async () => {
    const res = await fetch("/api/admin/printer/test", { method: "POST" });
    if (res.ok) {
      toast.success("Ticket test ajouté en queue");
      startTransition(() => router.refresh());
    } else {
      toast.error("Échec du test");
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <Printer className="h-4 w-4 text-[#e8416f]" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[#e8416f]">
            Server Direct Print
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1d1d1f]">
          Impression cuisine
        </h1>
        <p className="mt-1 text-[#86868b]">
          Queue de tickets envoyés à l&apos;imprimante thermique en cuisine.
        </p>
      </div>

      {/* Stats top row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard
          icon={Clock}
          label="En attente"
          value={stats.pending}
          color="amber"
        />
        <StatCard
          icon={Loader2}
          label="Envoyés"
          value={stats.inFlight}
          color="blue"
        />
        <StatCard
          icon={CheckCircle2}
          label="Imprimés"
          value={stats.printed}
          color="emerald"
        />
        <StatCard
          icon={XCircle}
          label="Échecs"
          value={stats.failed}
          color="red"
        />
      </div>

      {/* URL de poll à configurer */}
      <div className="rounded-2xl border border-[#e8416f]/30 bg-[#fff5f8] p-5 mb-8">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#e8416f] flex items-center justify-center shrink-0">
            <Printer className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-[#1d1d1f]">
              URL de poll à configurer dans l&apos;imprimante
            </p>
            <p className="text-[12px] text-[#86868b] mt-0.5 mb-3">
              Dans l&apos;interface admin de l&apos;imprimante (TM-Intelligent
              → Server Direct Print), entre cette URL en y ajoutant le token
              secret à la fin.
            </p>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#e5e5ea]">
              <code className="text-[12px] text-[#1d1d1f] flex-1 truncate font-mono">
                {pollUrl}?token=PRINTER_POLL_SECRET
              </code>
              <button
                onClick={copyPollUrl}
                className={cn(
                  "h-8 px-3 rounded-md text-[11px] font-semibold transition-colors shrink-0",
                  copied
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-[#1d1d1f] text-white hover:bg-[#0a0a0a]",
                )}
              >
                {copied ? "Copié !" : "Copier"}
              </button>
            </div>
            <p className="text-[11px] text-[#86868b] mt-2">
              <strong>Important :</strong> Remplace <code>PRINTER_POLL_SECRET</code>
              {" "}par le token configuré dans les env vars Vercel (variable
              d&apos;environnement <code>PRINTER_POLL_SECRET</code>).
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={testPrint}
          disabled={pending}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#e8416f] text-white text-[13px] font-semibold hover:bg-[#d13a63] disabled:opacity-50 transition-colors cursor-pointer"
        >
          <PlayCircle className="h-4 w-4" />
          Test impression
        </button>
        <button
          onClick={() => startTransition(() => router.refresh())}
          disabled={pending}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[#e5e5ea] text-[#1d1d1f] text-[13px] font-semibold hover:bg-[#f5f5f7] transition-colors cursor-pointer"
        >
          <RefreshCw className={cn("h-4 w-4", pending && "animate-spin")} />
          Rafraîchir
        </button>
      </div>

      {/* Liste jobs */}
      <div className="rounded-2xl border border-[#e5e5ea] bg-white overflow-hidden">
        <div className="px-5 py-3 bg-[#fafafa] border-b border-[#e5e5ea]">
          <p className="text-[12px] font-semibold text-[#1d1d1f]">
            50 dernières demandes d&apos;impression
          </p>
        </div>
        {jobs.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Printer className="h-10 w-10 text-[#c7c7cc] mx-auto mb-3" />
            <p className="text-[14px] text-[#86868b]">
              Aucun ticket dans la queue.
            </p>
            <p className="text-[12px] text-[#86868b] mt-1">
              Les tickets apparaissent automatiquement quand une commande
              passe en statut &quot;payée&quot;.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#e5e5ea]">
            {jobs.map((job) => {
              const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <li
                  key={job.id}
                  className="px-5 py-3.5 flex items-center gap-3"
                >
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0",
                      cfg.className,
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3 w-3",
                        job.status === "in_flight" && "animate-spin",
                      )}
                    />
                    {cfg.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-[#1d1d1f] tabular-nums">
                        #{String(job.orderNumber ?? "—").padStart(4, "0")}
                      </p>
                      <p className="text-[12px] text-[#86868b] truncate">
                        {job.customerName ?? "—"}
                      </p>
                      {job.total !== null && (
                        <p className="text-[12px] text-[#86868b] tabular-nums shrink-0">
                          {(job.total / 100).toFixed(2)}€
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#86868b] mt-0.5">
                      <span>{formatTime(job.createdAt)}</span>
                      {job.attempts > 1 && (
                        <>
                          <span>·</span>
                          <span>{job.attempts} tentatives</span>
                        </>
                      )}
                      {job.lastError && (
                        <>
                          <span>·</span>
                          <span className="text-red-600 truncate">
                            {job.lastError}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {(job.status === "failed" || job.status === "expired") && (
                    <button
                      onClick={() => retryJob(job.id)}
                      disabled={pending}
                      className="text-[11px] font-semibold text-[#e8416f] hover:underline cursor-pointer shrink-0"
                    >
                      Retry
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: "amber" | "blue" | "emerald" | "red";
}) {
  const palette: Record<typeof color, string> = {
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <div className="rounded-2xl border border-[#e5e5ea] bg-white p-4 flex items-center gap-3">
      <div
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center",
          palette[color],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#86868b]">
          {label}
        </p>
        <p className="text-2xl font-bold text-[#1d1d1f] tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
