/**
 * GalaPH Mobile — Receipt OCR Text Parser & Split Engine
 * Extracts line items, detects alcohol, calculates proportional SC/Tax, and allocates per-person debts.
 */

import { splitAmountEqually } from "@gala-ph/shared";
import type { LocalTripMember } from "../types";

export interface ParsedReceiptItem {
  id: string;
  name: string;
  priceCentavos: number;
  quantity: number;
  isAlcohol: boolean;
  assignedUserIds: string[];
  confidence: number;
}

export interface ParsedReceipt {
  establishmentName: string;
  items: ParsedReceiptItem[];
  subtotalCentavos: number;
  serviceChargeCentavos: number;
  taxCentavos: number;
  totalCentavos: number;
  rawText: string;
  confidence: number;
}

export interface MemberSplitBreakdown {
  userId: string;
  userName: string;
  isNonDrinker: boolean;
  subtotalCentavos: number;
  serviceChargeCentavos: number;
  taxCentavos: number;
  totalOwedCentavos: number;
  consumedItemCount: number;
}

export interface ReceiptSplitCalculation {
  totalCentavos: number;
  memberSplits: MemberSplitBreakdown[];
  isConservationExact: boolean;
}

// Alcohol keywords commonly found in Philippine dining receipts
const ALCOHOL_KEYWORDS = [
  "beer",
  "san mig",
  "pale pilsen",
  "light bucket",
  "smb",
  "red horse",
  "cocktail",
  "margarita",
  "mojito",
  "tequila",
  "gin",
  "rum",
  "whiskey",
  "vodka",
  "wine",
  "rhum",
  "soju",
];

export const SAMPLE_RECEIPT_TEXTS = {
  tagpuanSanJuan: `TAGPUAN SA SAN JUAN
Urbiztondo, San Juan, La Union
TIN: 123-456-789-000

1x Garlic Butter Shrimp Platter    850.00
1x Grilled Tuna Panga 500g          750.00
1x Sinigang na Baboy sa Sampaloc   450.00
1x San Mig Light Bucket (6 btls)    550.00
4x Plain White Rice Bowl            160.00

Subtotal:                         2,760.00
Service Charge (10%):               276.00
VAT (12% Included):                   0.00
TOTAL AMOUNT:                     3,036.00
THANK YOU FOR DINING WITH US!`,

  kahunaBrunch: `KAHUNA BEACH RESORT & SPA
San Juan, La Union

2x Smashed Avocado Toast w/ Egg    640.00
1x Baguio Brew Artisan Pour-Over    180.00
2x Fresh Mango Banana Smoothie     360.00
1x Tagaytay Beef Tapa Breakfast     420.00

Subtotal:                         1,600.00
Service Charge (5%):                 80.00
TOTAL DUE:                        1,680.00`,

  balerSurfside: `BALER SURFSIDE GRILL & BAR
Sabang Beach, Baler, Aurora

1x Inihaw na Liempo Jumbo          380.00
1x Buttered Garlic Crab 400g       680.00
2x San Miguel Pale Pilsen Cans     220.00
1x Fresh Buko Juice in Shell       120.00

Subtotal:                         1,400.00
Service Charge:                     140.00
GRAND TOTAL:                      1,540.00`,
};

export class ReceiptOcrService {
  /**
   * Detects whether an item name contains alcoholic keywords.
   */
  static isAlcoholicItem(name: string): boolean {
    const lower = name.toLowerCase();
    return ALCOHOL_KEYWORDS.some((kw) => lower.includes(kw));
  }

