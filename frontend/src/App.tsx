import { Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { CustomerListPage } from './pages/CustomerListPage'
import { LoginPage } from './pages/LoginPage'
import { OrderListPage } from './pages/OrderListPage'
import { ProductListPage } from './pages/ProductListPage'

function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="customers" element={<CustomerListPage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="orders" element={<OrderListPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
