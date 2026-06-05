/**
 * Pack Me Lanka — Customer-facing PDF quotation generator.
 *
 * IMPORTANT: This PDF is customer-facing only.
 * It shows job details, unit price, and total cost.
 * It does NOT expose internal cost breakdowns, rates, margins,
 * additional charge percentages, or any calculation formulas.
 *
 * Uses jsPDF.  Pure utility — no React imports.
 */

import jsPDF from 'jspdf'
import type { CustomerDetails, QuoteInput, QuoteResult, PricingConfig } from '../lib/pricingTypes'
import { MATERIAL_LABELS, BOARD_LABELS, LAMINATE_LABELS } from '../lib/pricingTypes'
import { fmtRs, fmtNum } from './calculateQuote'

// ─── Colour palette ───────────────────────────────────────────────────────────
const RED   = [185, 28, 28]   as [number, number, number]
const DARK  = [17, 24, 39]    as [number, number, number]
const GREY  = [107, 114, 128] as [number, number, number]
const LGREY = [243, 244, 246] as [number, number, number]
const WHITE = [255, 255, 255] as [number, number, number]
const SGREY = [229, 231, 235] as [number, number, number]   // section header bg
const MGREY = [75, 85, 99]    as [number, number, number]   // section header text
const STRIPE= [248, 249, 250] as [number, number, number]   // alt row tint

// ─── Page constants (mm) ──────────────────────────────────────────────────────
const PW      = 210                 // A4 width
const PH      = 297                 // A4 height
const ML      = 15                  // left margin
const MR      = 15                  // right margin
const CW      = PW - ML - MR       // usable content width = 180 mm
const FOOTER  = 20                  // reserved bottom strip

// ─── Row geometry ─────────────────────────────────────────────────────────────
const ROW_H   = 7.5                 // standard data row height (mm)
const SEC_H   = 6                   // section sub-header height (mm)
const LABEL_W = 58                  // label column width (mm)

// ─── Logo loader ──────────────────────────────────────────────────────────────
async function loadLogoBase64(url: string): Promise<{ data: string; w: number; h: number } | null> {
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
        resolve({ data: canvas.toDataURL('image/jpeg', 0.92), w: img.naturalWidth, h: img.naturalHeight })
      } catch { resolve(null) }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

// ─── Typography helper ────────────────────────────────────────────────────────
function sf(doc: jsPDF, size: number, style: 'normal' | 'bold' = 'normal', color: [number,number,number] = DARK) {
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
function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PH - FOOTER) { doc.addPage(); return 20 }
  return y
}

// ─── Red section-header bar ───────────────────────────────────────────────────
function sectionBar(doc: jsPDF, y: number, label: string): number {
  doc.setFillColor(...RED)
  doc.rect(ML, y, CW, 7, 'F')
  sf(doc, 8.5, 'bold', WHITE)
  doc.text(label, ML + 4, y + 4.8)
  return y + 10
}

// ─── Draw a sub-section header (light grey, small caps) ───────────────────────
function subHeader(doc: jsPDF, y: number, label: string): number {
  doc.setFillColor(...SGREY)
  doc.rect(ML, y, CW, SEC_H, 'F')
  sf(doc, 7, 'bold', MGREY)
  doc.text(label, ML + 4, y + 4)
  return y + SEC_H
}

// ─── Draw a single key-value row ──────────────────────────────────────────────
function dataRow(doc: jsPDF, y: number, label: string, value: string, stripe: boolean): number {
  if (stripe) {
    doc.setFillColor(...STRIPE)
    doc.rect(ML, y, CW, ROW_H, 'F')
  }
  // subtle left accent bar on label column
  doc.setFillColor(...RED)
  doc.rect(ML, y, 1.5, ROW_H, 'F')

  sf(doc, 8.5, 'bold', DARK)
  doc.text(label, ML + 5, y + 5.2)

  sf(doc, 8.5, 'normal', DARK)
  const lines = doc.splitTextToSize(value, CW - LABEL_W - 6) as string[]
  doc.text(lines, ML + LABEL_W, y + 5.2)

  const h = Math.max(ROW_H, lines.length * 5)
  return y + h
}

