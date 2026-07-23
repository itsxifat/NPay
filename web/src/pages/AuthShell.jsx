import { Link } from 'react-router-dom';
import { Logo, BkashMark } from '../components/Brand.jsx';

// Split-screen auth layout: form on the left, branded panel on the right.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/"><Logo /></Link>
          <h1 className="mt-10 text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-ink-soft">{footer}</div>}
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-bkash via-bkash-dark to-bkash-deep lg:block">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(600px_circle_at_30%_20%,white,transparent)]" />
        <div className="relative flex h-full flex-col justify-center px-16 text-white">
          <BkashMark className="text-lg text-white" />
          <p className="mt-6 max-w-md text-3xl font-bold leading-tight">
            Every payment, verified against the real wallet balance.
          </p>
          <p className="mt-4 max-w-md text-white/80">
            NPay confirms the exact amount and sender number from the payment SMS —
            reconciled, tamper-proof, and instant.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/90">
            {['Balance reconciliation on every transaction', 'Auto-matched checkout payments', 'Webhooks & hosted checkout API'].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-[11px]">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
