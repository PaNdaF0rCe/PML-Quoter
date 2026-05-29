/**
 * Pack Me Lanka — Customer-facing PDF quotation generator.
 *
 * IMPORTANT: This PDF is customer-facing only.
 * It shows job details and the final unit price.
 * It does NOT expose internal cost breakdowns, rates, margins, or formulas.
 *
 * Uses jsPDF + jspdf-autotable. Pure utility — no React imports.
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { CustomerDetails, QuoteInput, QuoteResult, PricingConfig } from '../lib/pricingTypes'
import { MATERIAL_LABELS, BOARD_LABELS, LAMINATE_LABELS } from '../lib/pricingTypes'
import { fmtRs, fmtNum } from './calculateQuote'

// ─── Colour palette ───────────────────────────────────────────────────────────
const RED   = [185, 28, 28]   as [number, number, number]
const DARK  = [17, 24, 39]    as [number, number, number]
const GREY  = [107, 114, 128] as [number, number, number]
const LGREY = [243, 244, 246] as [number, number, number]
const WHITE = [255, 255, 255] as [number, number, number]

// ─── Page constants (mm) ──────────────────────────────────────────────────────
const PW     = 210                // A4 width
const PH     = 297                // A4 height
const ML     = 15                 // left margin
const MR     = 15                 // right margin
const CW     = PW - ML - MR      // usable content width = 180 mm
const FOOTER = 18                 // reserved bottom strip (footer lives here)

// ─── Logo loader ──────────────────────────────────────────────────────────────
async function loadLogoBase64(url: string): Promise<string | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width  = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(null); return }
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', 0.92))
      } catch { resolve(null) }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

// ─── Typography helper ────────────────────────────────────────────────────────
function sf(
  doc: jsPDF,
  size: number,
  style: 'normal' | 'bold' = 'normal',
  color: [number, number, number] = DARK,
) {
  doc.setFontSize(size)
  doc.setFont('helvetica', style)
  doc.setTextColor(...color)
}

// ─── Date formatter ───────────────────────────────────────────────────────────
function displayDate(iso: string): string {
  if (!iso) return 'N/A'
  const [y, m, d] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d} ${months[Number(m) - 1]} ${y}`
}

function ifSet(val: string, prefix = ''): string {
  return val && val.trim() && val !== 'N/A' ? prefix + val : ''
}

// ─── Page-break guard ─────────────────────────────────────────────────────────
// Returns the current y if there is enough room; otherwise adds a new page and
// returns the top-of-content y for that page.
function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PH - FOOTER - 5) {
    doc.addPage()
    return 20
  }
  return y
}

// ─── Section header bar ───────────────────────────────────────────────────────
function sectionHeader(doc: jsPDF, y: number, label: string): number {
  doc.setFillColor(...RED)
  doc.rect(ML, y, CW, 7, 'F')
  sf(doc, 8.5, 'bold', WHITE)
  doc.text(label, ML + 4, y + 4.8)
  return y + 10   // return y after the bar + small gap
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function generateQuotationPdf(
  customer: CustomerDetails,
  input:    QuoteInput,
  result:   QuoteResult,
  pricing:  PricingConfig,
): Promise<void> {

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const co  = pricing.company

  const logoB64 = await loadLogoBase64('/logo.webp')

  // ═══════════════════════════════════════════════════════════════════════════
  // 1.  LETTERHEAD
  // ═══════════════════════════════════════════════════════════════════════════
  let y = 15

  if (logoB64) {
    doc.addImage(logoB64, 'JPEG', ML, y, 48, 18)
  }

  // Company details — right-aligned
  const rx = PW - MR
  sf(doc, 11, 'bold', RED)
  doc.text(co.legalName, rx, y + 4, { align: 'right' })

  sf(doc, 8, 'normal', GREY)
  let cy = y + 10
  if (co.address) {
    doc.text(co.address, rx, cy, { align: 'right' }); cy += 4.5
  }
  const contactLine = [ifSet(co.phone, 'T: '), ifSet(co.email), ifSet(co.website)]
    .filter(Boolean).join('  |  ')
  if (contactLine) { doc.text(contactLine, rx, cy, { align: 'right' }); cy += 4.5 }
  const regLine = [ifSet(co.brNumber, 'BR: '), ifSet(co.vatNumber, 'VAT: ')]
    .filter(Boolean).join('   ')
  if (regLine) { doc.text(regLine, rx, cy, { align: 'right' }); cy += 4.5 }

  y = Math.max(y + 24, cy + 2)

  // ── Red rule + QUOTATION title ────────────────────────────────────────────
  doc.setDrawColor(...RED); doc.setLineWidth(0.8)
  doc.line(ML, y, PW - MR, y); y += 2

  sf(doc, 20, 'bold', RED)
  doc.text('QUOTATION', PW / 2, y + 9, { align: 'center' })
  y += 16

  // ═══════════════════════════════════════════════════════════════════════════
  // 2.  META BOXES  (Quotation Details | Bill To)
  // ═══════════════════════════════════════════════════════════════════════════
  const boxW  = (CW - 8) / 2
  const boxX2 = ML + boxW + 8
  const boxH  = 34

  // — left box: Quotation Details
  doc.setFillColor(...LGREY)
  doc.roundedRect(ML, y, boxW, boxH, 2, 2, 'F')
  sf(doc, 7, 'bold', GREY);   doc.text('QUOTATION DETAILS',       ML + 4, y + 6)
  sf(doc, 8, 'bold', DARK);   doc.text('Ref:',                    ML + 4, y + 13)
  sf(doc, 8, 'normal', DARK); doc.text(customer.quotationNumber || 'N/A', ML + 18, y + 13)
  sf(doc, 8, 'bold', DARK);   doc.text('Date:',                   ML + 4, y + 19)
  sf(doc, 8, 'normal', DARK); doc.text(displayDate(customer.quotationDate), ML + 18, y + 19)
  sf(doc, 8, 'bold', DARK);   doc.text('Valid until:',            ML + 4, y + 25)
  sf(doc, 8, 'normal', DARK); doc.text(displayDate(customer.validUntil) || 'N/A', ML + 26, y + 25)

  // — right box: Bill To
  doc.setFillColor(...LGREY)
  doc.roundedRect(boxX2, y, boxW, boxH, 2, 2, 'F')
  sf(doc, 7, 'bold', GREY); doc.text('BILL TO', boxX2 + 4, y + 6)
  sf(doc, 8, 'bold', DARK); doc.text(customer.customerName || 'N/A', boxX2 + 4, y + 13)
  sf(doc, 8, 'normal', GREY)
  if (customer.customerCompany) doc.text(customer.customerCompany, boxX2 + 4, y + 19)
  const custContact = [customer.customerPhone, customer.customerAddress]
    .filter(v => v?.trim()).join('  |  ')
  if (custContact) doc.text(custContact, boxX2 + 4, y + 25, { maxWidth: boxW - 8 })

  y += boxH + 6

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.  PRODUCT & JOB DETAILS
  // ═══════════════════════════════════════════════════════════════════════════
  y = ensureSpace(doc, y, 40)
  y = sectionHeader(doc, y, 'PRODUCT & JOB DETAILS')

  const materialLabel = input.material === 'none' ? 'Board Only' : MATERIAL_LABELS[input.material]
  const sqIn          = input.length * input.width

  // Build rows — only show what was selected; no prices, no rates
  const jobRows: [string, string][] = [
    ['Product / Job',    customer.quotationTitle || 'N/A'],
    ['Length',           `${fmtNum(input.length)} in`],
    ['Width',            `${fmtNum(input.width)} in`],
    ['Square Inches',    `${fmtNum(sqIn)} in²`],
    ['Quantity',         `${input.quantity.toLocaleString('en-US')} units`],
    ['Material',         materialLabel],
  ]

  if (input.board !== 'none')
    jobRows.push(['Board', BOARD_LABELS[input.board]])

  if (input.printing)
    jobRows.push([
      'Printing',
      input.colourCount === 4
        ? 'CMYK / 4 Colours'
        : `${input.colourCount} Colour${input.colourCount > 1 ? 's' : ''}`,
    ])

  if (input.varnish)         jobRows.push(['Varnish',           'Yes'])
  if (input.dieCutting)      jobRows.push(['Die Cutting',       'Yes'])
  if (input.eFluteLamination) jobRows.push(['E-Flute Lamination', 'Yes'])
  if (input.pasting)         jobRows.push(['Side Pasting',      'Yes'])

  // Packing & Delivery is always included
  jobRows.push(['Packing & Delivery', 'Included'])

  if (input.laminateType !== 'none')
    jobRows.push(['External Laminate', LAMINATE_LABELS[input.laminateType]])

  if (input.foilingPerUnit > 0)
    jobRows.push(['Foiling', 'Included'])

  autoTable(doc, {
    startY:      y,
    margin:      { left: ML, right: MR },
    tableWidth:  CW,
    body:        jobRows,
    theme:       'plain',
    styles:      { fontSize: 8.5, cellPadding: 2.4 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 58, textColor: DARK },
      1: { textColor: DARK },
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
  })

  y = (doc as any).lastAutoTable.finalY + 8

  // ═══════════════════════════════════════════════════════════════════════════
  // 4.  FINAL QUOTED PRICE  (keep together — needs ~32 mm)
  // ═══════════════════════════════════════════════════════════════════════════
  y = ensureSpace(doc, y, 42)
  y = sectionHeader(doc, y, 'FINAL QUOTED PRICE')

  // Highlighted price card
  const cardH = 26
  doc.setFillColor(254, 242, 242)        // very light red background
  doc.roundedRect(ML, y, CW, cardH, 3, 3, 'F')
  doc.setDrawColor(...RED); doc.setLineWidth(0.6)
  doc.roundedRect(ML, y, CW, cardH, 3, 3, 'S')

  // Label
  sf(doc, 8, 'normal', GREY)
  doc.text('UNIT PRICE', ML + 6, y + 8)

  // Unit price — large and bold, never split "Rs." from the number
  const unitPriceText = `${fmtRs(result.perUnitPrice)} per unit`
  sf(doc, 15, 'bold', RED)
  doc.text(unitPriceText, ML + 6, y + 19)

  // Quantity — right-aligned on same line
  sf(doc, 8.5, 'normal', GREY)
  doc.text(
    `For ${input.quantity.toLocaleString('en-US')} units`,
    PW - MR - 5, y + 19,
    { align: 'right' },
  )

  y += cardH + 8

  // ═══════════════════════════════════════════════════════════════════════════
  // 5.  NOTES & TERMS
  // ═══════════════════════════════════════════════════════════════════════════
  const notes = [
    customer.notes    ? { heading: 'Special Instructions', body: customer.notes }    : null,
    co.paymentTerms   ? { heading: 'Payment Terms',        body: co.paymentTerms }   : null,
    co.footerNote     ? { heading: 'Note',                 body: co.footerNote }     : null,
    co.bankDetails && co.bankDetails !== 'N/A'
      ? { heading: 'Bank Details', body: co.bankDetails }
      : null,
  ].filter(Boolean) as { heading: string; body: string }[]

  // Validity notice — always shown
  const validityNote = `This quotation is valid until ${displayDate(customer.validUntil)}. Prices are subject to change after this date.`

  if (notes.length > 0) {
    y = ensureSpace(doc, y, 30)
    y = sectionHeader(doc, y, 'NOTES & TERMS')

    for (const note of notes) {
      const bodyLines = doc.splitTextToSize(note.body, CW) as string[]
      const blockH = 5 + bodyLines.length * 4.5 + 4
      y = ensureSpace(doc, y, blockH)

      sf(doc, 8, 'bold', DARK);   doc.text(note.heading + ':', ML, y); y += 5
      sf(doc, 8, 'normal', GREY)
      doc.text(bodyLines, ML, y)
      y += bodyLines.length * 4.5 + 4
    }
  }

  // Validity line
  y = ensureSpace(doc, y, 10)
  sf(doc, 7.5, 'normal', GREY)
  doc.text(validityNote, ML, y)

  // ═══════════════════════════════════════════════════════════════════════════
  // 6.  FOOTER — printed on every page after all content is placed
  // ═══════════════════════════════════════════════════════════════════════════
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    const fy = PH - 12
    doc.setDrawColor(...LGREY); doc.setLineWidth(0.3)
    doc.line(ML, fy - 4, PW - MR, fy - 4)
    sf(doc, 7, 'normal', GREY)
    doc.text(
      `${co.legalName}   |   This is a system-generated quotation.`,
      PW / 2, fy, { align: 'center' },
    )
    doc.text(`Page ${i} of ${totalPages}`, PW - MR, fy, { align: 'right' })
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  doc.save(`PML-Quotation-${customer.quotationNumber || new Date().toISOString().slice(0, 10)}.pdf`)
}