// ─── Draw a section of rows ───────────────────────────────────────────────────
function drawSection(
  doc: jsPDF,
  y: number,
  sectionLabel: string,
  rows: [string, string][],
): number {
  if (rows.length === 0) return y
  const totalH = SEC_H + rows.length * ROW_H
  y = ensureSpace(doc, y, totalH)
  y = subHeader(doc, y, sectionLabel)
  rows.forEach(([lbl, val], i) => {
    y = ensureSpace(doc, y, ROW_H)
    y = dataRow(doc, y, lbl, val, i % 2 === 1)
  })
  return y
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

  const logo = await loadLogoBase64('/logo.webp')

  // ═══════════════════════════════════════════════════════════════════════════
  // 1.  LETTERHEAD
  // ═══════════════════════════════════════════════════════════════════════════
  let y = 14

  // Logo — rendered square using the shorter side of the natural image
  if (logo) {
    const size = 22   // mm — always square
    doc.addImage(logo.data, 'JPEG', ML, y, size, size)
  }

  // Company details — right-aligned block
  const rx = PW - MR
  sf(doc, 11, 'bold', RED)
  doc.text(co.legalName, rx, y + 5, { align: 'right' })

  sf(doc, 8, 'normal', GREY)
  let cy = y + 11
  if (co.address) { doc.text(co.address, rx, cy, { align: 'right', maxWidth: 110 }); cy += 4.5 }
  const contactLine = [ifSet(co.phone, 'T: '), ifSet(co.email), ifSet(co.website)].filter(Boolean).join('  |  ')
  if (contactLine) { doc.text(contactLine, rx, cy, { align: 'right' }); cy += 4.5 }
  const regLine = [ifSet(co.brNumber, 'BR: '), ifSet(co.vatNumber, 'VAT: ')].filter(Boolean).join('   ')
  if (regLine) { doc.text(regLine, rx, cy, { align: 'right' }); cy += 4.5 }

  y = Math.max(y + 26, cy + 3)

  // Red rule
  doc.setDrawColor(...RED); doc.setLineWidth(0.8)
  doc.line(ML, y, PW - MR, y); y += 2

  // QUOTATION title
  sf(doc, 20, 'bold', RED)
  doc.text('QUOTATION', PW / 2, y + 9, { align: 'center' })
  y += 16

  // ═══════════════════════════════════════════════════════════════════════════
  // 2.  META BOXES  (Quotation Details | Bill To)
  // ═══════════════════════════════════════════════════════════════════════════
  const boxW  = (CW - 8) / 2
  const boxX2 = ML + boxW + 8
  const boxH  = 34

  doc.setFillColor(...LGREY)
  doc.roundedRect(ML, y, boxW, boxH, 2, 2, 'F')
  sf(doc, 7, 'bold', GREY);   doc.text('QUOTATION DETAILS', ML + 4, y + 6)
  sf(doc, 8, 'bold', DARK);   doc.text('Ref:',              ML + 4, y + 13)
  sf(doc, 8, 'normal', DARK); doc.text(customer.quotationNumber || 'N/A', ML + 18, y + 13)
  sf(doc, 8, 'bold', DARK);   doc.text('Date:',             ML + 4, y + 19)
  sf(doc, 8, 'normal', DARK); doc.text(displayDate(customer.quotationDate), ML + 18, y + 19)
  sf(doc, 8, 'bold', DARK);   doc.text('Valid until:',      ML + 4, y + 25)
  sf(doc, 8, 'normal', DARK); doc.text(displayDate(customer.validUntil), ML + 26, y + 25)

  doc.setFillColor(...LGREY)
  doc.roundedRect(boxX2, y, boxW, boxH, 2, 2, 'F')
  sf(doc, 7, 'bold', GREY); doc.text('BILL TO', boxX2 + 4, y + 6)
  sf(doc, 8, 'bold', DARK); doc.text(customer.customerName || 'N/A', boxX2 + 4, y + 13)
  sf(doc, 8, 'normal', GREY)
  if (customer.customerCompany) doc.text(customer.customerCompany, boxX2 + 4, y + 19)
  const custContact = [customer.customerPhone, customer.customerAddress].filter(v => v?.trim()).join('  |  ')
  if (custContact) doc.text(custContact, boxX2 + 4, y + 25, { maxWidth: boxW - 8 })

  y += boxH + 6

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.  PRODUCT & JOB DETAILS
  // ═══════════════════════════════════════════════════════════════════════════
  y = ensureSpace(doc, y, 30)

  // Thin outer border around the entire details block
  const detailsStartY = y
  y = sectionBar(doc, y, 'PRODUCT & JOB DETAILS')

  const materialLabel = input.material === 'none' ? 'Board Only' : MATERIAL_LABELS[input.material]
  const sqIn          = input.length * input.width

  // ── Product section ─────────────────────────────────────────────────────
  y = drawSection(doc, y, 'PRODUCT', [
    ['Product / Job', customer.quotationTitle || 'N/A'],
  ])

  // ── Dimensions section ──────────────────────────────────────────────────
  y = drawSection(doc, y, 'DIMENSIONS', [
    ['Length',        `${fmtNum(input.length)} in`],
    ['Width',         `${fmtNum(input.width)} in`],
    ['Square Inches', `${fmtNum(sqIn)} in²`],
    ['Quantity',      `${input.quantity.toLocaleString('en-US')} units`],
  ])

  // ── Material section ────────────────────────────────────────────────────
  const matRows: [string, string][] = [['Material', materialLabel]]
  if (input.board !== 'none') matRows.push(['Board', `${BOARD_LABELS[input.board]} ${input.boardGsm ?? 250} GSM`])
  y = drawSection(doc, y, 'MATERIAL', matRows)

  // ── Production options ──────────────────────────────────────────────────
  const prodRows: [string, string][] = []
  if (input.printing)
    prodRows.push(['Printing', input.colourCount === 4 ? 'CMYK / 4 Colours' : `${input.colourCount} Colour${input.colourCount > 1 ? 's' : ''}`])
  if (input.varnish)          prodRows.push(['Varnish',           'Yes'])
  if (input.dieCutting)       prodRows.push(['Die Cutting',       'Yes'])
  if (input.eFluteLamination) prodRows.push(['E-Flute Lamination','Yes'])
  if (input.pasting)          prodRows.push(['Side Pasting',      'Yes'])
  prodRows.push(['Packing & Delivery', 'Included'])
  if (input.laminateType !== 'none')
    prodRows.push(['External Laminate', LAMINATE_LABELS[input.laminateType]])
  if (input.foilingPerUnit > 0)
    prodRows.push(['Foiling', 'Included'])

  y = drawSection(doc, y, 'PRODUCTION OPTIONS', prodRows)

  // Thin border wrapping the details block
  doc.setDrawColor(...SGREY); doc.setLineWidth(0.4)
  doc.rect(ML, detailsStartY, CW, y - detailsStartY, 'S')

  y += 8

  // ═══════════════════════════════════════════════════════════════════════════
  // 4.  FINAL QUOTED PRICE  (unit price + total cost — keep together)
  // ═══════════════════════════════════════════════════════════════════════════
  y = ensureSpace(doc, y, 52)
  y = sectionBar(doc, y, 'FINAL QUOTED PRICE')

  // Card background
  const cardH = 38
  doc.setFillColor(254, 242, 242)
  doc.roundedRect(ML, y, CW, cardH, 3, 3, 'F')
  doc.setDrawColor(...RED); doc.setLineWidth(0.6)
  doc.roundedRect(ML, y, CW, cardH, 3, 3, 'S')

  // Quantity label
  sf(doc, 8, 'normal', GREY)
  doc.text(`For ${input.quantity.toLocaleString('en-US')} units`, ML + 6, y + 8)

  // Divider between the two price rows
  const midY = y + 14
  doc.setDrawColor(254, 202, 202); doc.setLineWidth(0.3)
  doc.line(ML + 4, midY, ML + CW - 4, midY)

  // Unit price (pre-SSCL)
  sf(doc, 8, 'normal', GREY)
  doc.text('UNIT PRICE (pre-SSCL)', ML + 6, y + 13)
  sf(doc, 14, 'bold', RED)
  doc.text(fmtRs(result.perUnitPrice), PW - MR - 5, y + 13, { align: 'right' })

  // Total production cost
  sf(doc, 8, 'normal', GREY)
  doc.text('PRODUCTION COST', ML + 6, y + 28)
  sf(doc, 14, 'bold', RED)
  doc.text(fmtRs(result.total), PW - MR - 5, y + 28, { align: 'right' })

  sf(doc, 7, 'normal', GREY)
  doc.text('excl. SSCL & VAT', PW - MR - 5, y + 18, { align: 'right' })
  doc.text('excl. SSCL & VAT', PW - MR - 5, y + 33, { align: 'right' })

  y += cardH + 6

  // ── SSCL breakdown ─────────────────────────────────────────────────────────
  y = ensureSpace(doc, y, 30)
  y = sectionBar(doc, y, 'LEVY')

  const taxBgH = 22
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(ML, y, CW, taxBgH, 2, 2, 'F')
  doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3)
  doc.roundedRect(ML, y, CW, taxBgH, 2, 2, 'S')

  const ty = y + 8
  sf(doc, 8, 'normal', GREY);  doc.text(`SSCL (${result.ssclPercentage}%)`, ML + 5, ty)
  sf(doc, 8, 'normal', DARK);  doc.text(fmtRs(result.ssclAmount), PW - MR - 5, ty, { align: 'right' })

  sf(doc, 7, 'normal', [120, 120, 120] as [number,number,number])
  doc.text('* Production cost figures do not include SSCL or VAT.', ML, ty + 10)

  y = ty + 18

  // Grand total card (incl. SSCL, excl. VAT)
  y = ensureSpace(doc, y, 28)
  const gtH = 22
  doc.setFillColor(254, 242, 242)
  doc.roundedRect(ML, y, CW, gtH, 3, 3, 'F')
  doc.setDrawColor(...RED); doc.setLineWidth(0.6)
  doc.roundedRect(ML, y, CW, gtH, 3, 3, 'S')

  sf(doc, 8, 'normal', GREY);  doc.text('TOTAL (incl. SSCL)', ML + 6, y + 9)
  sf(doc, 14, 'bold', RED);    doc.text(fmtRs(result.grandTotal), PW - MR - 5, y + 9, { align: 'right' })
  sf(doc, 7, 'normal', GREY);  doc.text(`${fmtRs(result.grandTotalPerUnit)} per unit  ·  + VAT applicable`, PW - MR - 5, y + 17, { align: 'right' })

  y += gtH + 8

  // ═══════════════════════════════════════════════════════════════════════════
  // 5.  NOTES & TERMS
  // ═══════════════════════════════════════════════════════════════════════════
  const notes = [
    customer.notes   ? { heading: 'Special Instructions', body: customer.notes }   : null,
    co.paymentTerms  ? { heading: 'Payment Terms',        body: co.paymentTerms }  : null,
    co.footerNote    ? { heading: 'Note',                 body: co.footerNote }    : null,
    co.bankDetails && co.bankDetails !== 'N/A'
      ? { heading: 'Bank Details', body: co.bankDetails } : null,
  ].filter(Boolean) as { heading: string; body: string }[]

  if (notes.length > 0) {
    y = ensureSpace(doc, y, 30)
    y = sectionBar(doc, y, 'NOTES & TERMS')
    for (const note of notes) {
      const bodyLines = doc.splitTextToSize(note.body, CW) as string[]
      y = ensureSpace(doc, y, 5 + bodyLines.length * 4.5 + 4)
      sf(doc, 8, 'bold', DARK);   doc.text(note.heading + ':', ML, y); y += 5
      sf(doc, 8, 'normal', GREY); doc.text(bodyLines, ML, y)
      y += bodyLines.length * 4.5 + 4
    }
  }

  // Validity notice
  y = ensureSpace(doc, y, 10)
  sf(doc, 7.5, 'normal', GREY)
  doc.text(
    `This quotation is valid until ${displayDate(customer.validUntil)}. Prices are subject to change after this date.`,
    ML, y, { maxWidth: CW },
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // 6.  FOOTER — every page
  // ═══════════════════════════════════════════════════════════════════════════
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    const fy = PH - 11
    doc.setDrawColor(...LGREY); doc.setLineWidth(0.3)
    doc.line(ML, fy - 4, PW - MR, fy - 4)
    sf(doc, 7, 'normal', GREY)
    doc.text(`${co.legalName}   |   This is a system-generated quotation.`, PW / 2, fy, { align: 'center' })
    doc.text(`Page ${i} of ${totalPages}`, PW - MR, fy, { align: 'right' })
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  doc.save(`PML-Quotation-${customer.quotationNumber || new Date().toISOString().slice(0, 10)}.pdf`)
}
