import { useEffect, useState } from 'react';
import { api, taka } from '../api.js';
import { Field, Spinner, Empty, useToast } from '../components/ui.jsx';
import { Modal } from './Payments.jsx';
import { BkashBadge } from '../components/Brand.jsx';

export default function Accounts() {
  const toast = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => api.get('/api/accounts').then((d) => setAccounts(d.accounts));
  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">bKash accounts</h1>
          <p className="mt-1 text-sm text-ink-soft">Set the current wallet balance once — reconciliation keeps it in sync after that.</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}>+ Add account</button>
      </header>

      {loading ? (
        <div className="grid place-items-center py-20 text-bkash"><Spinner className="h-7 w-7" /></div>
      ) : accounts.length === 0 ? (
        <Empty title="No bKash account yet">Add your receiving wallet to start verifying payments.</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {accounts.map((a) => (
            <div key={a.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <BkashBadge size={44} />
                  <div>
                    <p className="font-semibold text-ink">{a.label}</p>
                    <p className="text-sm text-ink-faint">{a.accountNumber}</p>
                  </div>
                </div>
                <span className={`chip ${a.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {a.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-5 rounded-2xl bg-black/[0.03] p-4">
                <p className="text-xs text-ink-faint">Current balance</p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-ink">৳ {taka(a.currentBalance)}</p>
              </div>
              <button className="btn-soft mt-4 w-full" onClick={() => setEditing(a)}>Adjust balance</button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <AddAccountModal
          onClose={() => setOpen(false)}
          onDone={() => {
            setOpen(false);
            load();
            toast('Account added', 'success');
          }}
        />
      )}
      {editing && (
        <BalanceModal
          account={editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            load();
            toast('Balance updated', 'success');
          }}
        />
      )}
    </div>
  );
}

function AddAccountModal({ onClose, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ label: '', accountNumber: '', openingBalance: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/api/accounts', {
        label: form.label,
        accountNumber: form.accountNumber,
        openingBalance: Number(form.openingBalance || 0),
      });
      onDone();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Add bKash account" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Label"><input className="input" value={form.label} onChange={set('label')} placeholder="Main store wallet" required /></Field>
        <Field label="bKash number"><input className="input" value={form.accountNumber} onChange={set('accountNumber')} placeholder="01XXXXXXXXX" required /></Field>
        <Field label="Current balance (৳)" hint="The exact wallet balance right now.">
          <input className="input" type="number" step="0.01" min="0" value={form.openingBalance} onChange={set('openingBalance')} required />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? <Spinner /> : 'Add account'}</button>
        </div>
      </form>
    </Modal>
  );
}

function BalanceModal({ account, onClose, onDone }) {
  const toast = useToast();
  const [balance, setBalance] = useState((account.currentBalance / 100).toString());
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put(`/api/accounts/${account.id}/balance`, { balance: Number(balance) });
      onDone();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Adjust balance" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-ink-soft">
          Set the authoritative current balance for <b>{account.label}</b>. Use this if the app missed
          an SMS and the balance drifted.
        </p>
        <Field label="Current balance (৳)">
          <input className="input" type="number" step="0.01" min="0" value={balance} onChange={(e) => setBalance(e.target.value)} required />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? <Spinner /> : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}
