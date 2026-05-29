/**
 * Pack Me Lanka — PDF quotation generator.
 * Uses jsPDF + jspdf-autotable.  Pure utility — no React imports.
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { CustomerDetails, QuoteInput, QuoteResult, PricingConfig } from '../lib/pricingTypes'
import { MATERIAL_LABELS, BOARD_LABELS } from '../lib/pricingTypes'
import { fmtRs } from './calculateQuote'

// ─── Colour palette ───────────────────────────────────────────────────────────
const RED    = [185, 28, 28] as [number, number, number]
const DARK   = [17, 24, 39]  as [number, number, number]
const GREY   = [107, 114, 128] as [number, number, number]
const LGREY  = [243, 244, 246] as [number, number, number]
const WHITE  = [255, 255, 255] as [number, number, number]

// ─── Page constants (mm) ──────────────────────────────────────────────────────
const PW  = 210   // A4 width
const PH  = 297   // A4 height
const ML  = 15    // left margin
const MR  = 15    // right margin
const CW  = PW - ML - MR   // content width = 180mm

// ─── Logo loader (canvas round-trip for jsPDF) ───────────────────────────────

async function loadLogoBase64(url: string): Promise<string | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(null); return }
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', 0.92))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setFont(doc: jsPDF, size: number, style: 'normal' | 'bold' = 'normal', color = DARK) {
  doc.setFontSize(size)
  doc.setFont('helvetica', style)
  doc.setTextColor(...color)
}

function displayDate(iso: string): string {
  if (!iso) return 'N/A'
  const [y, m, d] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d} ${months[Number(m) - 1]} ${y}`
}

function ifSet(val: string, prefix = ''): string {
  return val && val !== 'N/A' ? prefix + val : ''
}

// ─── Main export function ─────────────────────────────────────────────────────

export async function generateQuotationPdf(
  customer: CustomerDetails,
  input: QuoteInput,
  result: QuoteResult,
  pricing: PricingConfig,
): Promise<void> {

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const co = pricing.company

  // Load logo from public folder — always /logo.webp
  const logoB64 = await loadLogoBase64('/logo.webp')

  // ── HEADER ──────────────────────────────────────────────────────────────────
  let y = 15

  // Logo (left side)
  if (logoB64) {
    const logoW = 48
    const logoH = 18
    doc.addImage(logoB64, 'JPEG', ML, y, logoW, logoH)
  }

  // Company block (right-aligned)
  const rx = PW - MR
  setFont(doc, 11, 'bold')
  doc.setTextColor(...RED)
  doc.text(co.legalName, rx, y + 4, { align: 'right' })

  setFont(doc, 8, 'normal', GREY)
  let cy = y + 10
  if (co.address !== 'N/A') {
    doc.text(co.address, rx, cy, { align: 'right' })
    cy += 4.5
  }
  const contactLine = [
    ifSet(co.phone, 'T: '), ifSet(co.email), ifSet(co.website)
  ].filter(Boolean).join('  |  ')
  if (contactLine) {
    doc.text(contactLine, rx, cy, { align: 'right' })
    cy += 4.5
  }
  const regLine = [
    ifSet(co.brNumber, 'BR: '), ifSet(co.vatNumber, 'VAT: ')
  ].filter(Boolean).join('   ')
  if (regLine) {
    doc.text(regLine, rx, cy, { align: 'right' })
    cy += 4.5
  }

  y = Math.max(y + 22, cy + 2)

  // ── RED DIVIDER ──────────────────────────────────────────────────────────────
  doc.setDrawColor(...RED)
  doc.setLineWidth(0.8)
  doc.line(ML, y, PW - MR, y)
  y += 2

  // ── TITLE ────────────────────────────────────────────────────────────────────
  setFont(doc, 20, 'bold')
  doc.setTextColor(...RED)
  doc.text('QUOTATION', PW / 2, y + 9, { align: 'center' })
  y += 16

  // ── META BOX: Quotation details + Customer details ───────────────────────────
  const boxW = (CW - 8) / 2
  const boxX2 = ML + boxW + 8

  // Left box: quotation details
  doc.setFillColor(...LGREY)
  doc.roundedRect(ML, y, boxW, 34, 2, 2, 'F')

  setFont(doc, 7, 'bold', GREY)
  doc.text('QUOTATION DETAILS', ML + 4, y + 6)

  setFont(doc, 8, 'bold', DARK)
  doc.text('Ref:', ML + 4, y + 13)
  setFont(doc, 8, 'normal', DARK)
  doc.text(customer.quotationNumber || 'N/A', ML + 18, y + 13)

  setFont(doc, 8, 'bold', DARK)
  doc.text('Date:', ML + 4, y + 19)
  setFont(doc, 8, 'normal', DARK)
  doc.text(displayDate(customer.quotationDate), ML + 18, y + 19)

  setFont(doc, 8, 'bold', DARK)
  doc.text('Valid until:', ML + 4, y + 25)
  setFont(doc, 8, 'normal', DARK)
  doc.text(displayDate(customer.validUntil) || 'N/A', ML + 26, y + 25)

  // Right box: customer details
  doc.setFillColor(...LGREY)
  doc.roundedRect(boxX2, y, boxW, 34, 2, 2, 'F')

  setFont(doc, 7, 'bold', GREY)
  doc.text('BILL TO', boxX2 + 4, y + 6)

  setFont(doc, 8, 'bold', DARK)
  doc.text(customer.customerName || 'N/A', boxX2 + 4, y + 13)
  setFont(doc, 8, 'normal', GREY)
  if (customer.customerCompany && customer.customerCompany !== '') {
    doc.text(customer.customerCompany, boxX2 + 4, y + 19)
  }
  const custContact = [customer.customerPhone, customer.customerAddress]
    .filter(v => v && v.trim()).join('  |  ')
  if (custContact) doc.text(custContact, boxX2 + 4, y + 25, { maxWidth: boxW - 8 })

  y += 38

  // ── PRODUCT / JOB DETAILS ────────────────────────────────────────────────────
  setFont(doc, 8.5, 'bold', DARK)
  doc.setFillColor(...RED)
  doc.rect(ML, y, CW, 7, 'F')
  doc.setTextColor(...WHITE)
  doc.text('PRODUCT & JOB DETAILS', ML + 4, y + 4.8)
  y += 10

  const jobRows: [string, string][] = [
    ['Product / Job', customer.quotationTitle || 'N/A'],
    ['Square inches per unit', `${fmtNum(input.squareInchesPerUnit)} in²`],
    ['Quantity', `${result.totalArea > 0 ? fmtNum(input.quantity) : '—'} units`],
    ['Total area', `${fmtNum(result.totalArea)} in²`],
    ['Material', MATERIAL_LABELS[input.material]],
    ['Board', BOARD_LABELS[input.board]],
    ['Printing', input.printing ? `Yes — ${input.colourCount} colour${input.colourCount > 1 ? 's' : ''}${input.colourCount === 4 ? ' (CMYK)' : ''}` : 'No'],
    ['Varnish', input.varnish ? 'Yes' : 'No'],
    ['Die Cutting', input.dieCutting ? 'Yes' : 'No'],
    ['Lamination', input.lamination ? 'Yes' : 'No'],
    ['P&D + Side Pasting', input.pasting ? 'Yes' : 'No'],
    ['Packing & Delivery', input.packingDelivery ? 'Yes' : 'No'],
  ]

  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: MR },
    tableWidth: CW,
    body: jobRows,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1.8 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60, textColor: DARK },
      1: { cellWidth: 120, textColor: DARK },
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
  })

  y = (doc as any).lastAutoTable.finalY + 6

  // ── COST BREAKDOWN TABLE ─────────────────────────────────────────────────────
  const sqIn = input.squareInchesPerUnit
  const qty  = input.quantity
  const qtyStr = fmtNum(qty)
  const sqInStr = fmtNum(sqIn)

  // Build rows
  type Row = [string, string, string]
  const rows: Row[] = []

  const mr = pricing.materials[input.material]
  rows.push([
    `Material — ${MATERIAL_LABELS[input.material]}`,
    `${sqInStr} in² × ${qtyStr} × Rs. ${mr}/in²`,
    fmtRs(result.materialCost),
  ])

  if (result.boardCost > 0) {
    const br = pricing.boards[input.board as '250gsm' | '300gsm']
    rows.push([
      `Board — ${BOARD_LABELS[input.board]}`,
      `${sqInStr} in² × ${qtyStr} × Rs. ${br}/in²`,
      fmtRs(result.boardCost),
    ])
  }

  if (result.printingCost > 0) {
    const pr = pricing.addons.printingPerColour
    rows.push([
      `Printing — ${input.colourCount} colour${input.colourCount > 1 ? 's' : ''}${input.colourCount === 4 ? ' (CMYK)' : ''}`,
      `${input.colourCount} × Rs. ${pr}/colour × ${qtyStr} units`,
      fmtRs(result.printingCost),
    ])
  }

  if (result.varnishCost > 0) {
    rows.push([
      'Varnish',
      `Rs. ${pricing.addons.varnishPerUnit}/unit × ${qtyStr}`,
      fmtRs(result.varnishCost),
    ])
  }

  if (result.dieCuttingCost > 0) {
    rows.push([
      'Die Cutting',
      `Rs. ${pricing.addons.dieCutterPerPunch}/punch × ${qtyStr}`,
      fmtRs(result.dieCuttingCost),
    ])
  }

  if (result.laminateCost > 0) {
    const lr = pricing.addons.laminatePerSqIn
    rows.push([
      'Lamination',
      `${sqInStr} in² × ${qtyStr} × Rs. ${lr}/in²`,
      fmtRs(result.laminateCost),
    ])
  }

  if (result.pastingCost > 0) {
    rows.push([
      'P&D + Side Pasting',
      `Rs. ${pricing.addons.pastingPerUnit}/unit × ${qtyStr}`,
      fmtRs(result.pastingCost),
    ])
  }

  if (result.packingDeliveryCost > 0) {
    rows.push([
      'Packing & Delivery',
      `Rs. ${pricing.addons.packingDeliveryPerUnit}/unit × ${qtyStr}`,
      fmtRs(result.packingDeliveryCost),
    ])
  }

  // Section header
  doc.setFillColor(...RED)
  doc.rect(ML, y, CW, 7, 'F')
  doc.setTextColor(...WHITE)
  setFont(doc, 8.5, 'bold')
  doc.text('COST BREAKDOWN', ML + 4, y + 4.8)
  y += 10

  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: MR },
    tableWidth: CW,
    head: [['Description', 'Basis', 'Amount (LKR)']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: DARK, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: DARK },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 70 },
      2: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    foot: buildFootRows(result),
    footStyles: { fillColor: WHITE, textColor: DARK, fontSize: 8 },
    didParseCell: (data) => {
      if (data.section === 'foot') {
        const rawRow = data.row.raw as unknown as (string | number)[]
        const label = String(rawRow?.[0] ?? '')
        if (label.startsWith('TOTAL')) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fontSize = 10
          data.cell.styles.fillColor = LGREY
          data.cell.styles.textColor = RED
        } else if (label.startsWith('Subtotal') || label.startsWith('Per Unit')) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = LGREY
        }
      }
    },
  })

  y = (doc as any).lastAutoTable.finalY + 8

  // ── NOTES SECTION ────────────────────────────────────────────────────────────
  const notesToShow = [
    customer.notes ? { heading: 'Special Instructions', body: customer.notes } : null,
    co.paymentTerms ? { heading: 'Payment Terms', body: co.paymentTerms } : null,
    co.footerNote   ? { heading: 'Note', body: co.footerNote } : null,
    co.bankDetails && co.bankDetails !== 'N/A'
      ? { heading: 'Bank Details', body: co.bankDetails }
      : null,
  ].filter(Boolean) as { heading: string; body: string }[]

  if (notesToShow.length > 0) {
    // Check if we need a new page
    if (y > PH - 60) {
      doc.addPage()
      y = 15
    }

    doc.setFillColor(...RED)
    doc.rect(ML, y, CW, 7, 'F')
    doc.setTextColor(...WHITE)
    setFont(doc, 8.5, 'bold')
    doc.text('NOTES & TERMS', ML + 4, y + 4.8)
    y += 10

    for (const note of notesToShow) {
      if (y > PH - 30) { doc.addPage(); y = 15 }
      setFont(doc, 8, 'bold', DARK)
      doc.text(note.heading + ':', ML, y)
      y += 5
      setFont(doc, 8, 'normal', GREY)
      const lines = doc.splitTextToSize(note.body, CW) as string[]
      doc.text(lines, ML, y)
      y += lines.length * 4.5 + 4
    }
  }

  // ── FOOTER ON EVERY PAGE ──────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    const fy = PH - 12
    doc.setDrawColor(...LGREY)
    doc.setLineWidth(0.3)
    doc.line(ML, fy - 4, PW - MR, fy - 4)
    setFont(doc, 7, 'normal', GREY)
    doc.text(
      `${co.legalName}   |   This is a system-generated quotation.`,
      PW / 2, fy, { align: 'center' }
    )
    doc.text(`Page ${i} of ${totalPages}`, PW - MR, fy, { align: 'right' })
  }

  // ── SAVE ──────────────────────────────────────────────────────────────────────
  const qNum = customer.quotationNumber || new Date().toISOString().slice(0, 10)
  doc.save(`PML-Quotation-${qNum}.pdf`)
}

// ─── Footer rows for the cost table ──────────────────────────────────────────

function buildFootRows(r: QuoteResult): [string, string, string][] {
  const rows: [string, string, string][] = [
    ['Subtotal', '', fmtRs(r.subtotal)],
  ]
  if (r.isTwoPly) {
    rows.push([
      `2 Ply Surcharge / Margin (${r.twoPlyPercentage}%)`,
      `${r.twoPlyPercentage}% of subtotal`,
      fmtRs(r.twoPlySurcharge),
    ])
  }
  rows.push(
    ['TOTAL', '', fmtRs(r.total)],
    ['Per Unit Price', `${fmtRs(r.total)} ÷ ${fmtNum(r.total / r.perUnitPrice)} units`, fmtRs(r.perUnitPrice)],
  )
  return rows
}

function fmtNum(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}
