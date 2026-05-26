/**
 * Client-side dominant colour detection using Canvas API.
 * No external dependencies. Processes images entirely in the browser.
 *
 * ⚠ This produces an ESTIMATE only. Final print colour decisions must be
 *   confirmed by production / pre-press staff.
 */

import type { ColourAnalysisResult, DominantColour, SuggestedPrintMode, Confidence } from './analysis/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map(v => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0'))
      .join('')
  )
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

/** Round a channel value to the nearest multiple of `step`. */
function quantizeChannel(v: number, step: number): number {
  return Math.round(v / step) * step
}

/** True if pixel is near-white (likely background). */
function isNearWhite(r: number, g: number, b: number): boolean {
  return r > 228 && g > 228 && b > 228
}

/** True if pixel is near-black (shadow/outline). */
function isNearBlack(r: number, g: number, b: number): boolean {
  return r < 22 && g < 22 && b < 22
}

/** True if pixel is near-grey (very low saturation). */
function isNearGrey(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max - min < 20
}

// ─── Main analysis function ───────────────────────────────────────────────────

export async function analyzeImageColours(file: File): Promise<ColourAnalysisResult> {
  // 1. Load image
  const img = await loadImageElement(file)

  // 2. Draw at reduced size for performance (max 160 px on longest side)
  const MAX = 160
  const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.round(img.naturalWidth * scale)
  const h = Math.round(img.naturalHeight * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(img, 0, 0, w, h)

  // 3. Sample pixel data
  const { data } = ctx.getImageData(0, 0, w, h)

  // Quantization step — 32 gives 8 buckets per channel (512 total)
  const STEP = 32

  const colourMap = new Map<string, { r: number; g: number; b: number; count: number }>()
  let validPixels = 0

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    if (a < 128) continue               // transparent
    if (isNearWhite(r, g, b)) continue  // background white
    if (isNearBlack(r, g, b)) continue  // dark outlines/shadows (usually not spot colours)
    if (isNearGrey(r, g, b)) continue   // unsaturated noise

    validPixels++

    const qr = quantizeChannel(r, STEP)
    const qg = quantizeChannel(g, STEP)
    const qb = quantizeChannel(b, STEP)
    const key = `${qr},${qg},${qb}`

    const existing = colourMap.get(key)
    if (existing) {
      existing.count++
    } else {
      colourMap.set(key, { r: qr, g: qg, b: qb, count: 1 })
    }
  }

  // 4. Handle mostly-white or transparent images
  if (validPixels < 50) {
    return {
      dominantColours: [],
      estimatedColourCount: 1,
      suggestedPrintMode: '1-colour',
      confidence: 'low',
      notes:
        'Image appears mostly white or has very few coloured pixels. Cannot detect colours reliably. Try a clearer photo of the printed sample.',
    }
  }

  // 5. Filter to significant colours (>0.8% of valid pixels) and sort
  const minCount = Math.max(1, validPixels * 0.008)
  const sorted = Array.from(colourMap.values())
    .filter(c => c.count >= minCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  // 6. Build dominant colour list
  const dominantColours: DominantColour[] = sorted.map(c => ({
    hex: rgbToHex(c.r, c.g, c.b),
    percentage: Math.round((c.count / validPixels) * 100),
    rgb: [c.r, c.g, c.b],
  }))

  // 7. Determine print mode and confidence
  const distinctCount = sorted.length

  // What fraction of valid pixels do the top-4 colours cover?
  const topFourCoverage =
    sorted.slice(0, 4).reduce((s, c) => s + c.count, 0) / validPixels

  let estimatedColourCount: number
  let suggestedPrintMode: SuggestedPrintMode
  let confidence: Confidence

  if (distinctCount <= 1) {
    estimatedColourCount = 1
    suggestedPrintMode = '1-colour'
    confidence = 'high'
  } else if (distinctCount === 2) {
    estimatedColourCount = 2
    suggestedPrintMode = '2-colour'
    confidence = topFourCoverage > 0.80 ? 'high' : 'medium'
  } else if (distinctCount === 3) {
    estimatedColourCount = 3
    suggestedPrintMode = '3-colour'
    confidence = topFourCoverage > 0.75 ? 'medium' : 'low'
  } else if (distinctCount <= 5) {
    estimatedColourCount = 4
    suggestedPrintMode = '4-colour'
    confidence = topFourCoverage > 0.70 ? 'medium' : 'low'
  } else {
    estimatedColourCount = 4
    suggestedPrintMode = 'cmyk'
    confidence = 'low'
  }

  const notes =
    suggestedPrintMode === 'cmyk'
      ? `${distinctCount} colour groups detected — complex image with gradients or photos. Full colour / CMYK printing likely required.`
      : `${distinctCount} dominant colour group${distinctCount !== 1 ? 's' : ''} detected (ignoring white, black, and grey areas).`

  return { dominantColours, estimatedColourCount, suggestedPrintMode, confidence, notes }
}

// ─── Synchronous helper for a single colour's display label ──────────────────

export const PRINT_MODE_LABELS: Record<string, string> = {
  '1-colour': '1 Colour',
  '2-colour': '2 Colours',
  '3-colour': '3 Colours',
  '4-colour': '4 Colours',
  'cmyk': 'Full Colour / CMYK',
}

export const CONFIDENCE_LABELS: Record<string, string> = {
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
}
