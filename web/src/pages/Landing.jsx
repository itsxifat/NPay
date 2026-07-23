import { Link } from 'react-router-dom';
import { Logo, BkashMark } from '../components/Brand.jsx';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F7F6FB]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link to="/login" className="btn-ghost">Sign in</Link>
          <Link to="/register" className="btn-primary">Get started</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="chip bg-bkash-tint text-bkash-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-bkash" />
              Automated verification for <BkashMark className="text-sm" />
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              Verify every <BkashMark className="text-4xl sm:text-5xl" /> payment
              <br className="hidden sm:block" /> automatically.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ink-soft">
              NPay reads the payment SMS on your phone, reconciles it against your wallet
              balance, and confirms the exact amount and sender — so a payment is marked
              successful the instant the money truly lands. No manual checking, no fake screenshots.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary px-6 py-3 text-base">Create free account</Link>
              <a href="#how" className="btn-ghost px-6 py-3 text-base">See how it works</a>
            </div>
            <p className="mt-5 text-sm text-ink-faint">
              Demo login — <span className="font-semibold text-ink-soft">demo@npay.test</span> / password123
            </p>
          </div>

          <div className="relative">
            <PhoneMock />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Four steps, fully automatic
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bkash-tint text-sm font-bold text-bkash-dark">
                {i + 1}
              </div>
              <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-sm text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-black/5 py-8 text-center text-sm text-ink-faint">
        NPay — automated <BkashMark className="text-sm" /> payment verification. Not affiliated with bKash.
      </footer>
    </div>
  );
}

const STEPS = [
  { title: 'Set your balance', body: 'Add your bKash wallet and enter its current balance once, at setup.' },
  { title: 'Phone forwards SMS', body: 'The NPay Android app captures the payment SMS and sends the details securely to the server.' },
  { title: 'Server reconciles', body: 'Old balance + received amount must equal the new balance. Only then is the transaction verified.' },
  { title: 'Payment confirmed', body: 'Matched to your checkout by amount and sender number — merchant and payer both notified instantly.' },
];

function PhoneMock() {
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="rounded-[2.2rem] bg-ink p-3 shadow-pop">
        <div className="rounded-[1.7rem] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-faint">Incoming SMS</span>
            <BkashMark className="text-sm" />
          </div>
          <div className="mt-3 rounded-2xl bg-black/[0.03] p-3.5 text-[13px] leading-relaxed text-ink-soft">
            You have received <b className="text-ink">Tk 3,000.00</b> from 01540110050. Ref . Fee Tk 0.00.
            Balance Tk 3,037.15. TrxID <b className="text-ink">DGL3KX8M7D</b> at 21/07/2026 14:50
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Reconciled &amp; verified
          </div>

          <div className="mt-3 space-y-2">
            <Row k="Amount" v="৳ 3,000.00" />
            <Row k="Sender" v="01540110050" />
            <Row k="TrxID" v="DGL3KX8M7D" />
          </div>

          <div className="mt-4 rounded-2xl bg-bkash p-4 text-white">
            <p className="text-xs/none opacity-80">Payment status</p>
            <p className="mt-1 text-lg font-bold">Successful ✓</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-faint">{k}</span>
      <span className="font-semibold text-ink">{v}</span>
    </div>
  );
}
