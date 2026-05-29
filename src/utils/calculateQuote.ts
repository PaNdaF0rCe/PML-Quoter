/**
 * Pack Me Lanka — quotation calculation engine.
 *
 * All formulas are documented inline. Keep this file pure (no UI imports).
 * Unit: Sri Lankan Rupees (LKR)
 */

import type { QuoteInput, QuoteResult, PricingConfig } from '../lib/pricingTypes'

export function calculateQuote(input: QuoteInput, pricing: PricingConfig): QuoteResult | null {
  const { squareInchesPerUnit: sqIn, quantity } = input
  const { materials, boards, addons, surcharges } = pricing

  // Guard — invalid inputs
  if (!sqIn || sqIn <= 0 || !quantity || quantity <= 0) return null

  // ── Total sheet area ──────────────────────────────────────────────────────
  const totalArea = sqIn * quantity

  // ── Material cost ─────────────────────────────────────────────────────────
  // materialCost = sqIn × qty × rate/in²
  const materialRate = materials[input.material]
  const materialCost = totalArea * materialRate

  // ── Board cost ────────────────────────────────────────────────────────────
  // boardCost = sqIn × qty × rate/in²   (0 if board is 'none')
  const boardCost =
    input.board !== 'none' ? totalArea * boards[input.board] : 0

  // ── Printing cost ─────────────────────────────────────────────────────────
  // printingCost = colourCount × printingPerColour × qty
  // CMYK = 4 colours
  const printingCost = input.printing
    ? input.colourCount * addons.printingPerColour * quantity
    : 0

  // ── Varnish cost ──────────────────────────────────────────────────────────
  // varnishCost = varnishPerUnit × qty
  const varnishCost = input.varnish ? addons.varnishPerUnit * quantity : 0

  // ── Die cutting cost ──────────────────────────────────────────────────────
  // dieCuttingCost = dieCutterPerPunch × qty
  const dieCuttingCost = input.dieCutting
    ? addons.dieCutterPerPunch * quantity
    : 0

  // ── Lamination cost ───────────────────────────────────────────────────────
  // laminateCost = sqIn × qty × laminatePerSqIn
  const laminateCost = input.lamination
    ? totalArea * addons.laminatePerSqIn
    : 0

  // ── P&D + side pasting cost ───────────────────────────────────────────────
  // pastingCost = pastingPerUnit × qty
  const pastingCost = input.pasting ? addons.pastingPerUnit * quantity : 0

  // ── Packing & delivery cost ───────────────────────────────────────────────
  // packingDeliveryCost = packingDeliveryPerUnit × qty
  const packingDeliveryCost = input.packingDelivery
    ? addons.packingDeliveryPerUnit * quantity
    : 0

  // ── Subtotal ──────────────────────────────────────────────────────────────
  const subtotal =
    materialCost +
    boardCost +
    printingCost +
    varnishCost +
    dieCuttingCost +
    laminateCost +
    pastingCost +
    packingDeliveryCost

  // ── 2 Ply surcharge / margin ──────────────────────────────────────────────
  // Surcharge applies ONLY when:
  //   • material is 2-ply, AND
  //   • the customer has ordered nothing else (no board, no add-ons)
  // If any board or add-on is selected alongside 2-ply, no surcharge.
  const isTwoPlyMaterial = input.material === '2ply_brown' || input.material === '2ply_white'
  const hasExtras =
    input.board !== 'none' ||
    input.printing ||
    input.varnish ||
    input.dieCutting ||
    input.lamination ||
    input.pasting ||
    input.packingDelivery
  const isTwoPly = isTwoPlyMaterial && !hasExtras   // true = surcharge is applied
  const twoPlyPercentage = surcharges.twoPlyPercentage
  const twoPlySurcharge = isTwoPly ? subtotal * (twoPlyPercentage / 100) : 0

  // ── Total ─────────────────────────────────────────────────────────────────
  const total = subtotal + twoPlySurcharge

  // ── Per-unit price ────────────────────────────────────────────────────────
  const perUnitPrice = total / quantity

  return {
    totalArea,
    materialCost,
    boardCost,
    printingCost,
    varnishCost,
    dieCuttingCost,
    laminateCost,
    pastingCost,
    packingDeliveryCost,
    subtotal,
    twoPlySurcharge,
    twoPlyPercentage,
    total,
    perUnitPrice,
    isTwoPly,
  }
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function fmtRs(n: number): string {
  return `Rs. ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtNum(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

// ─── Auto quotation number ────────────────────────────────────────────────────

export function generateQuotationNumber(): string {
  const now = new Date()
  const yy  = String(now.getFullYear()).slice(-2)
  const mmm = now.toLocaleString('en-US', { month: 'short' }).toUpperCase()
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