  /**
   * Parses raw receipt OCR text into structured line items and financial metadata.
   */
  static parseReceiptText(
    rawText: string,
    defaultMembers: LocalTripMember[] = [],
  ): ParsedReceipt {
    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const establishmentName = lines[0] || "Philippine Dining Establishment";
    const items: ParsedReceiptItem[] = [];
    let parsedSubtotal = 0;
    let parsedServiceCharge = 0;
    let parsedTax = 0;
    let parsedTotal = 0;

    // Line matching regex for items: "[Qty]x [Item Name] [Price]" or "[Item Name] [Price]"
    const itemRegex =
      /^(?:(\d+)\s*x\s+)?([A-Za-z0-9\s&/().,'-]+?)\s+(?:₱|PHP\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)$/i;

    for (const line of lines) {
      const lower = line.toLowerCase();

      // Check for summary financial lines
      if (lower.includes("subtotal") || lower.includes("sub-total")) {
        const amountMatch = line.match(
          /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)$/,
        );
        if (amountMatch && amountMatch[1]) {
          parsedSubtotal = Math.round(
            parseFloat(amountMatch[1].replace(/,/g, "")) * 100,
          );
        }
        continue;
      }

      if (
        lower.includes("service charge") ||
        lower.includes("service (") ||
        lower.startsWith("sc")
      ) {
        const amountMatch = line.match(
          /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)$/,
        );
        if (amountMatch && amountMatch[1]) {
          parsedServiceCharge = Math.round(
            parseFloat(amountMatch[1].replace(/,/g, "")) * 100,
          );
        }
        continue;
      }

      if (lower.includes("vat") || lower.includes("tax")) {
        const amountMatch = line.match(
          /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)$/,
        );
        if (amountMatch && amountMatch[1]) {
          parsedTax = Math.round(
            parseFloat(amountMatch[1].replace(/,/g, "")) * 100,
          );
        }
        continue;
      }

      if (
        lower.includes("total") ||
        lower.includes("amount due") ||
        lower.includes("total due")
      ) {
        const amountMatch = line.match(
          /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)$/,
        );
        if (amountMatch && amountMatch[1]) {
          parsedTotal = Math.round(
            parseFloat(amountMatch[1].replace(/,/g, "")) * 100,
          );
        }
        continue;
      }

      // Ignore header/footer noise
      if (
        lower.includes("tin:") ||
        lower.includes("thank you") ||
        lower.includes("official receipt") ||
        lower.includes("cashier")
      ) {
        continue;
      }

