import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePricing } from '../context/PricingContext'
import { defaultPricing } from '../data/defaults/pricing'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRs(n: number) {
  return 'Rs ' + n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

type ReelSize = 31 | 35 | 39

const REEL_OPTIONS: { value: ReelSize; label: string }[] = [
  { value: 31, label: '31 mm' },
  { value: 35, label: '35 mm' },
  { value: 39, label: '39 mm' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WilkinsSpencePage() {
  const { pricing } = usePricing()
  const ws = pricing.wilkinsSpence ?? defaultPricing.wilkinsSpence!

  const [reelSize, setReelSize] = useState<ReelSize>(31)
  const [sheetWidth, setSheetWidth] = useState<string>('')
  const [sheetHeight, setSheetHeight] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')

  const rateMap: Record<ReelSize, number> = {
    31: ws.reel31,
    35: ws.reel35,
    39: ws.reel39,
  }

  const w = parseFloat(sheetWidth) || 0
  const h = parseFloat(sheetHeight) || 0
  const qty = parseInt(quantity) || 0
  const rate = rateMap[reelSize]
  const areaMm2 = w * h
  const costPerUnit = areaMm2 * rate
  const total = costPerUnit * qty
  const hasResult = w > 0 && h > 0 && qty > 0

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="Pack Me Lanka" className="h-12 w-auto" />
            <div>
              <p className="text-sm font-bold text-gray-900">Wilkins Spence</p>
              <p className="text-xs text-gray-400">Quotation Calculator</p>
            </div>
          </div>
          <Link to="/" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">

          {/* ── Reel Size ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Reel Size
            </label>
            <div className="flex gap-3">
              {REEL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setReelSize(opt.value)}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-colors ${
                    reelSize === opt.value
                      ? 'border-red-700 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Rate: <span className="font-medium text-gray-600">Rs {rateMap[reelSize].toFixed(6)}</span> per mm²
            </p>
          </div>

          {/* ── Sheet Size ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Sheet Size (mm)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Width</label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={sheetWidth}
                  onChange={e => setSheetWidth(e.target.value)}
                  placeholder="e.g. 200"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Height</label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={sheetHeight}
                  onChange={e => setSheetHeight(e.target.value)}
                  placeholder="e.g. 300"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            {w > 0 && h > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Area: <span className="font-medium text-gray-600">{areaMm2.toLocaleString()} mm²</span>
              </p>
            )}
          </div>

          {/* ── Quantity ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Quantity
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="e.g. 1000"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* ── Result ── */}
          {hasResult && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cost Breakdown</h3>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Sheet area</span>
                <span className="font-medium">{areaMm2.toLocaleString()} mm²</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Rate ({reelSize}mm reel)</span>
                <span className="font-medium">Rs {rate.toFixed(6)} / mm²</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Cost per sheet</span>
                <span className="font-medium">{fmtRs(costPerUnit)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Quantity</span>
                <span className="font-medium">{qty.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-red-700">{fmtRs(total)}</span>
              </div>
              <p className="text-xs text-gray-400 text-right">
                {fmtRs(costPerUnit)} per unit
              </p>
            </div>
          )}

          {!hasResult && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center text-gray-400 text-sm">
              Enter reel size, sheet dimensions, and quantity to see the quote.
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
