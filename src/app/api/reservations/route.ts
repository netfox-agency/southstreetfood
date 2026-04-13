import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  createReservationSchema,
  updateReservationSchema,
} from "@/lib/validators";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// Role-gate helper — resolves the current session (via SSR cookie) and
// checks that the user has a staff role in the `profiles` table. Returns
// null if authorized, a NextResponse error otherwise.
async function requireStaff(): Promise<NextResponse | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  // Use admin client for role lookup to avoid RLS dependency on auth path
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as { role: string } | null)?.role;
  if (role !== "admin" && role !== "kitchen") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }
  return null;
}

// POST — Create a reservation (public, rate-limited)
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit("reservations.create", ip, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives, veuillez patienter." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      }
    );
  }

  try {
    const body = await request.json();
    const parsed = createReservationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Reject past dates and dates more than 60 days in the future.
    const reservationDate = new Date(parsed.data.reservation_date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 60);
    if (reservationDate < today) {
      return NextResponse.json(
        { error: "La date doit etre future" },
        { status: 400 }
      );
    }
    if (reservationDate > maxDate) {
      return NextResponse.json(
        { error: "Reservations ouvertes jusqu'a 60 jours" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from("reservations")
      .insert({
        customer_name: parsed.data.customer_name,
        customer_phone: parsed.data.customer_phone,
        customer_email: parsed.data.customer_email || null,
        party_size: parsed.data.party_size,
        reservation_date: parsed.data.reservation_date,
        reservation_time: parsed.data.reservation_time,
        notes: parsed.data.notes || null,
        status: "pending",
      })
      .select("id, reservation_number, reservation_date, reservation_time")
      .single();

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[api/reservations] insert error:", error);
      }
      return NextResponse.json(
        { error: "Erreur lors de la reservation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reservation: data });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[api/reservations] POST error:", err);
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET — List reservations (staff only, paginated)
export async function GET(request: NextRequest) {
  const unauthorized = await requireStaff();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // YYYY-MM-DD
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("per_page") || "50", 10))
    );
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (admin as any)
      .from("reservations")
      .select("*", { count: "exact" })
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true })
      .range(from, to);

    if (date) query = query.eq("reservation_date", date);
    if (status && status !== "all") query = query.eq("status", status);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: "Erreur" }, { status: 500 });
    }

    return NextResponse.json({
      reservations: data || [],
      pagination: {
        page,
        per_page: perPage,
        total: count ?? 0,
      },
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH — Update reservation status (staff only)
export async function PATCH(request: NextRequest) {
  const unauthorized = await requireStaff();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const parsed = updateReservationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { id, status } = parsed.data;

    const admin = createAdminClient();
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "confirmed" || status === "completed") {
      updateData.treated_at = new Date().toISOString();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from("reservations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Erreur mise a jour" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reservation: data });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
