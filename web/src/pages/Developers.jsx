import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Field, Spinner, Empty, useToast } from '../components/ui.jsx';
import { Modal } from './Payments.jsx';

export default function Developers() {
  const toast = useToast();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState(null);

  const load = () => api.get('/api/keys').then((d) => setKeys(d.keys));
  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const remove = async (id) => {
    await api.del(`/api/keys/${id}`);
    toast('API key revoked');
    load();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Developers</h1>
          <p className="mt-1 text-sm text-ink-soft">Integrate NPay checkout into your own store with API keys.</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}>+ New API key</button>
      </header>

      {loading ? (
        <div className="grid place-items-center py-20 text-bkash"><Spinner className="h-7 w-7" /></div>
      ) : keys.length === 0 ? (
        <Empty title="No API keys yet">Create a key pair to call the payment API.</Empty>
      ) : (
        <div className="card divide-y divide-black/5">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-semibold text-ink">{k.label}</p>
                <p className="font-mono text-xs text-ink-faint">{k.publicKey}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-ink-faint">
                  {k.lastUsedAt ? `Used ${new Date(k.lastUsedAt).toLocaleDateString()}` : 'Never used'}
                </span>
                <button className="text-sm font-medium text-rose-600 hover:underline" onClick={() => remove(k.id)}>
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ApiDocs />

      {open && (
        <CreateKeyModal
          onClose={() => setOpen(false)}
          onCreated={(key) => {
            setOpen(false);
            setCreated(key);
            load();
          }}
        />
      )}
      {created && <SecretModal keyData={created} onClose={() => setCreated(null)} />}
    </div>
  );
}

function CreateKeyModal({ onClose, onCreated }) {
  const toast = useToast();
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const key = await api.post('/api/keys', { label });
      onCreated(key);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Create API key" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Label"><input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Production store" required /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? <Spinner /> : 'Create'}</button>
        </div>
      </form>
    </Modal>
  );
}

function SecretModal({ keyData, onClose }) {
  const toast = useToast();
  const copy = (v) => {
    navigator.clipboard?.writeText(v);
    toast('Copied', 'success');
  };
  return (
    <Modal title="Save your secret key" onClose={onClose}>
      <p className="text-sm text-ink-soft">The secret key is shown only once. Store it securely.</p>
      <div className="mt-4 space-y-3">
        <KeyRow label="Public key" value={keyData.publicKey} onCopy={copy} />
        <KeyRow label="Secret key" value={keyData.secretKey} onCopy={copy} />
      </div>
      <div className="mt-6 flex justify-end">
        <button className="btn-primary" onClick={onClose}>Done</button>
      </div>
    </Modal>
  );
}

function KeyRow({ label, value, onCopy }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex items-center gap-2 rounded-xl bg-black/[0.04] p-3">
        <code className="flex-1 break-all font-mono text-xs text-ink">{value}</code>
        <button className="btn-soft shrink-0" onClick={() => onCopy(value)}>Copy</button>
      </div>
    </div>
  );
}

function ApiDocs() {
  const example = `curl -X POST ${location.origin}/v1/payments \\
  -H "Authorization: Bearer pk_xxx:sk_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 3000,
    "orderId": "ORDER-1042",
    "expectedSenderPhone": "01540110050",
    "callbackUrl": "https://yourstore.com/webhooks/npay"
  }'`;
  const response = `{
  "reference": "pay_XXXXXXXX",
  "status": "PENDING",
  "amount": 3000,
  "payTo": "01700000000",
  "checkoutUrl": "${location.origin}/pay/pay_XXXXXXXX"
}`;
  return (
    <section className="card p-6">
      <h2 className="font-semibold text-ink">Quick start</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Create a payment and redirect your customer to <code className="rounded bg-black/[0.05] px-1">checkoutUrl</code>.
        When the matching bKash SMS is verified, we complete the payment and POST to your callback.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <CodeBlock title="Request" code={example} />
        <CodeBlock title="Response" code={response} />
      </div>
    </section>
  );
}

function CodeBlock({ title, code }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">{title}</p>
      <pre className="overflow-x-auto rounded-xl bg-ink p-4 text-xs leading-relaxed text-white/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}
