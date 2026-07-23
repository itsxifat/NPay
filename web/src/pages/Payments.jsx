import { useEffect, useState } from 'react';
import { api, taka } from '../api.js';
import { Field, StatusPill, Spinner, Empty, useToast } from '../components/ui.jsx';

export default function Payments() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = () =>
    Promise.all([api.get('/api/payments'), api.get('/api/accounts')]).then(([p, a]) => {
      setPayments(p.payments);
      setAccounts(a.accounts);
    });

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const cancel = async (id) => {
    try {
      await api.post(`/api/payments/${id}/cancel`);
      toast('Payment cancelled');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Payments</h1>
          <p className="mt-1 text-sm text-ink-soft">Create a request; it completes automatically when the money arrives.</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)} disabled={accounts.length === 0}>
          + New payment
        </button>
      </header>

      {accounts.length === 0 && !loading && (
        <div className="rounded-xl2 bg-amber-50 px-5 py-4 text-sm text-amber-800 ring-1 ring-amber-100">
          Add a bKash account first (Accounts tab) before creating payments.
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-20 text-bkash"><Spinner className="h-7 w-7" /></div>
      ) : payments.length === 0 ? (
        <Empty title="No payments yet">Create a payment request to generate a hosted checkout link.</Empty>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black/[0.02] text-left text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 font-medium">Payer</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-black/[0.01]">
                  <td className="px-5 py-3 font-semibold text-ink">
                    ৳ {taka(p.amount)}
                    {p.orderId && <span className="ml-2 text-xs font-normal text-ink-faint">#{p.orderId}</span>}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      className="text-bkash hover:underline"
                      onClick={() => {
                        navigator.clipboard?.writeText(`${location.origin}/pay/${p.reference}`);
                        toast('Checkout link copied', 'success');
                      }}
                    >
                      {p.reference}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{p.payerPhone ?? p.expectedSenderPhone ?? '—'}</td>
                  <td className="px-5 py-3"><StatusPill status={p.status} /></td>
                  <td className="px-5 py-3 text-right">
                    {p.status === 'PENDING' ? (
                      <button className="text-sm font-medium text-rose-600 hover:underline" onClick={() => cancel(p.id)}>
                        Cancel
                      </button>
                    ) : (
                      <span className="text-xs text-ink-faint">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <NewPaymentModal
          accounts={accounts}
          onClose={() => setOpen(false)}
          onCreated={() => {
            setOpen(false);
            load();
            toast('Payment request created', 'success');
          }}
        />
      )}
    </div>
  );
}

function NewPaymentModal({ accounts, onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({
    bkashAccountId: accounts[0]?.id ?? '',
    amount: '',
    orderId: '',
    expectedSenderPhone: '',
    customerName: '',
    description: '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        bkashAccountId: form.bkashAccountId,
        amount: Number(form.amount),
      };
      if (form.orderId) payload.orderId = form.orderId;
      if (form.expectedSenderPhone) payload.expectedSenderPhone = form.expectedSenderPhone;
      if (form.customerName) payload.customerName = form.customerName;
      if (form.description) payload.description = form.description;
      await api.post('/api/payments', payload);
      onCreated();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose} title="New payment request">
      <form onSubmit={submit} className="space-y-4">
        <Field label="bKash account">
          <select className="input" value={form.bkashAccountId} onChange={set('bkashAccountId')}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.label} · {a.accountNumber}</option>
            ))}
          </select>
        </Field>
        <Field label="Amount (৳)">
          <input className="input" type="number" step="0.01" min="1" value={form.amount} onChange={set('amount')} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Order ID" hint="Optional">
            <input className="input" value={form.orderId} onChange={set('orderId')} />
          </Field>
          <Field label="Payer number" hint="Optional, tightens matching">
            <input className="input" placeholder="01XXXXXXXXX" value={form.expectedSenderPhone} onChange={set('expectedSenderPhone')} />
          </Field>
        </div>
        <Field label="Description" hint="Optional, shown on checkout">
          <input className="input" value={form.description} onChange={set('description')} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? <Spinner /> : 'Create'}</button>
        </div>
      </form>
    </Modal>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <button className="text-ink-faint hover:text-ink" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
