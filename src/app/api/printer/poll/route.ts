import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildEposPrintXml,
  buildEmptyPollResponse,
} from "@/lib/printer/epos-print";
import type { OrderWithItems } from "@/types/order";

/**
 * POST /api/printer/poll
 *
 * Endpoint que l'imprimante en cuisine appelle toutes les X secondes
 * (typiquement 10s, configurable côté imprimante).
 *
 * Reponses possibles :
 *  - 200 + XML ePOS-Print avec ticket  → l'imprimante imprime
 *  - 200 + XML vide                    → "rien a imprimer, retente plus tard"
 *
 * Securite : pas d'auth requise sur cet endpoint car l'imprimante n'a pas
 * d'auth header configurable. La proteciton vient du fait que :
 *  1. L'URL contient un token secret (env var PRINTER_POLL_SECRET)
 *  2. Le contenu retourne est juste l'ESC/POS d'une commande Pay (donc
 *     potentiellement crawlable mais aucune info sensible : c'est ce qui
 *     part en cuisine pour faire un sandwich)
 *
 * Flow atomique : on lock une row 'pending' et on la passe en 'in_flight'
 * dans la meme transaction pour eviter qu'une 2eme imprimante l'imprime
 * en double.
 */

// Authentification via token dans le path ou query string.
// L'imprimante a une URL configuree comme :
//   https://southstreetfood.vercel.app/api/printer/poll?token=XXX
function validateToken(request: Request): boolean {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const expected = process.env.PRINTER_POLL_SECRET;
  if (!expected) {
    // Si pas configure en env, on accepte (mode dev/test)
    return true;
  }
  return token === expected;
}

export async function POST(request: Request) {
  if (!validateToken(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();

  // 1. Récupère le plus ancien job 'pending' (FIFO)
  //    eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: jobs } = await (admin as any)
    .from("print_jobs")
    .select("id, order_id, attempts")
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(1);

  if (!jobs || jobs.length === 0) {
    // Pas de job en attente → réponse XML vide
    return new NextResponse(buildEmptyPollResponse(), {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  }

  const job = jobs[0];

  // 2. Lock le job en passant à 'in_flight' (évite double print si 2
  //    imprimantes pollent en même temps — improbable mais safe)
  //    eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error: updateErr } = await (admin as any)
    .from("print_jobs")
    .update({
      status: "in_flight",
      served_at: new Date().toISOString(),
      attempts: job.attempts + 1,
    })
    .eq("id", job.id)
    .eq("status", "pending") // CAS atomique
    .select("id")
    .single();

  if (updateErr || !updated) {
    // Race condition : un autre poll a chopé le job juste avant nous.
    // On répond "rien à imprimer", le prochain poll choppera le prochain job.
    return new NextResponse(buildEmptyPollResponse(), {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  }

  // 3. Fetch les détails de la commande
  //    eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orderRaw } = await (admin as any)
    .from("orders")
    .select("*, order_items(*), delivery_address:delivery_addresses(*)")
    .eq("id", job.order_id)
    .single();

  if (!orderRaw) {
    // Commande disparue ? Bizarre. On marque failed et on répond vide.
    //    eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("print_jobs")
      .update({
        status: "failed",
        last_error: "order_not_found",
      })
      .eq("id", job.id);

    return new NextResponse(buildEmptyPollResponse(), {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  }

  // delivery_address arrive comme array dans la jointure Supabase, on unwrap
  const order: OrderWithItems = {
    ...orderRaw,
    delivery_address: Array.isArray(orderRaw.delivery_address)
      ? orderRaw.delivery_address[0] ?? null
      : orderRaw.delivery_address ?? null,
  };

  // 4. Génère le XML ePOS-Print du ticket
  const eposXml = buildEposPrintXml(order);

  // 5. Enveloppe en SOAP — Server Direct Print attend le ePOS-Print
  //    DANS un SOAP envelope, pas le XML nu. C'est le meme format que
  //    celui qu'on envoyait via le bridge sur /cgi-bin/epos/service.cgi
  //    (et qui imprimait). Sans le SOAP wrapper, l'imprimante recupere
  //    le job (HTTP 200) mais n'imprime rien.
  const soapResponse = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
<s:Body>
${eposXml.replace(/<\?xml[^?]*\?>\s*/, "")}
</s:Body>
</s:Envelope>`;

  // 6. Renvoie à l'imprimante
  return new NextResponse(soapResponse, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "X-Print-Job-Id": job.id,
    },
  });
}

// L'imprimante peut faire un GET en heartbeat selon les firmwares,
// on accepte aussi GET et on retourne le même flow.
export const GET = POST;
