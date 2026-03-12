import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Plans from './pages/Plans'
import Subscribe from './pages/Subscribe'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminPlans from './pages/admin/AdminPlans'
import AdminOrders from './pages/admin/AdminOrders'
import AdminAdmins from './pages/admin/AdminAdmins'
import AdminServers from './pages/admin/AdminServers'

function Wrapped({ children, adminOnly = false }) {
  return (
    <ProtectedRoute adminOnly={adminOnly}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Wrapped><Dashboard /></Wrapped>} />
      <Route path="/plans" element={<Wrapped><Plans /></Wrapped>} />
      <Route path="/subscribe" element={<Wrapped><Subscribe /></Wrapped>} />
      <Route path="/admin" element={<Wrapped adminOnly><AdminDashboard /></Wrapped>} />
      <Route path="/admin/users" element={<Wrapped adminOnly><AdminUsers /></Wrapped>} />
      <Route path="/admin/plans" element={<Wrapped adminOnly><AdminPlans /></Wrapped>} />
      <Route path="/admin/orders" element={<Wrapped adminOnly><AdminOrders /></Wrapped>} />
      <Route path="/admin/admins" element={<Wrapped adminOnly><AdminAdmins /></Wrapped>} />
      <Route path="/admin/servers" element={<Wrapped adminOnly><AdminServers /></Wrapped>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
