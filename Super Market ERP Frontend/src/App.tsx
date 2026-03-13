import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Sales from './pages/Sales'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Customers from './pages/Customers'
import Suppliers from './pages/Suppliers'
import StockBatch from './pages/StockBatch'
import POrderDetail from './pages/POrderDetail'
import Users from './pages/Users'
import Profile from './pages/Profile'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="sales" element={<Sales />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<ProtectedRoute roles={['Manager', 'Admin']}><Categories /></ProtectedRoute>} />
            <Route path="customers" element={<Customers />} />
            <Route path="suppliers" element={<ProtectedRoute roles={['Manager', 'Admin']}><Suppliers /></ProtectedRoute>} />
            <Route path="stockbatch" element={<ProtectedRoute roles={['Manager', 'Admin']}><StockBatch /></ProtectedRoute>} />
            <Route path="porderdetail" element={<ProtectedRoute roles={['Manager', 'Admin']}><POrderDetail /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute roles={['Admin', 'Manager']}><Users /></ProtectedRoute>} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
