import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell.jsx';
import { Field, Spinner } from '../components/ui.jsx';
import { useAuth } from '../auth.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', businessName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start verifying bKash payments automatically."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-bkash hover:text-bkash-dark">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Your name">
          <input className="input" value={form.name} onChange={set('name')} required />
        </Field>
        <Field label="Business name" hint="Shown to payers on the checkout page.">
          <input className="input" value={form.businessName} onChange={set('businessName')} />
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={form.email} onChange={set('email')} required />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <input className="input" type="password" value={form.password} onChange={set('password')} required minLength={8} />
        </Field>
        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        <button className="btn-primary w-full py-3" disabled={busy}>
          {busy ? <Spinner /> : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
