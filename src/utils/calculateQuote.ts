/**
 * Pack Me Lanka — quotation calculation engine.
 *
 * All formulas are documented inline. Keep this file pure (no UI imports).
 * Unit: Sri Lankan Rupees (LKR)
 */

import type { QuoteInput, QuoteResult, PricingConfig } from '../lib/pricingTypes'

export function calculateQuote(input: QuoteInput, pricing: PricingConfig): QuoteResult | null {
  const { length, width, quantity } = input
  const { materials, boards, addons, surcharges } = pricing

  // Guard — invalid inputs
  if (!length || length <= 0 || !width || width <= 0 || !quantity || quantity <= 0) return null

  // ── Total sheet area ──────────────────────────────────────────────────────
  const sqIn      = length * width    // in² per unit
  const totalArea = sqIn * quantity

  // ── Material cost ─────────────────────────────────────────────────────────
  // 'none' = Board Only mode — no material cost
  const materialRate = input.material !== 'none' ? materials[input.material] : 0
  const materialCost = totalArea * materialRate

  // ── Board cost ────────────────────────────────────────────────────────────
  const boardCost = input.board !== 'none' ? totalArea * boards[input.board] : 0

  // ── Printing cost ─────────────────────────────────────────────────────────
  const printingCost = input.printing
    ? input.colourCount * addons.printingPerColour * quantity
    : 0

  // ── Varnish cost ──────────────────────────────────────────────────────────
  const varnishCost = input.varnish ? addons.varnishPerUnit * quantity : 0

  // ── Die cutting cost ──────────────────────────────────────────────────────
  const dieCuttingCost = input.dieCutting ? addons.dieCutterPerPunch * quantity : 0

  // ── E-Flute lamination cost ───────────────────────────────────────────────
  // Compulsory when printing is on; also selectable independently
  const eFluteLaminateCost = input.eFluteLamination
    ? totalArea * addons.eFluteLaminatePerSqIn
    : 0

  // ── Side pasting cost ─────────────────────────────────────────────────────
  const pastingCost = input.pasting ? addons.pastingPerUnit * quantity : 0

  // ── Packing & delivery cost (always included) ─────────────────────────────
  const packingDeliveryCost = addons.packingDeliveryPerUnit * quantity

  // ── Subtotal (core costs) ─────────────────────────────────────────────────
  const subtotal =
    materialCost +
    boardCost +
    printingCost +
    varnishCost +
    dieCuttingCost +
    eFluteLaminateCost +
    pastingCost +
    packingDeliveryCost

  // ── 2-Ply surcharge ───────────────────────────────────────────────────────
  // Applies ONLY when material is 2-ply AND the customer ordered nothing else
  // (no board, no add-ons, no external costs).
  const isTwoPlyMaterial = input.material === '2ply_brown' || input.material === '2ply_white'
  const hasExtras =
    input.board !== 'none'        ||
    input.printing                ||
    input.varnish                 ||
    input.dieCutting              ||
    input.eFluteLamination        ||
    input.pasting                 ||
    input.laminateType !== 'none' ||
    input.foilingPerUnit > 0
  const isTwoPly = isTwoPlyMaterial && !hasExtras
  const twoPlyPercentage = surcharges.twoPlyPercentage
  const twoPlySurcharge  = isTwoPly ? subtotal * (twoPlyPercentage / 100) : 0

  // ── External laminate cost ────────────────────────────────────────────────
  // Added on top of subtotal + surcharge; not subject to 2-ply surcharge.
  const laminateRates: Record<string, number> = {
    hot:  addons.hotLaminatePerSqIn,
    cold: addons.coldLaminatePerSqIn,
    uv:   addons.uvLaminatePerSqIn,
  }
  const externalLaminateCost = input.laminateType !== 'none'
    ? totalArea * (laminateRates[input.laminateType] ?? 0)
    : 0

  // ── Foiling cost ──────────────────────────────────────────────────────────
  // Manual lump-sum entry — passed through directly.
  const foilingCost = input.foilingPerUnit > 0 ? input.foilingPerUnit * quantity : 0

  // ── Base total (before price adjustments) ────────────────────────────────
  const baseTotal = subtotal + twoPlySurcharge + externalLaminateCost + foilingCost

  // ── Price adjustments (% first, then flat Rs, then round) ────────────────
  const adjPct = input.adjustmentPct ?? 0
  const adjRs  = input.adjustmentRs  ?? 0
  const roundTo = input.roundTo      ?? 0

  const afterPct           = adjPct !== 0 ? baseTotal * (1 + adjPct / 100) : baseTotal
  const adjustmentPctAmount = afterPct - baseTotal
  const afterRs            = afterPct + adjRs
  const adjustmentRsAmount  = adjRs

  // Round to nearest N (0 = disabled)
  const total = roundTo > 0 ? Math.round(afterRs / roundTo) * roundTo : afterRs

  // ── Per-unit price ────────────────────────────────────────────────────────
  const perUnitPrice = total / quantity

  return {
    totalArea,
    materialCost,
    boardCost,
    printingCost,
    varnishCost,
    dieCuttingCost,
    eFluteLaminateCost,
    pastingCost,
    packingDeliveryCost,
    subtotal,
    twoPlySurcharge,
    twoPlyPercentage,
    externalLaminateCost,
    foilingCost,
    baseTotal,
    adjustmentPctAmount,
    adjustmentRsAmount,
    total,
    perUnitPrice,
    isTwoPly,
  }
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function fmtRs(n: number): string {
  if (n == null || isNaN(n)) return 'Rs. —'
  return `Rs. ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtNum(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

// ─── Auto quotation number ────────────────────────────────────────────────────

export function generateQuotationNumber(): string {
  const now  = new Date()
  const yy   = String(now.getFullYear()).slice(-2)
  const mmm  = now.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const xxxx = String(Math.floor(Math.random() * 9000) + 1000)
  return `${yy}${mmm}${xxxx}`
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function futureIso(days = 30): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
