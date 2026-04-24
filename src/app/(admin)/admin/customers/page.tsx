"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Phone,
  Mail,
  ShoppingBag,
  Crown,
  Clock,
  TrendingUp,
  Star,
  User,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Customer = {
  id: string;
  userId: string | null;
  name: string;
  phone: string;
  email: string | null;
  hasAccount: boolean;
  orderCount: number;
  totalSpent: number;
  loyaltyPoints: number;
  lastOrderDate: string;
  firstOrderDate: string;
};

const formatPrice = (cents: number) =>
  `${(cents / 100).toFixed(2).replace(".", ",")} €`;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days}j`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`;
  return `Il y a ${Math.floor(days / 30)} mois`;
};

type AccountFilter = "all" | "account" | "guest";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("all");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = debouncedSearch
        ? `?search=${encodeURIComponent(debouncedSearch)}`
        : "";
      const res = await fetch(`/api/customers${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotalCustomers(data.totalCustomers || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtre compte/guest applique avant calcul stats + affichage
  const visibleCustomers =
    accountFilter === "all"
      ? customers
      : accountFilter === "account"
        ? customers.filter((c) => c.hasAccount)
        : customers.filter((c) => !c.hasAccount);

  // Compteurs globaux (indépendants du filtre) pour les chips
  const accountCount = customers.filter((c) => c.hasAccount).length;
  const guestCount = customers.length - accountCount;

  // Stats : calcul sur la liste visible (reflete le filtre)
  const totalRevenue = visibleCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgOrders =
    visibleCustomers.length > 0
      ? (
          visibleCustomers.reduce((sum, c) => sum + c.orderCount, 0) /
          visibleCustomers.length
        ).toFixed(1)
      : "0";
  const loyalCustomers = visibleCustomers.filter((c) => c.orderCount >= 3).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">
          Clients
        </h1>
        <p className="text-[#86868b] text-sm mt-0.5">
          Base clients auto-generee depuis les commandes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
            <Users className="h-[18px] w-[18px] text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-[#1d1d1f] tabular-nums">
            {totalCustomers}
          </p>
          <p className="text-[13px] text-[#86868b] mt-0.5">Clients uniques</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
            <TrendingUp className="h-[18px] w-[18px] text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[#1d1d1f] tabular-nums">
            {formatPrice(totalRevenue)}
          </p>
          <p className="text-[13px] text-[#86868b] mt-0.5">CA total clients</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
          <div className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
            <ShoppingBag className="h-[18px] w-[18px] text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-[#1d1d1f] tabular-nums">
            {avgOrders}
          </p>
          <p className="text-[13px] text-[#86868b] mt-0.5">
            Commandes / client
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
          <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
            <Crown className="h-[18px] w-[18px] text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-[#1d1d1f] tabular-nums">
            {loyalCustomers}
          </p>
          <p className="text-[13px] text-[#86868b] mt-0.5">
            Fideles (3+ cmd)
          </p>
        </div>
      </div>

      {/* Search + filter tabs */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#aeaeb2]" />
          <input
            type="text"
            placeholder="Rechercher (nom, telephone, email)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-[#e5e5ea] text-sm text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 transition-all"
          />
        </div>
        <div className="inline-flex h-10 rounded-xl bg-[#f5f5f7] p-1 gap-1 overflow-x-auto">
          <FilterTab
            label="Tous"
            count={customers.length}
            active={accountFilter === "all"}
            onClick={() => setAccountFilter("all")}
          />
          <FilterTab
            label="Avec compte"
            count={accountCount}
            active={accountFilter === "account"}
            onClick={() => setAccountFilter("account")}
          />
          <FilterTab
            label="Sans compte"
            count={guestCount}
            active={accountFilter === "guest"}
            onClick={() => setAccountFilter("guest")}
          />
        </div>
      </div>

      {/* Customer list */}
      <div className="bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-[#f5f5f7] animate-pulse"
              />
            ))}
          </div>
        ) : visibleCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-[#d1d1d6] mx-auto mb-3" />
            <p className="text-[#aeaeb2] text-sm">
              {search
                ? "Aucun client trouve"
                : accountFilter === "account"
                  ? "Aucun client avec compte"
                  : accountFilter === "guest"
                    ? "Aucun client sans compte"
                    : "Aucun client pour le moment"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0f0f2]">
            {visibleCustomers.map((customer) => (
              <Link
                key={customer.id}
                href={`/admin/customers/${encodeURIComponent(customer.id)}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#fafafa] transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                    customer.orderCount >= 5
                      ? "bg-amber-50"
                      : customer.orderCount >= 3
                      ? "bg-blue-50"
                      : "bg-[#f5f5f7]"
                  )}
                >
                  {customer.orderCount >= 5 ? (
                    <Crown className="h-4 w-4 text-amber-600" />
                  ) : (
                    <span className="text-xs font-bold text-[#1d1d1f]">
                      {customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-[#1d1d1f] truncate">
                      {customer.name}
                    </p>
                    {customer.hasAccount && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#0a0a0a] text-white text-[10px] font-bold tracking-wider uppercase">
                        <User className="h-2.5 w-2.5" />
                        Compte
                      </span>
                    )}
                    {customer.orderCount >= 5 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">
                        VIP
                      </span>
                    )}
                    {customer.orderCount >= 3 && customer.orderCount < 5 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                        FIDELE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {customer.phone && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#86868b]">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </span>
                    )}
                    {customer.email && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#86868b]">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Order stats + loyalty */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <ShoppingBag className="h-3 w-3 text-[#aeaeb2]" />
                    <span className="text-sm font-semibold text-[#1d1d1f] tabular-nums">
                      {customer.orderCount} cmd
                    </span>
                  </div>
                  <p className="text-xs font-medium text-emerald-600 tabular-nums mt-0.5">
                    {formatPrice(customer.totalSpent)}
                  </p>
                  {customer.loyaltyPoints > 0 && (
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <Star className="h-3 w-3 text-[#e8416f]" />
                      <span className="text-xs font-medium text-[#e8416f] tabular-nums">
                        {customer.loyaltyPoints} pts
                      </span>
                    </div>
                  )}
                </div>

                {/* Last order */}
                <div className="text-right shrink-0 hidden sm:block">
                  <div className="inline-flex items-center gap-1 text-xs text-[#86868b]">
                    <Clock className="h-3 w-3" />
                    {timeAgo(customer.lastOrderDate)}
                  </div>
                  <p className="text-[11px] text-[#aeaeb2] mt-0.5">
                    Depuis {formatDate(customer.firstOrderDate)}
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 text-[#c7c7cc] shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────── Filter tab ───────── */

function FilterTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer",
        active
          ? "bg-[#0a0a0a] text-white shadow-sm"
          : "text-[#86868b] hover:text-[#1d1d1f]",
      )}
    >
      {label}
      <span
        className={cn(
          "tabular-nums text-[11px]",
          active ? "text-white/70" : "text-[#aeaeb2]",
        )}
      >
        {count}
      </span>
    </button>
  );
}
