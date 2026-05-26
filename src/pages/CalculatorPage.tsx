import { Link } from 'react-router-dom'
import { usePricing } from '../context/PricingContext'
import { useAuth } from '../context/AuthContext'
import CalculatorForm from '../components/calculator/CalculatorForm'
import logo from '../assets/logo.webp'

export default function CalculatorPage() {
  const { pricing, loading, error } = usePricing()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <img src={logo} alt="Pack Me Lanka" className="h-12 w-auto" />
          <div className="flex items-center gap-3">
            <Link
              to="/analysis"
              className="text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors"
            >
              Layout Analysis
            </Link>
            {user ? (
              <Link
                to="/admin"
                className="text-xs bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-red-800 transition-colors"
              >
                Admin
              </Link>
            ) : (
              <Link
                to="/admin/login"
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-700" />
            <p className="text-sm text-gray-500">Loading pricing data…</p>
          </div>
        ) : (
          <CalculatorForm pricing={pricing} />
        )}
      </main>
    </div>
  )
}
