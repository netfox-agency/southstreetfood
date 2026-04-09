"use client";

import { useState } from "react";
import { CalendarDays, Clock, Users, User, Phone, Mail, MessageSquare, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

const partySizes = [1, 2, 3, 4, 5, 6, 7, 8];

const timeSlots = [
  "11:30", "11:45", "12:00", "12:15", "12:30", "12:45",
  "13:00", "13:15", "13:30", "13:45", "14:00",
  "18:30", "18:45", "19:00", "19:15", "19:30", "19:45",
  "20:00", "20:15", "20:30", "20:45", "21:00", "21:15", "21:30",
];

export default function ReservationPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

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
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la reservation";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 rounded-full bg-[#34c759]/10 flex items-center justify-center mx-auto mb-5">
            <Check className="h-8 w-8 text-[#34c759]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1d1d1f] mb-2">Reservation confirmee !</h1>
          <p className="text-[#86868b] text-[15px] mb-1">
            {form.party_size} {form.party_size > 1 ? "personnes" : "personne"} &middot;{" "}
            {new Date(form.reservation_date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} &middot; {form.reservation_time}
          </p>
          <p className="text-[#86868b] text-sm mb-8">
            Vous recevrez une confirmation par telephone.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1d1d1f] text-white rounded-xl text-sm font-semibold hover:bg-[#1d1d1f]/90 transition-colors"
          >
            Retour a l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] max-w-lg mx-auto px-5 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[#86868b] text-sm mb-4 hover:text-[#1d1d1f] transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <h1 className="text-3xl font-bold text-[#1d1d1f] tracking-tight">Reserver une table</h1>
        <p className="text-[#86868b] mt-1">Choisissez votre creneau et on s&apos;occupe du reste.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              s <= step ? "bg-[#1d1d1f]" : "bg-[#e5e5ea]"
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Step 1: Date, Time, Party Size */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Party size */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f] mb-3">
              <Users className="h-4 w-4 text-[#86868b]" />
              Nombre de personnes
            </label>
            <div className="flex flex-wrap gap-2">
              {partySizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setForm({ ...form, party_size: size })}
                  className={`h-11 w-11 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    form.party_size === size
                      ? "bg-[#1d1d1f] text-white"
                      : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea]"
                  }`}
                >
                  {size}
                </button>
              ))}
              <button
                onClick={() => setForm({ ...form, party_size: 10 })}
                className={`h-11 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  form.party_size > 8
                    ? "bg-[#1d1d1f] text-white"
                    : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea]"
                }`}
              >
                9+
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f] mb-3">
              <CalendarDays className="h-4 w-4 text-[#86868b]" />
              Date
            </label>
            <input
              type="date"
              min={today}
              max={maxDate}
              value={form.reservation_date}
              onChange={(e) => setForm({ ...form, reservation_date: e.target.value })}
              className="w-full h-12 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 focus:border-[#1d1d1f]/30 transition-all"
            />
          </div>

          {/* Time */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f] mb-3">
              <Clock className="h-4 w-4 text-[#86868b]" />
              Heure
            </label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setForm({ ...form, reservation_time: time })}
                  className={`h-10 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                    form.reservation_time === time
                      ? "bg-[#1d1d1f] text-white"
                      : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea]"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              if (!form.reservation_date || !form.reservation_time) {
                setError("Choisissez une date et une heure");
                return;
              }
              setError("");
              setStep(2);
            }}
            disabled={!form.reservation_date || !form.reservation_time}
            className="w-full h-12 rounded-xl bg-[#1d1d1f] text-white font-semibold text-sm hover:bg-[#1d1d1f]/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            Continuer
          </button>
        </div>
      )}

      {/* Step 2: Contact Info */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#f5f5f7] mb-2">
            <p className="text-sm text-[#86868b]">Votre reservation</p>
            <p className="text-[15px] font-semibold text-[#1d1d1f]">
              {form.party_size} pers. &middot;{" "}
              {new Date(form.reservation_date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} &middot; {form.reservation_time}
            </p>
            <button onClick={() => setStep(1)} className="text-sm text-brand underline mt-1 cursor-pointer">
              Modifier
            </button>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f] mb-2">
              <User className="h-4 w-4 text-[#86868b]" />
              Nom complet
            </label>
            <input
              type="text"
              placeholder="Jean Dupont"
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              className="w-full h-12 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] text-sm placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 focus:border-[#1d1d1f]/30 transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f] mb-2">
              <Phone className="h-4 w-4 text-[#86868b]" />
              Telephone
            </label>
            <input
              type="tel"
              placeholder="06 12 34 56 78"
              value={form.customer_phone}
              onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              className="w-full h-12 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] text-sm placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 focus:border-[#1d1d1f]/30 transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f] mb-2">
              <Mail className="h-4 w-4 text-[#86868b]" />
              Email <span className="text-[#aeaeb2] font-normal">(optionnel)</span>
            </label>
            <input
              type="email"
              placeholder="jean@email.com"
              value={form.customer_email}
              onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
              className="w-full h-12 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] text-sm placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 focus:border-[#1d1d1f]/30 transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f] mb-2">
              <MessageSquare className="h-4 w-4 text-[#86868b]" />
              Notes <span className="text-[#aeaeb2] font-normal">(optionnel)</span>
            </label>
            <textarea
              placeholder="Allergie, anniversaire, terrasse..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] text-sm placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 focus:border-[#1d1d1f]/30 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="h-12 px-6 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] font-semibold text-sm hover:bg-[#e5e5ea] transition-colors cursor-pointer"
            >
              Retour
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !form.customer_name || !form.customer_phone}
              className="flex-1 h-12 rounded-xl bg-[#1d1d1f] text-white font-semibold text-sm hover:bg-[#1d1d1f]/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
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
  );
}
