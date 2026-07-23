import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Field, Spinner, Empty, useToast } from '../components/ui.jsx';
import { Modal } from './Payments.jsx';

export default function Devices() {
  const toast = useToast();
  const [devices, setDevices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newKey, setNewKey] = useState(null);

  const load = () =>
    Promise.all([api.get('/api/devices'), api.get('/api/accounts')]).then(([d, a]) => {
      setDevices(d.devices);
      setAccounts(a.accounts);
    });

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const remove = async (id) => {
    await api.del(`/api/devices/${id}`);
    toast('Device deactivated');
    load();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Devices</h1>
          <p className="mt-1 text-sm text-ink-soft">Each phone running the NPay app needs its own enrollment key.</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}>+ Enroll device</button>
      </header>

      {loading ? (
        <div className="grid place-items-center py-20 text-bkash"><Spinner className="h-7 w-7" /></div>
      ) : devices.length === 0 ? (
        <Empty title="No devices enrolled">Enroll your counter phone to start forwarding payment SMS.</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {devices.map((d) => (
            <div key={d.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-ink">{d.name}</p>
                  <p className="text-xs text-ink-faint">Key {d.apiKey}</p>
                </div>
                <span className={`chip ${d.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {d.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="mt-3 text-sm text-ink-soft">
                {d.bkashAccount ? `→ ${d.bkashAccount.label} (${d.bkashAccount.accountNumber})` : 'Uses primary account'}
              </p>
              <p className="mt-1 text-xs text-ink-faint">
                {d.lastSeenAt ? `Last seen ${new Date(d.lastSeenAt).toLocaleString()}` : 'Never connected'}
              </p>
              {d.isActive && (
                <button className="mt-4 text-sm font-medium text-rose-600 hover:underline" onClick={() => remove(d.id)}>
                  Deactivate
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {open && (
        <EnrollModal
          accounts={accounts}
          onClose={() => setOpen(false)}
          onCreated={(device) => {
            setOpen(false);
            setNewKey(device);
            load();
          }}
        />
      )}
      {newKey && <KeyModal device={newKey} onClose={() => setNewKey(null)} />}
    </div>
  );
}

function EnrollModal({ accounts, onClose, onCreated }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [bkashAccountId, setAccountId] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { name };
      if (bkashAccountId) payload.bkashAccountId = bkashAccountId;
      const { device } = await api.post('/api/devices', payload);
      onCreated(device);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Enroll a device" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Device name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Store counter phone" required /></Field>
        <Field label="bKash account" hint="Which wallet this phone receives SMS for.">
          <select className="input" value={bkashAccountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Primary account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.label} · {a.accountNumber}</option>
            ))}
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? <Spinner /> : 'Enroll'}</button>
        </div>
      </form>
    </Modal>
  );
}

function KeyModal({ device, onClose }) {
  const toast = useToast();
  return (
    <Modal title="Device enrolled 🎉" onClose={onClose}>
      <p className="text-sm text-ink-soft">
        Enter this key in the NPay Android app on <b>{device.name}</b>. It is shown only once.
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-black/[0.04] p-3">
        <code className="flex-1 break-all font-mono text-sm text-ink">{device.apiKey}</code>
        <button
          className="btn-soft shrink-0"
          onClick={() => {
            navigator.clipboard?.writeText(device.apiKey);
            toast('Key copied', 'success');
          }}
        >
          Copy
        </button>
      </div>
      <div className="mt-6 flex justify-end">
        <button className="btn-primary" onClick={onClose}>Done</button>
      </div>
    </Modal>
  );
}
