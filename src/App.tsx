import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PricingProvider } from './context/PricingContext'
import HomePage from './pages/HomePage'
import CalculatorPage from './pages/CalculatorPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import ProtectedRoute from './components/ui/ProtectedRoute'

function AnalysisPlaceholder() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">🗂️</div>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Analysis Module Removed</h1>
        <p className="text-sm text-gray-500 mb-6">
          The sample &amp; layout analysis module has been removed in the simplified costing version.
        </p>
        <a
          href="/"
          className="inline-block px-5 py-2 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 transition-colors"
        >
          Go to Quotes
        </a>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PricingProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/calculator/:id" element={<CalculatorPage />} />
            <Route path="/analysis" element={<AnalysisPlaceholder />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PricingProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
