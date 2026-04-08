import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST — Create a new reservation (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, customer_phone, customer_email, party_size, reservation_date, reservation_time, notes } = body;

    if (!customer_name || !customer_phone || !reservation_date || !reservation_time || !party_size) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await (admin as any)
      .from("reservations")
      .insert({
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        party_size: parseInt(party_size),
        reservation_date,
        reservation_time,
        notes: notes || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Reservation error:", error);
      return NextResponse.json({ error: "Erreur lors de la reservation" }, { status: 500 });
    }

    return NextResponse.json({ reservation: data });
  } catch (err) {
    console.error("Reservation error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET — List reservations (for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // YYYY-MM-DD
    const status = searchParams.get("status");

    const admin = createAdminClient();
    let query = (admin as any)
      .from("reservations")
      .select("*")
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true });

    if (date) {
      query = query.eq("reservation_date", date);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Erreur" }, { status: 500 });
    }

    return NextResponse.json({ reservations: data || [] });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH — Update reservation status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "ID et status requis" }, { status: 400 });
    }

    const admin = createAdminClient();
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "confirmed" || status === "completed") {
      updateData.treated_at = new Date().toISOString();
    }

    const { data, error } = await (admin as any)
      .from("reservations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Erreur mise a jour" }, { status: 500 });
    }

    return NextResponse.json({ reservation: data });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
