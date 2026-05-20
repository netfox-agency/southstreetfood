import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/printer/done
 *
 * Endpoint que l'imprimante appelle apres avoir imprime (ou tente
 * d'imprimer) un ticket. Permet de marquer le job comme 'printed'
 * (success) ou 'failed' (a re-essayer).
 *
 * Body attendu (selon Epson Server Direct Print) :
 *   { jobId: string, success: boolean, error?: string }
 *
 * Si l'imprimante ne call jamais cet endpoint (firmware ancien ou
 * config minimale), un job 'in_flight' depuis plus de 60s est repassé
 * automatiquement en 'pending' par /api/printer/poll → retry.
 */
function validateToken(request: NextRequest): boolean {
  const token = request.nextUrl.searchParams.get("token");
  const expected = process.env.PRINTER_POLL_SECRET;
  if (!expected) return true;
  return token === expected;
}

export async function POST(request: NextRequest) {
  if (!validateToken(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body: { jobId?: string; success?: boolean; error?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Pas de body JSON valide — peut-être que l'imprimante envoie autre
    // chose (XML SOAP). Pour l'instant on récupère le job depuis le
    // header X-Print-Job-Id si présent.
  }

  const jobId =
    body.jobId ?? request.headers.get("x-print-job-id") ?? undefined;

  if (!jobId) {
    return NextResponse.json(
      { error: "jobId requis" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const success = body.success !== false; // par défaut on assume success

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("print_jobs")
    .update({
      status: success ? "printed" : "failed",
      last_error: success ? null : body.error || "printer_reported_failure",
      printed_at: success ? new Date().toISOString() : null,
    })
    .eq("id", jobId);

  return NextResponse.json({ ok: true });
}
