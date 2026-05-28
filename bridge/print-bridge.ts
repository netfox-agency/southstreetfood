#!/usr/bin/env bun
/**
 * SSF Print Bridge — local printer relay
 * =======================================
 *
 * Petit daemon Bun qui tourne sur le Mac (ou n'importe quel ordi) du resto
 * et qui imprime les tickets sur l'Epson TM-m30 quand une commande passe en
 * status='ready' cote cuisine.
 *
 * Pourquoi : le firmware de l'imprimante (01.30) ne supporte pas Server
 * Direct Print (la fonctionnalite ou l'imprimante va elle-meme chercher
 * les tickets sur Vercel). Du coup on fait l'inverse : le bridge ecoute
 * Supabase et envoie l'XML direct a l'imprimante en HTTP sur le LAN.
 *
 * Marche tant que :
 *   - le Mac/PC est allume
 *   - le Mac/PC est sur le meme WiFi que l'imprimante
 *   - l'imprimante est branchee + a du papier
 *
 * Lancement :
 *   bun run bridge
 *
 * Stop : Ctrl+C
 */

import { createClient } from "@supabase/supabase-js";
import { buildEposPrintXml } from "../src/lib/printer/epos-print";
import type { OrderWithItems } from "../src/types/order";

// ─── Config ──────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PRINTER_IP = process.env.PRINTER_IP || "192.168.1.58";
const PRINTER_DEVICE_ID = process.env.PRINTER_DEVICE_ID || "local_printer";
const PRINTER_TIMEOUT_MS = 10000;
const POLL_INTERVAL_MS = 5000;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY");
  console.error("   Cree un fichier .env.local a la racine du projet, copie depuis l'exemple.");
  process.exit(1);
}

const PRINTER_URL = `http://${PRINTER_IP}/cgi-bin/epos/service.cgi?devid=${PRINTER_DEVICE_ID}&timeout=${PRINTER_TIMEOUT_MS}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── Helpers ─────────────────────────────────────────────────────────
function ts(): string {
  return new Date().toLocaleTimeString("fr-FR");
}

function log(msg: string) {
  console.log(`[${ts()}] ${msg}`);
}

function logErr(msg: string, err?: unknown) {
  console.error(`[${ts()}] ❌ ${msg}`, err ?? "");
}

// ─── Print one job ───────────────────────────────────────────────────
async function processJob(jobId: string, orderId: string) {
  log(`📋 Job ${jobId.slice(0, 8)} (order ${orderId.slice(0, 8)})`);

  // 1. Atomic lock : pending -> in_flight
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: locked, error: lockErr } = await (supabase as any)
    .from("print_jobs")
    .update({
      status: "in_flight",
      served_at: new Date().toISOString(),
      attempts: 1,
    })
    .eq("id", jobId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (lockErr) {
    logErr(`Lock failed: ${lockErr.message}`);
    return;
  }
  if (!locked) {
    log(`   ⏩ deja pris par un autre bridge ou plus pending, skip`);
    return;
  }

  // 2. Fetch order with items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error: orderErr } = await (supabase as any)
    .from("orders")
    .select("*, order_items(*), delivery_address:delivery_addresses(*)")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    logErr(`Fetch order failed: ${orderErr?.message ?? "not found"}`);
    await markFailed(jobId, `fetch order: ${orderErr?.message ?? "not found"}`);
    return;
  }

  // 3. Generate XML
  let xml: string;
  try {
    xml = buildEposPrintXml(order as OrderWithItems);
  } catch (err) {
    logErr(`XML gen failed`, err);
    await markFailed(jobId, `xml gen: ${(err as Error).message}`);
    return;
  }

  // 4. POST to printer
  // Le TM-m30 accepte l'XML "nu" en HTTP POST a son endpoint ePOS.
  // Le wrapper SOAP n'est pas obligatoire si le Content-Type est bon.
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    ${xml.replace(/<\?xml[^?]+\?>/, "")}
  </s:Body>
</s:Envelope>`;

  try {
    log(`   🖨️  POST -> ${PRINTER_URL}`);
    const res = await fetch(PRINTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: '""',
      },
      body: soapEnvelope,
      signal: AbortSignal.timeout(PRINTER_TIMEOUT_MS + 2000),
    });

    const responseText = await res.text();
    const success =
      res.ok &&
      (responseText.includes('success="true"') ||
        !responseText.includes('success="false"'));

    if (!success) {
      logErr(`Printer rejected: HTTP ${res.status} - ${responseText.slice(0, 200)}`);
      await markFailed(jobId, `printer: ${responseText.slice(0, 200)}`);
      return;
    }

    log(`   ✅ Imprime !`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("print_jobs")
      .update({
        status: "printed",
        printed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  } catch (err) {
    logErr(`Fetch printer failed`, err);
    await markFailed(jobId, `network: ${(err as Error).message}`);
  }
}

async function markFailed(jobId: string, reason: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("print_jobs")
    .update({
      status: "failed",
      last_error: reason,
    })
    .eq("id", jobId);
}

// ─── Main loop : poll + realtime ─────────────────────────────────────
async function tick() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("print_jobs")
    .select("id, order_id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(5);

  if (error) {
    logErr(`Poll failed: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) return;

  for (const job of data) {
    await processJob(job.id, job.order_id);
  }
}

async function main() {
  console.log("════════════════════════════════════════════");
  console.log("   SSF PRINT BRIDGE");
  console.log("════════════════════════════════════════════");
  console.log(`Imprimante  : ${PRINTER_URL}`);
  console.log(`Supabase    : ${SUPABASE_URL}`);
  console.log(`Poll        : toutes les ${POLL_INTERVAL_MS / 1000}s`);
  console.log("════════════════════════════════════════════");
  console.log("");
  log("🟢 Bridge demarre. En attente de tickets...");
  console.log("");

  // Test printer reachability au demarrage
  try {
    const testRes = await fetch(`http://${PRINTER_IP}/`, {
      signal: AbortSignal.timeout(3000),
    }).catch(() => null);
    if (testRes) {
      log(`✅ Imprimante joignable a ${PRINTER_IP}`);
    } else {
      log(`⚠️  Imprimante NON joignable a ${PRINTER_IP} (verifier WiFi + cable)`);
    }
  } catch {
    log(`⚠️  Imprimante NON joignable a ${PRINTER_IP}`);
  }
  console.log("");

  // Subscribe realtime for instant pickup
  const channel = supabase
    .channel("print-bridge")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "print_jobs" },
      (payload) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const job = payload.new as any;
        if (job?.status === "pending" && job.id && job.order_id) {
          processJob(job.id, job.order_id);
        }
      },
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        log(`📡 Realtime branche`);
      }
    });

  // Poll loop (fallback si realtime drop)
  const interval = setInterval(() => {
    tick().catch((err) => logErr("tick failed", err));
  }, POLL_INTERVAL_MS);

  // Run initial tick
  await tick();

  // Cleanup on exit
  process.on("SIGINT", () => {
    console.log("\n");
    log("👋 Arret du bridge");
    clearInterval(interval);
    supabase.removeChannel(channel);
    process.exit(0);
  });
}

main().catch((err) => {
  logErr("fatal", err);
  process.exit(1);
});
