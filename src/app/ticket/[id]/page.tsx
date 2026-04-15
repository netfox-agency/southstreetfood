"use client";

import { useEffect, useState, use } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/constants";

type TicketOrder = {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  order_type: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  notes: string | null;
  created_at: string;
  order_items: Array<{
    id: string;
    item_name: string;
    variant_name: string | null;
    quantity: number;
    unit_price: number;
    extras_price: number;
    extras_json: Array<{ name: string; price: number }> | null;
    special_instructions: string | null;
  }>;
  delivery_address: {
    street: string;
    city: string;
    postal_code: string;
    delivery_instructions: string | null;
  } | null;
};

const fmt = (cents: number) =>
  `${(cents / 100).toFixed(2).replace(".", ",")} EUR`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

const typeLabel = (t: string) => {
  if (t === "delivery") return "LIVRAISON";
  if (t === "dine_in") return "SUR PLACE";
  return "A EMPORTER";
};

export default function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<TicketOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}/ticket`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setOrder(data.order);
      })
      .catch(() => setError("Commande introuvable"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7]">
        <div className="h-6 w-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f5f7] gap-3">
        <p className="text-red-600 font-medium">{error || "Commande introuvable"}</p>
        <button
          onClick={() => window.history.back()}
          className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer"
        >
          &larr; Retour
        </button>
      </div>
    );
  }

  const num = `#${String(order.order_number).padStart(4, "0")}`;
  const sep = (
    <div className="border-t border-dashed border-gray-300 my-3" />
  );

  return (
    <>
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 2mm; }
          body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .ticket-wrap { padding: 0 !important; background: white !important; }
          .ticket {
            width: 100% !important; max-width: none !important;
            margin: 0 !important; box-shadow: none !important;
            border: none !important; border-radius: 0 !important;
          }
        }
        @media screen {
          .ticket-wrap { min-height: 100vh; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 px-5 py-3 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{num}</span>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1d1d1f] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </button>
        </div>
      </div>

      {/* Ticket */}
      <div className="ticket-wrap flex justify-center py-8 px-4 bg-[#f5f5f7]">
        <div className="ticket w-[302px] bg-white rounded-2xl shadow-lg p-6 font-mono text-[13px] text-gray-900 leading-relaxed">
          {/* ── Header ── */}
          <div className="text-center mb-1">
            <h1 className="text-[15px] font-black tracking-tight uppercase">
              {BRAND.name}
            </h1>
            <p className="text-[10px] text-gray-400 mt-0.5">{BRAND.address}</p>
            <p className="text-[10px] text-gray-400">{BRAND.phone}</p>
          </div>

          {sep}

          {/* ── Order meta ── */}
          <div className="text-center mb-1">
            <p className="text-[22px] font-black tracking-tight leading-none">
              {num}
            </p>
            <p className="text-[10px] text-gray-400 mt-1.5">
              {fmtDate(order.created_at)} a {fmtTime(order.created_at)}
            </p>
            <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-gray-100 text-gray-700">
              {typeLabel(order.order_type)}
            </span>
          </div>

          {sep}

          {/* ── Client ── */}
          <div className="mb-1">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">
              Client
            </p>
            <p className="font-bold text-[12px]">{order.customer_name}</p>
            <p className="text-gray-600 text-[11px]">{order.customer_phone}</p>
            {order.customer_email && (
              <p className="text-gray-500 text-[10px]">
                {order.customer_email}
              </p>
            )}
          </div>

          {/* ── Delivery address ── */}
          {order.order_type === "delivery" && order.delivery_address && (
            <div className="mb-1">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">
                Adresse
              </p>
              <p className="text-[11px]">{order.delivery_address.street}</p>
              <p className="text-[11px]">
                {order.delivery_address.postal_code}{" "}
                {order.delivery_address.city}
              </p>
              {order.delivery_address.delivery_instructions && (
                <p className="text-[10px] italic text-gray-500 mt-0.5">
                  {order.delivery_address.delivery_instructions}
                </p>
              )}
            </div>
          )}

          {sep}

          {/* ── Items ── */}
          <div className="space-y-2 mb-1">
            {order.order_items.map((item) => {
              const lineTotal =
                (item.unit_price + item.extras_price) * item.quantity;
              return (
                <div key={item.id}>
                  <div className="flex justify-between gap-1">
                    <div className="flex-1 min-w-0 text-[12px]">
                      <span className="font-bold">{item.quantity}x</span>{" "}
                      {item.item_name}
                      {item.variant_name && (
                        <span className="text-gray-500">
                          {" "}
                          ({item.variant_name})
                        </span>
                      )}
                    </div>
                    <span className="font-bold tabular-nums shrink-0 text-[12px]">
                      {fmt(lineTotal)}
                    </span>
                  </div>
                  {item.extras_json && item.extras_json.length > 0 && (
                    <div className="ml-3 text-[10px] text-gray-500">
                      {item.extras_json.map((ex, i) => (
                        <div key={i} className="flex justify-between">
                          <span>+ {ex.name}</span>
                          {ex.price > 0 && (
                            <span className="tabular-nums">{fmt(ex.price)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {item.special_instructions && (
                    <p className="ml-3 text-[10px] italic text-gray-400">
                      &quot;{item.special_instructions}&quot;
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {sep}

          {/* ── Totals ── */}
          <div className="space-y-0.5 text-[12px]">
            <div className="flex justify-between">
              <span className="text-gray-600">Sous-total</span>
              <span className="tabular-nums">{fmt(order.subtotal)}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Livraison</span>
                <span className="tabular-nums">{fmt(order.delivery_fee)}</span>
              </div>
            )}
            <div className="border-t border-gray-800 pt-1.5 mt-1 flex justify-between font-black text-[14px]">
              <span>TOTAL TTC</span>
              <span className="tabular-nums">{fmt(order.total)}</span>
            </div>
          </div>

          {/* ── Notes ── */}
          {order.notes && (
            <>
              {sep}
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">
                Notes
              </p>
              <p className="text-[11px] text-gray-700">{order.notes}</p>
            </>
          )}

          {/* ── Footer ── */}
          {sep}
          <div className="text-center text-[10px] text-gray-400 leading-relaxed">
            <p className="font-medium text-gray-500">
              Merci pour votre commande !
            </p>
            <p className="mt-1">{BRAND.name}</p>
            <p className="mt-2 text-[9px] text-gray-300">
              {fmtDate(order.created_at)} {fmtTime(order.created_at)} · {num}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
