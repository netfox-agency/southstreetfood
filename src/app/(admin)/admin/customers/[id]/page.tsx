"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Package,
  TrendingUp,
  Sparkles,
  User,
  Plus,
  Minus,
  ShoppingBag,
  Truck,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";

interface CustomerDetail {
  id: string;
  kind: "user" | "phone" | "email";
  hasAccount: boolean;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string | null;
  stats: {
    orderCount: number;
    totalSpent: number;
    pointsEarnedTotal: number;
    loyaltyBalance: number;
    lastOrderDate: string | null;
    firstOrderDate: string | null;
  };
  orders: Array<{
    id: string;
    orderNumber: number;
    orderType: string;
    status: string;
    total: number;
    subtotal: number;
    deliveryFee: number | null;
    loyaltyPointsEarned: number | null;
    loyaltyRewardId: string | null;
    createdAt: string;
    notes: string | null;
  }>;
  transactions: Array<{
    id: string;
    points: number;
    description: string | null;
    createdAt: string | null;
    orderId: string | null;
  }>;
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${encodeURIComponent(id)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Erreur");
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 rounded bg-[#f5f5f7] animate-pulse" />
        <div className="h-32 rounded-2xl bg-[#f5f5f7] animate-pulse" />
        <div className="h-48 rounded-2xl bg-[#f5f5f7] animate-pulse" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div>
        <BackLink />
        <p className="text-red-600 text-sm mt-4">{error ?? "Client introuvable"}</p>
      </div>
    );
  }

  return <CustomerDetailView data={data} refresh={fetchData} />;
}

/* ───────── sub-components ───────── */

function BackLink() {
  return (
    <Link
      href="/admin/customers"
      className="inline-flex items-center gap-1.5 text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      Tous les clients
    </Link>
  );
}

