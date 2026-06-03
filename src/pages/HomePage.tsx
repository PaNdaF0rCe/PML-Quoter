import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchQuotes, deleteQuote } from '../firebase/quotes'
import { fmtRs } from '../utils/calculateQuote'
import type { SavedQuote } from '../lib/pricingTypes'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function displayDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d} ${months[Number(m) - 1]} ${y}`
}

function isQuoteValid(validUntil: string): boolean {
  if (!validUntil) return false
  return new Date(validUntil) >= new Date(new Date().toDateString())
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState<SavedQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const q = await fetchQuotes()
      setQuotes(q)
    } catch (e) {
      setError('Could not load quotes.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!window.confirm('Delete this quote? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await deleteQuote(id)
      setQuotes(prev => prev.filter(q => q.id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <img src="/logo.webp" alt="Pack Me Lanka" className="h-12 w-auto" />
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/admin" className="text-xs bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-red-800 transition-colors">
                Admin
              </Link>
            ) : (
              <Link to="/admin/login" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                Admin
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Page title + New button ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
            <p className="text-sm text-gray-500 mt-0.5">All saved quotations — click any row to open</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/wilkins-spence')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            >
              Wilkins Spence Quote
            </button>
            <button
              onClick={() => navigate('/calculator')}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-700 text-white text-sm font-semibold rounded-xl hover:bg-red-800 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Quotation
            </button>
          </div>
        </div>

        {/* ── States ── */}
        {loading && (
          <div className="flex items-center gap-3 py-16 justify-center text-gray-400">
            <span className="animate-spin w-5 h-5 border-2 border-red-700 border-t-transparent rounded-full" />
            Loading quotes…
          </div>
        )}

        {!loading && error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}

        {!loading && !error && quotes.length === 0 && (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">No quotes yet</h2>
            <p className="text-sm text-gray-400 mb-6">Create your first quotation to see it here.</p>
            <button
              onClick={() => navigate('/calculator')}
              className="px-6 py-2.5 bg-red-700 text-white text-sm font-semibold rounded-xl hover:bg-red-800 transition-colors"
            >
              New Quotation
            </button>
          </div>
        )}

        {/* ── Quote table ── */}
        {!loading && quotes.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref #</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product / Job</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valid Until</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quotes.map(q => {
                    const valid = isQuoteValid(q.customer.validUntil)
                    return (
                      <tr
                        key={q.id}
                        onClick={() => navigate(`/calculator/${q.id}`)}
                        className="hover:bg-red-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">
                          {q.customer.quotationNumber || '—'}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {q.customer.customerCompany || q.customer.customerName || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {q.customer.quotationTitle || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {displayDate(q.customer.quotationDate)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {displayDate(q.customer.validUntil)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            valid
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {valid ? '✓ Valid' : '✕ Expired'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                          {q.result?.total != null ? fmtRs(q.result.total) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={e => handleDelete(e, q.id)}
                            disabled={deletingId === q.id}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                            title="Delete quote"
                          >
                            {deletingId === q.id ? (
                              <span className="animate-spin inline-block w-4 h-4 border border-red-600 border-t-transparent rounded-full" />
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {quotes.map(q => {
                const valid = isQuoteValid(q.customer.validUntil)
                return (
                  <div
                    key={q.id}
                    onClick={() => navigate(`/calculator/${q.id}`)}
                    className="p-4 hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {q.customer.customerCompany || q.customer.customerName || 'No name'}
                        </p>
                        <p className="text-sm text-gray-500 truncate mt-0.5">
                          {q.customer.quotationTitle || 'No job name'}
                        </p>
                        <p className="text-xs text-gray-400 font-mono mt-1">{q.customer.quotationNumber}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-900">{q.result?.total != null ? fmtRs(q.result.total) : '—'}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                          valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {valid ? '✓ Valid' : '✕ Expired'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">
                        {displayDate(q.customer.quotationDate)} → {displayDate(q.customer.validUntil)}
                      </p>
                      <button
                        onClick={e => handleDelete(e, q.id)}
                        className="text-gray-300 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Footer count ── */}
        {!loading && quotes.length > 0 && (
          <p className="text-xs text-gray-400 text-center mt-4">
            {quotes.length} quote{quotes.length !== 1 ? 's' : ''} total
          </p>
        )}

      </main>
    </div>
  )
}
