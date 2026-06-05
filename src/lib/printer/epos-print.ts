/**
 * Génération XML ePOS-Print pour Epson Server Direct Print.
 *
 * L'imprimante Epson TM-m30III (et compatibles) accepte un format XML
 * spécifique qui décrit le ticket. C'est plus haut-niveau que les bytes
 * ESC/POS bruts : on écrit du "markup" et l'imprimante gère le rendu.
 *
 * Doc Epson :
 *   https://www.epson-biz.com/modules/pos/index.php?page=single_doc&cid=4571
 *
 * Format de base :
 *   <epos-print>
 *     <text align="center"/>      <!-- alignement -->
 *     <text width="2" height="2"/> <!-- taille X×Y -->
 *     <text>SOUTH STREET FOOD\n</text>
 *     ...
 *     <feed/>                      <!-- saut de ligne -->
 *     <cut/>                       <!-- coupe le papier -->
 *   </epos-print>
 */

import type { OrderWithItems } from "@/types/order";

const RESTAURANT = {
  name: "SOUTH STREET FOOD",
  address: "32 Chemin de Loustaunaou",
  city: "64100 Bayonne",
  phone: "07 69 79 91 89",
};

function escapeXml(s: string | null | undefined): string {
  if (s == null) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fmtPrice(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")}EUR`;
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function typeLabel(type: string): string {
  if (type === "delivery") return "LIVRAISON";
  if (type === "dine_in") return "SUR PLACE";
  return "A EMPORTER";
}

/**
 * Padding pour formatter une ligne "label .... amount" en largeur fixe.
 * Le ticket 80mm fait environ 32-42 chars selon la font (12pt = 42).
 */
function lineLR(left: string, right: string, width = 32): string {
  const total = width;
  const space = Math.max(1, total - left.length - right.length);
  return left + " ".repeat(space) + right;
}

/**
 * Genere le XML ePOS-Print complet pour une commande.
 * Note : on n'enveloppe pas en SOAP — Epson Server Direct Print
 * moderne accepte le XML direct quand le content-type est bon.
 */
export function buildEposPrintXml(order: OrderWithItems): string {
  const lines: string[] = [];

  // ─── Header restaurant ───
  lines.push('<text align="center"/>');
  lines.push('<text width="2" height="2"/>');
  lines.push(`<text>${RESTAURANT.name}\n</text>`);
  lines.push('<text width="1" height="1"/>');
  lines.push(`<text>${escapeXml(RESTAURANT.address)}\n</text>`);
  lines.push(`<text>${escapeXml(RESTAURANT.city)}\n</text>`);
  lines.push(`<text>${escapeXml(RESTAURANT.phone)}\n</text>`);
  lines.push("<feed/>");

  // ─── Numéro commande GRAND ───
  lines.push('<text width="2" height="2"/>');
  lines.push(
    `<text>#${String(order.order_number).padStart(4, "0")}\n</text>`,
  );
  lines.push('<text width="1" height="1"/>');
  lines.push(`<text>${fmtDateTime(order.created_at)}\n</text>`);
  lines.push("<feed/>");

  // ─── Type ───
  lines.push('<text width="1" height="2"/>');
  lines.push(`<text>[ ${typeLabel(order.order_type)} ]\n</text>`);
  lines.push('<text width="1" height="1"/>');
  lines.push("<feed/>");

  // ─── Client ───
  lines.push('<text align="left"/>');
  lines.push("<text>CLIENT\n</text>");
  lines.push('<text width="1" height="2"/>');
  lines.push(`<text>${escapeXml(order.customer_name)}\n</text>`);
  lines.push('<text width="1" height="1"/>');
  if (order.customer_phone) {
    lines.push(`<text>${escapeXml(order.customer_phone)}\n</text>`);
  }
  lines.push("<feed/>");

  // ─── Adresse si livraison ───
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deliveryAddr = (order as any).delivery_address;
  if (order.order_type === "delivery" && deliveryAddr) {
    lines.push("<text>LIVRAISON A\n</text>");
    lines.push('<text width="1" height="2"/>');
    lines.push(
      `<text>${escapeXml(deliveryAddr.street ?? "")}\n</text>`,
    );
    lines.push(
      `<text>${escapeXml(deliveryAddr.postal_code ?? "")} ${escapeXml(deliveryAddr.city ?? "")}\n</text>`,
    );
    lines.push('<text width="1" height="1"/>');
    if (deliveryAddr.delivery_instructions) {
      lines.push(
        `<text>${escapeXml(deliveryAddr.delivery_instructions)}\n</text>`,
      );
    }
    lines.push("<feed/>");
  }

  // ─── Separateur ───
  lines.push("<text>--------------------------------\n</text>");

  // ─── Items ───
  for (const item of order.order_items) {
    const qty = item.quantity || 1;
    const itemPriceCents = (item.unit_price + (item.extras_price ?? 0)) * qty;
    // Ligne nom × quantité + prix
    const nameLine = `${qty}x ${item.item_name}`;
    const priceLine = fmtPrice(itemPriceCents);
    lines.push('<text width="1" height="2"/>');
    lines.push(`<text>${escapeXml(lineLR(nameLine, priceLine, 32))}\n</text>`);
    lines.push('<text width="1" height="1"/>');

    if (item.variant_name) {
      lines.push(`<text>  ${escapeXml(item.variant_name)}\n</text>`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extras = (item as any).extras_json as
      | Array<{ name: string; price: number }>
      | null;
    if (extras && extras.length > 0) {
      for (const extra of extras) {
        lines.push(`<text>  + ${escapeXml(extra.name)}\n</text>`);
      }
    }
    if (item.special_instructions) {
      lines.push('<text width="1" height="1"/>');
      lines.push(
        `<text>  ! ${escapeXml(item.special_instructions)}\n</text>`,
      );
    }
  }

  // ─── Notes commande ───
  if (order.notes) {
    lines.push("<text>--------------------------------\n</text>");
    lines.push("<text>NOTE :\n</text>");
    lines.push(`<text>${escapeXml(order.notes)}\n</text>`);
  }

  // ─── Totaux ───
  lines.push("<text>--------------------------------\n</text>");
  lines.push(
    `<text>${escapeXml(lineLR("Sous-total", fmtPrice(order.subtotal), 32))}\n</text>`,
  );
  if (order.delivery_fee && order.delivery_fee > 0) {
    lines.push(
      `<text>${escapeXml(lineLR("Livraison", fmtPrice(order.delivery_fee), 32))}\n</text>`,
    );
  }
  lines.push('<text width="1" height="2"/>');
  lines.push(
    `<text>${escapeXml(lineLR("TOTAL", fmtPrice(order.total), 32))}\n</text>`,
  );
  lines.push('<text width="1" height="1"/>');

  // ─── Footer ───
  lines.push("<feed/>");
  lines.push('<text align="center"/>');
  lines.push("<text>Merci pour votre commande !\n</text>");
  lines.push(`<text>${RESTAURANT.name}\n</text>`);
  lines.push('<text width="1" height="1"/>');
  lines.push(
    `<text>${fmtDateTime(order.created_at)} - #${String(order.order_number).padStart(4, "0")}\n</text>`,
  );

  // ─── Fin ───
  lines.push("<feed unit=\"3\"/>");
  lines.push("<cut/>");

  // ─── Envelope XML ───
  const inner = lines.join("");
  return `<?xml version="1.0" encoding="utf-8"?>
<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
${inner}
</epos-print>`;
}

/**
 * Reponse "no job" — l'imprimante continue de poller.
 * Server Direct Print attend un SOAP envelope avec un body vide quand il
 * n'y a rien a imprimer. L'imprimante voit le body vide, comprend "rien
 * a imprimer", et re-poll a l'intervalle suivant.
 */
export function buildEmptyPollResponse(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
<s:Body></s:Body>
</s:Envelope>`;
}
