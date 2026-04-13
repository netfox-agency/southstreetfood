"use client";

import { useState, useEffect, useRef } from "react";
import {
  CalendarDays,
  Clock,
  Users,
  User,
  Phone,
  Mail,
  MessageSquare,
  Check,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

/* ───────────────────── helpers ───────────────────── */

const lunchSlots = [
  "11:30", "11:45", "12:00", "12:15", "12:30", "12:45",
  "13:00", "13:15", "13:30", "13:45", "14:00",
];

const dinnerSlots = [
  "18:30", "18:45", "19:00", "19:15", "19:30", "19:45",
  "20:00", "20:15", "20:30", "20:45", "21:00", "21:15", "21:30",
];

const partySizes = [1, 2, 3, 4, 5, 6, 7, 8];

function formatDateFr(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  const parts = digits.match(/.{1,2}/g);
  return parts ? parts.join(" ") : digits;
}

function isSlotPast(date: string, time: string): boolean {
  if (!date) return false;
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  if (date !== todayStr) return false;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m <= now.getHours() * 60 + now.getMinutes();
}

/** Generate quick-pick dates (today + next 6 days) */
function getQuickDates(): { label: string; value: string; sublabel: string }[] {
  const dates: { label: string; value: string; sublabel: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split("T")[0];
    const weekday = d.toLocaleDateString("fr-FR", { weekday: "short" });
    const day = d.getDate().toString();
    const sublabel = i === 0 ? "Aujourd'hui" : i === 1 ? "Demain" : weekday;
    dates.push({ label: day, value, sublabel });
  }
  return dates;
}

/* ───────────────────── component ───────────────────── */

export default function ReservationPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    reservation_number?: number;
    reservation_date?: string;
    reservation_time?: string;
  } | null>(null);
  const [customSize, setCustomSize] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right">("left");

  const containerRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    party_size: 2,
    reservation_date: "",
    reservation_time: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    notes: "",
  });

  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const quickDates = getQuickDates();

  // Scroll to top on step change
  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const goToStep2 = () => {
    if (!form.reservation_date) {
      toast.error("Choisissez une date");
      return;
    }
    if (!form.reservation_time) {
      toast.error("Choisissez un creneau horaire");
      return;
    }
    setSlideDir("left");
    setStep(2);
  };

  const goToStep1 = () => {
    setSlideDir("right");
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!form.customer_name.trim()) {
      toast.error("Entrez votre nom");
      return;
    }
    const phoneDigits = form.customer_phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      toast.error("Numero de telephone invalide");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          customer_phone: form.customer_phone.replace(/\s/g, ""),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setConfirmationData(data.reservation);
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la reservation";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-5">
        <div className="text-center max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="h-16 w-16 rounded-full bg-[#34c759]/10 flex items-center justify-center mx-auto mb-5">
            <Check className="h-8 w-8 text-[#34c759]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1d1d1f] mb-2">
            Demande envoyee !
          </h1>
          <p className="text-[#86868b] text-[15px] mb-1">
            {form.party_size}{" "}
            {form.party_size > 1 ? "personnes" : "personne"} &middot;{" "}
            {formatDateFr(form.reservation_date)} &middot;{" "}
            {form.reservation_time}
          </p>
          {confirmationData?.reservation_number && (
            <p className="text-[#1d1d1f] font-semibold text-sm mb-1">
              Reservation #{confirmationData.reservation_number}
            </p>
          )}
          <p className="text-[#86868b] text-sm mb-2">
            Nous vous confirmerons votre table par telephone.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium mb-8">
            <Clock className="h-3 w-3" />
            En attente de confirmation
          </div>
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1d1d1f] text-white rounded-xl text-sm font-semibold hover:bg-[#1d1d1f]/90 transition-colors"
            >
              Retour a l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div ref={containerRef} className="min-h-[80vh] max-w-lg mx-auto px-5 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[#86868b] text-sm mb-4 hover:text-[#1d1d1f] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <h1 className="text-3xl font-bold text-[#1d1d1f] tracking-tight">
          Reserver une table
        </h1>
        <p className="text-[#86868b] mt-1">
          Choisissez votre creneau et on s&apos;occupe du reste.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center gap-2 flex-1">
          <div
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              step >= 1 ? "bg-[#1d1d1f]" : "bg-[#e5e5ea]"
            }`}
          />
          <div
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              step >= 2 ? "bg-[#1d1d1f]" : "bg-[#e5e5ea]"
            }`}
          />
        </div>
        <span className="text-xs text-[#aeaeb2] tabular-nums">{step}/2</span>
      </div>

      {/* ───────── STEP 1 ───────── */}
      <div
        className={`transition-all duration-300 ease-out ${
          step === 1
            ? "opacity-100 translate-x-0"
            : slideDir === "left"
            ? "opacity-0 -translate-x-4 h-0 overflow-hidden"
            : "opacity-0 translate-x-4 h-0 overflow-hidden"
        }`}
      >
        {step === 1 && (
          <div className="space-y-7">
            {/* Party size */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f] mb-3">
                <Users className="h-4 w-4 text-[#86868b]" />
                Nombre de personnes
              </label>
              {!customSize ? (
                <div className="flex flex-wrap gap-2">
                  {partySizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setForm({ ...form, party_size: size })}
                      className={`h-11 w-11 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        form.party_size === size
                          ? "bg-[#1d1d1f] text-white scale-105"
                          : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setCustomSize(true);
                      setForm({ ...form, party_size: 9 });
                    }}
                    className={`h-11 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      form.party_size > 8
                        ? "bg-[#1d1d1f] text-white scale-105"
                        : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea]"
                    }`}
                  >
                    9+
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setCustomSize(false);
                      setForm({ ...form, party_size: 2 });
                    }}
                    className="text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-2 bg-[#f5f5f7] rounded-xl px-2">
                    <button
                      onClick={() =>
                        setForm({
                          ...form,
                          party_size: Math.max(9, form.party_size - 1),
                        })
                      }
                      className="h-10 w-10 flex items-center justify-center hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-lg font-bold text-[#1d1d1f] w-8 text-center tabular-nums">
                      {form.party_size}
                    </span>
                    <button
                      onClick={() =>
                        setForm({
                          ...form,
                          party_size: Math.min(20, form.party_size + 1),
                        })
                      }
                      className="h-10 w-10 flex items-center justify-center hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-[#86868b]">personnes</span>
                </div>
              )}
            </div>

            {/* Quick date picker */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f] mb-3">
                <CalendarDays className="h-4 w-4 text-[#86868b]" />
                Date
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                {quickDates.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => {
                      setForm({ ...form, reservation_date: d.value, reservation_time: "" });
                    }}
                    className={`flex flex-col items-center gap-0.5 min-w-[4.2rem] px-3 py-2.5 rounded-xl text-center transition-all cursor-pointer shrink-0 ${
                      form.reservation_date === d.value
                        ? "bg-[#1d1d1f] text-white scale-105"
                        : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea]"
                    }`}
                  >
                    <span className="text-[11px] font-medium opacity-70 leading-none">
                      {d.sublabel}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {d.label}
                    </span>
                  </button>
                ))}
                {/* "Autre date" button opens native picker */}
                <label
                  className={`flex flex-col items-center justify-center gap-0.5 min-w-[4.2rem] px-3 py-2.5 rounded-xl text-center transition-all cursor-pointer shrink-0 ${
                    form.reservation_date &&
                    !quickDates.some((d) => d.value === form.reservation_date)
                      ? "bg-[#1d1d1f] text-white"
                      : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#e5e5ea] hover:text-[#1d1d1f]"
                  }`}
                >
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-[10px] font-medium leading-none">Autre</span>
                  <input
                    type="date"
                    min={today}
                    max={maxDate}
                    value={form.reservation_date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        reservation_date: e.target.value,
                        reservation_time: "",
                      })
                    }
                    className="sr-only"
                  />
                </label>
              </div>
              {form.reservation_date &&
                !quickDates.some((d) => d.value === form.reservation_date) && (
                  <p className="text-sm text-[#1d1d1f] font-medium mt-2">
                    {formatDateFr(form.reservation_date)}
                  </p>
                )}
            </div>

            {/* Time slots — grouped Midi / Soir */}
            {form.reservation_date && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Midi */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
                      Midi
                    </span>
                    <div className="flex-1 h-px bg-[#e5e5ea]" />
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {lunchSlots.map((time) => {
                      const past = isSlotPast(form.reservation_date, time);
                      return (
                        <button
                          key={time}
                          onClick={() =>
                            !past &&
                            setForm({ ...form, reservation_time: time })
                          }
                          disabled={past}
                          className={`h-10 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                            past
                              ? "bg-[#f5f5f7] text-[#d1d1d6] cursor-not-allowed line-through"
                              : form.reservation_time === time
                              ? "bg-[#1d1d1f] text-white scale-105"
                              : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea]"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Soir */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
                      Soir
                    </span>
                    <div className="flex-1 h-px bg-[#e5e5ea]" />
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {dinnerSlots.map((time) => {
                      const past = isSlotPast(form.reservation_date, time);
                      return (
                        <button
                          key={time}
                          onClick={() =>
                            !past &&
                            setForm({ ...form, reservation_time: time })
                          }
                          disabled={past}
                          className={`h-10 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                            past
                              ? "bg-[#f5f5f7] text-[#d1d1d6] cursor-not-allowed line-through"
                              : form.reservation_time === time
                              ? "bg-[#1d1d1f] text-white scale-105"
                              : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea]"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Continue button */}
            <button
              onClick={goToStep2}
              disabled={!form.reservation_date || !form.reservation_time}
              className="w-full h-12 rounded-xl bg-[#1d1d1f] text-white font-semibold text-sm hover:bg-[#1d1d1f]/90 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 group"
            >
              Continuer
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* ───────── STEP 2 ───────── */}
      <div
        className={`transition-all duration-300 ease-out ${
          step === 2
            ? "opacity-100 translate-x-0"
            : slideDir === "right"
            ? "opacity-0 -translate-x-4 h-0 overflow-hidden"
            : "opacity-0 translate-x-4 h-0 overflow-hidden"
        }`}
      >
        {step === 2 && (
          <div className="space-y-4">
            {/* Recap card */}
            <div className="p-4 rounded-xl bg-[#f5f5f7] flex items-center justify-between">
              <div>
                <p className="text-xs text-[#86868b] mb-0.5">
                  Votre reservation
                </p>
                <p className="text-[15px] font-semibold text-[#1d1d1f]">
                  {form.party_size} pers. &middot;{" "}
                  {formatDateShort(form.reservation_date)} &middot;{" "}
                  {form.reservation_time}
                </p>
              </div>
              <button
                onClick={goToStep1}
                className="text-sm text-brand font-medium hover:underline cursor-pointer"
              >
                Modifier
              </button>
            </div>

            {/* Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f] mb-2">
                <User className="h-4 w-4 text-[#86868b]" />
                Nom complet
              </label>
              <input
                type="text"
                placeholder="Jean Dupont"
                value={form.customer_name}
                onChange={(e) =>
                  setForm({ ...form, customer_name: e.target.value })
                }
                autoFocus
                className="w-full h-12 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] text-sm placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 focus:border-[#1d1d1f]/30 transition-all"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f] mb-2">
                <Phone className="h-4 w-4 text-[#86868b]" />
                Telephone
              </label>
              <input
                type="tel"
                placeholder="06 12 34 56 78"
                value={form.customer_phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    customer_phone: formatPhone(e.target.value),
                  })
                }
                className="w-full h-12 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] text-sm placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 focus:border-[#1d1d1f]/30 transition-all tabular-nums"
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f] mb-2">
                <Mail className="h-4 w-4 text-[#86868b]" />
                Email{" "}
                <span className="text-[#aeaeb2] font-normal">(optionnel)</span>
              </label>
              <input
                type="email"
                placeholder="jean@email.com"
                value={form.customer_email}
                onChange={(e) =>
                  setForm({ ...form, customer_email: e.target.value })
                }
                className="w-full h-12 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] text-sm placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 focus:border-[#1d1d1f]/30 transition-all"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f] mb-2">
                <MessageSquare className="h-4 w-4 text-[#86868b]" />
                Notes{" "}
                <span className="text-[#aeaeb2] font-normal">(optionnel)</span>
              </label>
              <textarea
                placeholder="Allergie, anniversaire, terrasse..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] text-sm placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 focus:border-[#1d1d1f]/30 transition-all resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={goToStep1}
                className="h-12 px-5 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] font-semibold text-sm hover:bg-[#e5e5ea] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  loading || !form.customer_name.trim() || form.customer_phone.replace(/\D/g, "").length < 10
                }
                className="flex-1 h-12 rounded-xl bg-[#1d1d1f] text-white font-semibold text-sm hover:bg-[#1d1d1f]/90 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  "Confirmer la reservation"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
