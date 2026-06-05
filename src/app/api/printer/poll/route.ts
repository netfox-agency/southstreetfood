import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildEposPrintXml } from "@/lib/printer/epos-print";
import type { OrderWithItems } from "@/types/order";

/**
 * POST /api/printer/poll — endpoint Server Direct Print pour Epson TM-m30III.
 *
 * Protocole Server Direct Print (reverse-engineered + doc Epson) :
 *
 *  L'imprimante POST toutes les X sec un body form-urlencoded :
 *    - ConnectionType=GetRequest&ID=&Name=<serial>
 *        → "T'as un truc a imprimer pour moi ?"
 *        → on repond <PrintRequestInfo> avec le ticket, OU vide si rien.
 *    - ConnectionType=SetResponse&...&printjobid=<id>&code=<result>
 *        → "J'ai fini d'imprimer le job X, voila le resultat"
 *        → on marque le job 'printed' (ou 'failed' si erreur).
 *
 *  Le format de reponse a un GetRequest DOIT etre :
 *    <PrintRequestInfo Version="2.00">
 *      <ePOSPrint>
 *        <Parameter>
 *          <devid>local_printer</devid>
 *          <timeout>10000</timeout>
 *          <printjobid>JOB_ID</printjobid>
 *        </Parameter>
 *        <PrintData>
 *          <epos-print xmlns="...">...</epos-print>
 *        </PrintData>
 *      </ePOSPrint>
 *    </PrintRequestInfo>
 *
 *  Sans cette enveloppe PrintRequestInfo, l'imprimante recupere bien le
 *  HTTP 200 mais n'imprime RIEN (c'etait notre bug : on renvoyait le
 *  epos-print nu, puis un SOAP envelope — aucun des deux n'est le bon
 *  format Server Direct Print).
 */

const DEVICE_ID = "local_printer";
const PRINT_TIMEOUT = 10000;

function validateToken(request: Request): boolean {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const expected = process.env.PRINTER_POLL_SECRET;
  if (!expected) return true; // pas configure → mode ouvert
  return token === expected;
}

/** Reponse "rien a imprimer" : body vide, l'imprimante re-poll plus tard. */
function emptyResponse(): NextResponse {
  return new NextResponse("", {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  if (!validateToken(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const rawBody = await request.text();
  const params = new URLSearchParams(rawBody);
  const connectionType = params.get("ConnectionType") || "GetRequest";

  // ─────────────────────────────────────────────────────────────────────
  // CAS 1 : SetResponse — l'imprimante confirme la fin d'un print
  // ─────────────────────────────────────────────────────────────────────
  if (connectionType === "SetResponse") {
    // Protocole 1.00 : le SetResponse ne contient PAS de printjobid. Le
    // ResponseFile contient le resultat (<PrintResponseInfo>). On marque
    // le job 'in_flight' le plus recent comme 'printed' (l'imprimante
    // traite les tickets sequentiellement, 1 a la fois).
    const responseFile = params.get("ResponseFile") || "";
    // Si le resultat contient success="false", c'est un echec.
    const failed = /success\s*=\s*"false"/i.test(responseFile);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recent } = await (admin as any)
      .from("print_jobs")
      .select("id")
      .eq("status", "in_flight")
      .order("served_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent?.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from("print_jobs")
        .update(
          failed
            ? { status: "failed", last_error: "printer reported failure" }
            : { status: "printed", printed_at: new Date().toISOString() },
        )
        .eq("id", recent.id);
    }
    return emptyResponse();
  }

  // ─────────────────────────────────────────────────────────────────────
  // CAS 2 : GetRequest — l'imprimante demande s'il y a un ticket
  // ─────────────────────────────────────────────────────────────────────

  // 0. Requeue les jobs bloques en 'in_flight' depuis > 90s. Si l'imprimante
  //    a recupere un ticket mais n'a jamais confirme (bourrage papier, coupure
  //    courant, contenu illisible), le job restait bloque a vie et le ticket
  //    ne sortait jamais. On le repasse en 'pending' pour qu'il soit re-tente.
  const STUCK_THRESHOLD_MS = 90_000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("print_jobs")
    .update({ status: "pending" })
    .eq("status", "in_flight")
    .lt("served_at", new Date(Date.now() - STUCK_THRESHOLD_MS).toISOString())
    .lt("attempts", 4) // au-dela de 4 tentatives, on abandonne (voir plus bas)
    .gt("expires_at", new Date().toISOString());

  // Les jobs in_flight trop vieux ET trop re-tentes → 'failed' (visible admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("print_jobs")
    .update({ status: "failed", last_error: "no printer confirmation after retries" })
    .eq("status", "in_flight")
    .gte("attempts", 4)
    .lt("served_at", new Date(Date.now() - STUCK_THRESHOLD_MS).toISOString());

  // 1. Plus ancien job 'pending' (FIFO)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: jobs } = await (admin as any)
    .from("print_jobs")
    .select("id, order_id, attempts")
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(1);

  if (!jobs || jobs.length === 0) {
    return emptyResponse();
  }

  const job = jobs[0];

  // 2. Lock atomique pending → in_flight
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error: updateErr } = await (admin as any)
    .from("print_jobs")
    .update({
      status: "in_flight",
      served_at: new Date().toISOString(),
      attempts: job.attempts + 1,
    })
    .eq("id", job.id)
    .eq("status", "pending")
    .select("id")
    .single();

  if (updateErr || !updated) {
    return emptyResponse();
  }

  // 3. Fetch la commande
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orderRaw } = await (admin as any)
    .from("orders")
    .select("*, order_items(*), delivery_address:delivery_addresses(*)")
    .eq("id", job.order_id)
    .single();

  if (!orderRaw) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("print_jobs")
      .update({ status: "failed", last_error: "order_not_found" })
      .eq("id", job.id);
    return emptyResponse();
  }

  const order: OrderWithItems = {
    ...orderRaw,
    delivery_address: Array.isArray(orderRaw.delivery_address)
      ? orderRaw.delivery_address[0] ?? null
      : orderRaw.delivery_address ?? null,
  };

  // 4. Genere le ePOS-Print XML, strip la declaration <?xml?>
  const eposXml = buildEposPrintXml(order).replace(/<\?xml[^?]*\?>\s*/, "");

  // 5. Enveloppe dans le format Server Direct Print PrintRequestInfo.
  //    L'imprimante parle le protocole Version 1.00 (vu dans son
  //    SetResponse : <PrintResponseInfo Version="1.00"/>). En 1.00 il n'y
  //    a PAS de tag <printjobid> (c'est une feature 2.00). Si on envoie du
  //    2.00 avec printjobid, l'imprimante recoit le job mais n'imprime pas.
  const response = `<?xml version="1.0" encoding="utf-8"?>
<PrintRequestInfo Version="1.00">
<ePOSPrint>
<Parameter>
<devid>${DEVICE_ID}</devid>
<timeout>${PRINT_TIMEOUT}</timeout>
</Parameter>
<PrintData>
${eposXml}
</PrintData>
</ePOSPrint>
</PrintRequestInfo>`;

  return new NextResponse(response, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "X-Print-Job-Id": job.id,
    },
  });
}

// Certains firmwares font un GET en heartbeat : meme flow.
export const GET = POST;
