import { useEffect, useState } from 'react';
import { api, taka } from '../api.js';
import { StatusPill, Spinner, Empty } from '../components/ui.jsx';

export default function Transactions() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/transactions').then((d) => setTxs(d.transactions)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Transactions</h1>
        <p className="mt-1 text-sm text-ink-soft">Every incoming payment SMS, reconciled against your wallet balance.</p>
      </header>

      {loading ? (
        <div className="grid place-items-center py-20 text-bkash"><Spinner className="h-7 w-7" /></div>
      ) : txs.length === 0 ? (
        <Empty title="No transactions yet">
          Enroll a device and send a bKash payment to see verified transactions appear here.
        </Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-black/[0.02] text-left text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-medium">TrxID</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Sender</th>
                <th className="px-5 py-3 font-medium">Balance after</th>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {txs.map((t) => (
                <tr key={t.id} className="hover:bg-black/[0.01]">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-ink">
                    {t.trxId}
                    {t.payment && <span className="ml-2 rounded bg-bkash-tint px-1.5 py-0.5 text-[10px] font-semibold text-bkash-dark">paid</span>}
                  </td>
                  <td className="px-5 py-3 font-semibold text-ink">৳ {taka(t.amount)}</td>
                  <td className="px-5 py-3 text-ink-soft">{t.senderPhone}</td>
                  <td className="px-5 py-3 text-ink-soft">৳ {taka(t.balanceAfter)}</td>
                  <td className="px-5 py-3 text-ink-faint">{new Date(t.occurredAt).toLocaleString()}</td>
                  <td className="px-5 py-3"><StatusPill status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