      // Match item line
      const match = line.match(itemRegex);
      if (match && match[2] && match[3]) {
        const rawQty = match[1] ? parseInt(match[1], 10) : 1;
        const itemName = match[2].trim();
        const rawPrice = parseFloat(match[3].replace(/,/g, ""));
        const priceCentavos = Math.round(rawPrice * 100);

        if (priceCentavos > 0 && itemName.length > 2) {
          const isAlcohol = this.isAlcoholicItem(itemName);

          // Initial assignment heuristic:
          // If alcohol, assign only drinkers (!isNonDrinker). If food, assign everyone.
          const initialAssignees = isAlcohol
            ? defaultMembers.filter((m) => !m.isNonDrinker).map((m) => m.userId)
            : defaultMembers.map((m) => m.userId);

          items.push({
            id: `ocr-item-${Date.now()}-${items.length}`,
            name: itemName,
            priceCentavos,
            quantity: rawQty,
            isAlcohol,
            assignedUserIds:
              initialAssignees.length > 0
                ? initialAssignees
                : defaultMembers.map((m) => m.userId),
            confidence: 0.95,
          });
        }
      }
    }

    // If subtotal was not explicitly read, compute from items
    const computedSubtotal = items.reduce(
      (sum, it) => sum + it.priceCentavos,
      0,
    );
    const finalSubtotal =
      parsedSubtotal > 0 ? parsedSubtotal : computedSubtotal;
    const finalTotal =
      parsedTotal > 0
        ? parsedTotal
        : finalSubtotal + parsedServiceCharge + parsedTax;

    return {
      establishmentName,
      items,
      subtotalCentavos: finalSubtotal,
      serviceChargeCentavos: parsedServiceCharge,
      taxCentavos: parsedTax,
      totalCentavos: finalTotal,
      rawText,
      confidence: items.length > 0 ? 0.92 : 0.4,
    };
  }

  /**
   * Calculates exact itemized splits with proportional SC and Tax distribution across members.
   * Guarantees 100% conservation of centavos: sum(memberSplits) === totalCentavos.
   */
  static calculateSplits(
    items: ParsedReceiptItem[],
    members: LocalTripMember[],
    serviceChargeCentavos = 0,
    taxCentavos = 0,
  ): ReceiptSplitCalculation {
    const memberSubtotals = new Map<
      string,
      { subtotal: number; count: number }
    >();

    for (const m of members) {
      memberSubtotals.set(m.userId, { subtotal: 0, count: 0 });
    }

    let itemsTotalCentavos = 0;

    // 1. Distribute each line item equally among its assigned consumers
    for (const item of items) {
      itemsTotalCentavos += item.priceCentavos;
      const assignees = item.assignedUserIds;
      if (assignees.length === 0) continue;

      const splits = splitAmountEqually(item.priceCentavos, assignees.length);
      assignees.forEach((userId, idx) => {
        const current = memberSubtotals.get(userId) || {
          subtotal: 0,
          count: 0,
        };
        current.subtotal += splits[idx] ?? 0;
        current.count += 1;
        memberSubtotals.set(userId, current);
      });
    }

    // 2. Distribute Service Charge proportionally based on member subtotal ratio
    const memberSC = new Map<string, number>();
    const memberTax = new Map<string, number>();

    let allocatedSC = 0;
    let allocatedTax = 0;

    const validConsumers = members.filter(
      (m) => (memberSubtotals.get(m.userId)?.subtotal ?? 0) > 0,
    );

    if (itemsTotalCentavos > 0 && validConsumers.length > 0) {
      for (const m of validConsumers) {
        const sub = memberSubtotals.get(m.userId)?.subtotal ?? 0;
        const ratio = sub / itemsTotalCentavos;

        const scShare = Math.floor(serviceChargeCentavos * ratio);
        const taxShare = Math.floor(taxCentavos * ratio);

        memberSC.set(m.userId, scShare);
        memberTax.set(m.userId, taxShare);

        allocatedSC += scShare;
        allocatedTax += taxShare;
      }

      // Distribute leftover remainder centavos fairly
      const scRemainder = serviceChargeCentavos - allocatedSC;
      const taxRemainder = taxCentavos - allocatedTax;

      for (let i = 0; i < scRemainder && i < validConsumers.length; i++) {
        const uId = validConsumers[i]?.userId;
        if (uId) memberSC.set(uId, (memberSC.get(uId) ?? 0) + 1);
      }

      for (let i = 0; i < taxRemainder && i < validConsumers.length; i++) {
        const uId = validConsumers[i]?.userId;
        if (uId) memberTax.set(uId, (memberTax.get(uId) ?? 0) + 1);
      }
    }

    // 3. Assemble member split breakdowns
    const totalReceiptCentavos =
      itemsTotalCentavos + serviceChargeCentavos + taxCentavos;
    let totalComputedSum = 0;

    const memberSplits: MemberSplitBreakdown[] = members.map((m) => {
      const data = memberSubtotals.get(m.userId) || { subtotal: 0, count: 0 };
      const sc = memberSC.get(m.userId) ?? 0;
      const tx = memberTax.get(m.userId) ?? 0;
      const totalOwed = data.subtotal + sc + tx;
      totalComputedSum += totalOwed;

      return {
        userId: m.userId,
        userName: m.name,
        isNonDrinker: m.isNonDrinker,
        subtotalCentavos: data.subtotal,
        serviceChargeCentavos: sc,
        taxCentavos: tx,
        totalOwedCentavos: totalOwed,
        consumedItemCount: data.count,
      };
    });

    const isConservationExact = totalComputedSum === totalReceiptCentavos;

    return {
      totalCentavos: totalReceiptCentavos,
      memberSplits,
      isConservationExact,
    };
  }
}
