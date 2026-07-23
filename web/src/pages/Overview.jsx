import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, taka } from '../api.js';
import { StatusPill, Spinner, Empty } from '../components/ui.jsx';
import { useAuth } from '../auth.jsx';

export default function Overview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/api/transactions/stats'), api.get('/api/payments')])
      .then(([s, p]) => {
        setStats(s);
        setPayments(p.payments.slice(0, 6));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="grid place-items-center py-24 text-bkash">
        <Spinner className="h-7 w-7" />
      </div>
    );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Welcome, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-soft">Here is what is happening with your payments.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Wallet balance" value={`৳ ${taka(stats.totalBalance)}`} accent />
        <Stat label="Total received" value={`৳ ${taka(stats.totalReceived)}`} />
        <Stat label="Verified transactions" value={stats.verifiedCount} />
        <Stat label="Completed payments" value={stats.completedPayments} />
      </div>

      {stats.unreconciledCount > 0 && (
        <div className="rounded-xl2 bg-rose-50 px-5 py-4 text-sm text-rose-700 ring-1 ring-rose-100">
          <b>{stats.unreconciledCount}</b> transaction(s) did not reconcile against the wallet balance.
          Review them in <Link to="/app/transactions" className="underline">Transactions</Link>.
        </div>
      )}

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink">Recent payments</h2>
          <Link to="/app/payments" className="text-sm font-semibold text-bkash hover:text-bkash-dark">
            View all
          </Link>
        </div>
        <div className="mt-4">
          {payments.length === 0 ? (
            <Empty title="No payments yet">
              Create your first payment request from the Payments tab.
            </Empty>
          ) : (
            <ul className="divide-y divide-black/5">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      ৳ {taka(p.amount)}
                      {p.orderId && <span className="ml-2 text-xs font-normal text-ink-faint">#{p.orderId}</span>}
                    </p>
                    <p className="truncate text-xs text-ink-faint">{p.reference}</p>
                  </div>
                  <StatusPill status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className={`card p-5 ${accent ? 'bg-gradient-to-br from-bkash to-bkash-deep text-white ring-0' : ''}`}>
      <p className={`text-sm ${accent ? 'text-white/80' : 'text-ink-faint'}`}>{label}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}
