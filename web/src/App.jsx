import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { Spinner } from './components/ui.jsx';
import Layout from './components/Layout.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Overview from './pages/Overview.jsx';
import Payments from './pages/Payments.jsx';
import Transactions from './pages/Transactions.jsx';
import Accounts from './pages/Accounts.jsx';
import Devices from './pages/Devices.jsx';
import Developers from './pages/Developers.jsx';
import Checkout from './pages/Checkout.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center text-bkash">
        <Spinner className="h-8 w-8" />
      </div>
    );
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pay/:reference" element={<Checkout />} />

      <Route
        path="/app"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Overview />} />
        <Route path="payments" element={<Payments />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="devices" element={<Devices />} />
        <Route path="developers" element={<Developers />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
