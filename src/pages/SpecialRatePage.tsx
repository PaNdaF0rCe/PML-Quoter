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

// Migrate old reel/flat shape into the new rates[] shape
function normalise(c: SpecialRateCompany & Record<string, unknown>): SpecialRateCompany {
  if (c.rates && Array.isArray(c.rates) && c.rates.length > 0) return c
  const legacy: { label: string; rate: number }[] = []
  if (c.rateType === 'flat' && typeof c.flatRate === 'number') {
    legacy.push({ label: 'Flat Rate', rate: c.flatRate as number })
  } else {
    for (const [key, label] of [['reel31','31" Reel'],['reel35','35" Reel'],['reel37','37" Reel'],['reel39','39" Reel']] as const) {
      if (typeof c[key] === 'number') legacy.push({ label, rate: c[key] as number })
    }
  }
  return { id: c.id, name: c.name, rates: legacy }
}

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SpecialRatePage() {
  const { pricing } = usePricing()

  const companies: SpecialRateCompany[] = (() => {
    const raw = pricing.specialRates && pricing.specialRates.length > 0
      ? pricing.specialRates
      : pricing.wilkinsSpence
        ? [{ id: 'wilkins-spence', name: 'Wilkins Spence', rates: [
            { label: '31" Reel', rate: (pricing.wilkinsSpence as Record<string,number>).reel31 ?? 0.30 },
            { label: '35" Reel', rate: (pricing.wilkinsSpence as Record<string,number>).reel35 ?? 0.35 },
            { label: '37" Reel', rate: (pricing.wilkinsSpence as Record<string,number>).reel37 ?? 0.38 },
            { label: '39" Reel', rate: (pricing.wilkinsSpence as Record<string,number>).reel39 ?? 0.42 },
          ] }]
        : defaultPricing.specialRates!
    return (raw as (SpecialRateCompany & Record<string,unknown>)[]).map(normalise)
  })()

  const [selectedId, setSelectedId] = useState<string>(companies[0]?.id ?? '')
  const [selectedRateIdx, setSelectedRateIdx] = useState(0)
  const [sheetWidth, setSheetWidth] = useState('')
  const [sheetHeight, setSheetHeight] = useState('')
  const [quantity, setQuantity] = useState('')

  const company = companies.find(c => c.id === selectedId) ?? companies[0]

  // Reset rate selection when company changes
  const handleCompanyChange = (id: string) => {
    setSelectedId(id)
    setSelectedRateIdx(0)
  }

  const safeIdx = Math.min(selectedRateIdx, (company?.rates.length ?? 1) - 1)
  const selectedRate = company?.rates[safeIdx]

  const wMm = parseFloat(sheetWidth) || 0
  const hMm = parseFloat(sheetHeight) || 0
  const qty = parseInt(quantity) || 0
  const areaSqIn = (wMm / MM_PER_INCH) * (hMm / MM_PER_INCH)
  const rate = selectedRate?.rate ?? 0
  const costPerUnit = areaSqIn * rate
  const total = costPerUnit * qty
  const hasResult = wMm > 0 && hMm > 0 && qty > 0 && rate > 0

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="Pack Me Lanka" className="h-12 w-auto" />
            <div>
              <p className="text-sm font-bold text-gray-900">Special Rate Quotation</p>
              <p className="text-xs text-gray-400">Company-specific rates</p>
            </div>
          </div>
          <Link to="/" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">← Back</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">

          {/* ── Company ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Company</label>
            {companies.length === 0 ? (
              <p className="text-sm text-red-500">No companies configured. Add one in Admin → Special Rate Companies.</p>
            ) : (
              <select value={selectedId} onChange={e => handleCompanyChange(e.target.value)} className={inputCls}>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>

          {/* ── Rate selection ── */}
          {company && company.rates.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Rate</label>
              {company.rates.length <= 5 ? (
                <div className="flex flex-wrap gap-2">
                  {company.rates.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedRateIdx(i)}
                      className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                        safeIdx === i
                          ? 'border-red-700 bg-red-50 text-red-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              ) : (
                <select
                  value={safeIdx}
                  onChange={e => setSelectedRateIdx(Number(e.target.value))}
                  className={inputCls}
                >
                  {company.rates.map((r, i) => (
                    <option key={i} value={i}>{r.label}</option>
                  ))}
                </select>
              )}
              {selectedRate && (
                <p className="text-xs text-gray-400 mt-2">
                  Rate: <span className="font-medium text-gray-600">Rs {selectedRate.rate.toFixed(4)}</span> per in²
                </p>
              )}
            </div>
          )}

          {/* ── Sheet Size ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Sheet Size (mm)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Width (mm)</label>
                <input type="number" min={0} step={0.1} value={sheetWidth}
                  onChange={e => setSheetWidth(e.target.value)} placeholder="e.g. 200" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Height (mm)</label>
                <input type="number" min={0} step={0.1} value={sheetHeight}
                  onChange={e => setSheetHeight(e.target.value)} placeholder="e.g. 300" className={inputCls} />
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
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Quantity</label>
            <input type="number" min={1} step={1} value={quantity}
              onChange={e => setQuantity(e.target.value)} placeholder="e.g. 1000" className={inputCls} />
          </div>

          {/* ── Result ── */}
          {hasResult && company && selectedRate ? (
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
                <span>Rate — {selectedRate.label}</span>
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
              Select a company, rate, sheet dimensions, and quantity to see the quote.
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