function CustomerDetailView({
  data,
  refresh,
}: {
  data: CustomerDetail;
  refresh: () => void;
}) {
  return (
    <div>
      <BackLink />

      {/* Header */}
      <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">
              {data.name}
            </h1>
            {data.hasAccount ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0a0a0a] text-white text-[10px] font-bold tracking-wider uppercase">
                <User className="h-2.5 w-2.5" />
                Compte
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#86868b] text-[10px] font-bold tracking-wider uppercase">
                Guest
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-[13px] text-[#86868b]">
            {data.phone && (
              <a
                href={`tel:${data.phone}`}
                className="inline-flex items-center gap-1.5 hover:text-[#1d1d1f] transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                {data.phone}
              </a>
            )}
            {data.email && (
              <a
                href={`mailto:${data.email}`}
                className="inline-flex items-center gap-1.5 hover:text-[#1d1d1f] transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                {data.email}
              </a>
            )}
            {data.createdAt && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Client depuis{" "}
                {new Date(data.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Package}
          iconClass="bg-blue-50 text-blue-600"
          value={String(data.stats.orderCount)}
          label="Commandes"
        />
        <StatCard
          icon={TrendingUp}
          iconClass="bg-emerald-50 text-emerald-600"
          value={formatPrice(data.stats.totalSpent)}
          label="Total depense"
        />
        <StatCard
          icon={Sparkles}
          iconClass="bg-[#fde8ee] text-[#e8416f]"
          value={String(data.stats.loyaltyBalance)}
          label={data.hasAccount ? "Solde fidelite" : "Points cumules"}
        />
        <StatCard
          icon={Calendar}
          iconClass="bg-amber-50 text-amber-600"
          value={
            data.stats.lastOrderDate ? timeAgo(data.stats.lastOrderDate) : "—"
          }
          label="Derniere commande"
        />
      </div>

      {/* Loyalty section — connecte only */}
      {data.hasAccount && (
        <LoyaltySection data={data} refresh={refresh} />
      )}

      {/* Orders */}
      <section className="mt-8">
        <h2 className="text-[15px] font-semibold text-[#1d1d1f] mb-3">
          Commandes ({data.orders.length})
        </h2>
        {data.orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e5e5ea] p-10 text-center">
            <Package className="h-10 w-10 text-[#d1d1d6] mx-auto mb-3" />
            <p className="text-[#aeaeb2] text-sm">Aucune commande</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden">
            <div className="divide-y divide-[#f0f0f2]">
              {data.orders.map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconClass,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
      <div
        className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${iconClass}`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <p className="text-2xl font-bold text-[#1d1d1f] tabular-nums">{value}</p>
      <p className="text-[13px] text-[#86868b] mt-0.5">{label}</p>
    </div>
  );
}

function LoyaltySection({
  data,
  refresh,
}: {
  data: CustomerDetail;
  refresh: () => void;
}) {
  const userId = data.id.startsWith("user:") ? data.id.slice(5) : null;
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-semibold text-[#1d1d1f]">
          Fidelite
        </h2>
        {userId && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#0a0a0a] text-white text-[12px] font-semibold hover:bg-[#1d1d1f] transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajuster les points
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden">
        {/* Balance strip */}
        <div className="px-5 py-4 bg-[#0a0a0a] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#e8416f]" />
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#e8416f]">
              Solde actuel
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-3xl leading-none tabular-nums">
              {data.stats.loyaltyBalance}
            </span>
            <span className="text-[11px] text-white/60 font-semibold">pts</span>
          </div>
        </div>

        {/* Transactions */}
        {data.transactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[#aeaeb2] text-sm">
              Aucune transaction fidelite
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#f0f0f2]">
            {data.transactions.map((t) => {
              const isEarn = t.points > 0;
              return (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      isEarn ? "bg-emerald-50" : "bg-[#fde8ee]"
                    }`}
                  >
                    {isEarn ? (
                      <Plus className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Minus className="h-3.5 w-3.5 text-[#e8416f]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#1d1d1f] truncate">
                      {t.description ||
                        (isEarn ? "Points gagnes" : "Points utilises")}
                    </p>
                    {t.createdAt && (
                      <p className="text-[11px] text-[#86868b]">
                        {formatDateTime(t.createdAt)}
                      </p>
                    )}
                  </div>
                  <span
                    className={`tabular-nums text-[13px] font-bold ${
                      isEarn ? "text-emerald-600" : "text-[#e8416f]"
                    }`}
                  >
                    {isEarn ? "+" : ""}
                    {t.points}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {userId && open && (
        <AdjustPointsModal
          userId={userId}
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            refresh();
          }}
        />
      )}
    </section>
  );
}

function AdjustPointsModal({
  userId,
  onClose,
  onSuccess,
}: {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [points, setPoints] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const n = parseInt(points, 10);
    if (!Number.isInteger(n) || n === 0) {
      toast.error("Entre un entier non nul (positif pour credit, negatif pour debit)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/loyalty/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, points: n, reason }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Erreur");
      toast.success(
        `${n > 0 ? "+" : ""}${n} pts applique. Solde : ${body.newBalance}`,
      );
      onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-[#1d1d1f] mb-1">
          Ajuster les points
        </h3>
        <p className="text-[12px] text-[#86868b] mb-4">
          Credit positif, debit negatif. Max +/- 10 000 pts.
        </p>
        <label className="block mb-3">
          <span className="text-[11px] font-medium text-[#86868b] mb-1 block">
            Points (entier, ex: 50 ou -20)
          </span>
          <input
            type="number"
            step="1"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="50"
            className="w-full h-11 px-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10"
          />
        </label>
        <label className="block mb-4">
          <span className="text-[11px] font-medium text-[#86868b] mb-1 block">
            Motif (visible dans l&apos;historique)
          </span>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Geste commercial, anniversaire, correction..."
            maxLength={100}
            className="w-full h-11 px-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-[#e5e5ea] text-[#1d1d1f] text-sm font-semibold hover:bg-[#f5f5f7] transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 h-11 rounded-xl bg-[#0a0a0a] text-white text-sm font-semibold hover:bg-[#1d1d1f] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "..." : "Appliquer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderRow({
  order,
}: {
  order: CustomerDetail["orders"][number];
}) {
  const orderTypeIcon =
    order.orderType === "delivery" ? (
      <Truck className="h-3.5 w-3.5" />
    ) : order.orderType === "dine_in" ? (
      <MapPin className="h-3.5 w-3.5" />
    ) : (
      <ShoppingBag className="h-3.5 w-3.5" />
    );

  return (
    <Link
      href={`/admin/orders?highlight=${order.id}`}
      className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#fafafa] transition-colors"
    >
      <div className="h-10 w-10 rounded-xl bg-[#f5f5f7] flex items-center justify-center shrink-0 text-[#86868b]">
        {orderTypeIcon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-[#1d1d1f] tabular-nums">
            #{order.orderNumber}
          </p>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase ${ORDER_STATUS_COLORS[order.status] ?? "bg-[#f5f5f7] text-[#86868b]"}`}
          >
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </span>
          {order.loyaltyRewardId && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#fde8ee] text-[#e8416f]">
              <Sparkles className="h-2.5 w-2.5" />
              Recompense
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#86868b] mt-0.5">
          {formatDateTime(order.createdAt)}
          {order.loyaltyPointsEarned
            ? ` · +${order.loyaltyPointsEarned} pts`
            : ""}
        </p>
      </div>
      <span className="text-sm font-semibold text-[#1d1d1f] tabular-nums shrink-0">
        {formatPrice(order.total)}
      </span>
    </Link>
  );
}

/* ───────── formatters ───────── */

function formatPrice(cents: number) {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days}j`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem`;
  return `Il y a ${Math.floor(days / 30)} mois`;
}
