import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePricing } from '../context/PricingContext'
import { defaultPricing } from '../data/defaults/pricing'
import type { SpecialRateCompany } from '../lib/pricingTypes'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MM_PER_INCH = 25.4

function fmtRs(n: number) {
  return 'Rs ' + n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

type ReelSize = 31 | 35 | 37 | 39

const REEL_OPTIONS: { value: ReelSize; label: string }[] = [
  { value: 31, label: '31"' },
  { value: 35, label: '35"' },
  { value: 37, label: '37"' },
  { value: 39, label: '39"' },
]

function getCompanyRate(company: SpecialRateCompany, reel: ReelSize): number {
  return { 31: company.reel31, 35: company.reel35, 37: company.reel37, 39: company.reel39 }[reel]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SpecialRatePage() {
  const { pricing } = usePricing()

  // Migrate legacy wilkinsSpence field into specialRates if needed
  const companies: SpecialRateCompany[] = (() => {
    if (pricing.specialRates && pricing.specialRates.length > 0) return pricing.specialRates
    if (pricing.wilkinsSpence) {
      return [{ id: 'wilkins-spence', name: 'Wilkins Spence', ...pricing.wilkinsSpence }]
    }
    return defaultPricing.specialRates!
  })()

  const [selectedId, setSelectedId] = useState<string>(companies[0]?.id ?? '')
  const [reelSize, setReelSize] = useState<ReelSize>(31)
  const [sheetWidth, setSheetWidth] = useState('')
  const [sheetHeight, setSheetHeight] = useState('')
  const [quantity, setQuantity] = useState('')

  const company = companies.find(c => c.id === selectedId) ?? companies[0]

  const wMm = parseFloat(sheetWidth) || 0
  const hMm = parseFloat(sheetHeight) || 0
  const qty = parseInt(quantity) || 0

  const wIn = wMm / MM_PER_INCH
  const hIn = hMm / MM_PER_INCH
  const areaSqIn = wIn * hIn
  const rate = company ? getCompanyRate(company, reelSize) : 0
  const costPerUnit = areaSqIn * rate
  const total = costPerUnit * qty
  const hasResult = wMm > 0 && hMm > 0 && qty > 0

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="Pack Me Lanka" className="h-12 w-auto" />
            <div>
              <p className="text-sm font-bold text-gray-900">Special Rate Quotation</p>
              <p className="text-xs text-gray-400">Company-specific reel rates</p>
            </div>
          </div>
          <Link to="/" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">

          {/* ── Company ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Company
            </label>
            {companies.length === 0 ? (
              <p className="text-sm text-red-500">No companies configured. Add one in Admin → Special Rate Companies.</p>
            ) : companies.length <= 4 ? (
              <div className="flex flex-wrap gap-2">
                {companies.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                      selectedId === c.id
                        ? 'border-red-700 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            ) : (
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* ── Reel Size ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Reel Size (inches)
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
            {company && (
              <p className="text-xs text-gray-400 mt-2">
                Rate: <span className="font-medium text-gray-600">Rs {getCompanyRate(company, reelSize).toFixed(4)}</span> per in²
              </p>
            )}
          </div>

          {/* ── Sheet Size ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Sheet Size (mm)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Width (mm)</label>
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
                <label className="block text-xs text-gray-500 mb-1">Height (mm)</label>
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
            {wMm > 0 && hMm > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Area: <span className="font-medium text-gray-600">{(wMm * hMm).toLocaleString()} mm²</span>
                {' '}= <span className="font-medium text-gray-600">{areaSqIn.toFixed(4)} in²</span>
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
          {hasResult && company ? (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cost Breakdown</h3>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Company</span>
                <span className="font-medium">{company.name}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Sheet dimensions</span>
                <span className="font-medium">{wMm} × {hMm} mm</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Sheet area</span>
                <span className="font-medium">{areaSqIn.toFixed(4)} in²</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Rate ({reelSize}" reel)</span>
                <span className="font-medium">Rs {rate.toFixed(4)} / in²</span>
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
              <p className="text-xs text-gray-400 text-right">{fmtRs(costPerUnit)} per unit</p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center text-gray-400 text-sm">
              Select a company, reel size, sheet dimensions, and quantity to see the quote.
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
