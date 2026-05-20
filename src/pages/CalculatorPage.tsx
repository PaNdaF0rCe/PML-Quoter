import { Link } from 'react-router-dom'
import { usePricing } from '../context/PricingContext'
import { useAuth } from '../context/AuthContext'
import CalculatorForm from '../components/calculator/CalculatorForm'

export default function CalculatorPage() {
  const { pricing, loading, error } = usePricing()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-800 text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Pack Me Lanka</h1>
            <p className="text-blue-200 text-sm">Quotation Calculator</p>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/admin"
                className="text-xs bg-white text-blue-800 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Admin Dashboard
              </Link>
            ) : (
              <Link
                to="/admin/login"
                className="text-xs text-blue-200 hover:text-white transition-colors"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700" />
            <p className="text-sm text-gray-500">Loading pricing data…</p>
          </div>
        ) : (
          <CalculatorForm pricing={pricing} />
        )}
      </main>
    </div>
  )
}
