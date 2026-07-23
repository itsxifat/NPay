import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../api.js';
import { Spinner } from '../components/ui.jsx';
import { Logo, BkashMark, BkashBadge } from '../components/Brand.jsx';

export default function Checkout() {
  const { reference } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const socketRef = useRef(null);

  const load = () =>
    api
      .get(`/checkout/${reference}`, { auth: false })
      .then(setPayment)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    const socket = io('/', { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('watch:payment', reference);
    socket.on('payment:update', (update) => {
      // Only merge status-related fields; keep the Taka `amount` from the
      // REST load (the socket carries amount in poisha).
      if (update.reference === reference) {
        setPayment((p) => ({
          ...p,
          status: update.status,
          payerPhone: update.payerPhone ?? p.payerPhone,
          completedAt: update.completedAt ?? p.completedAt,
        }));
      }
    });
    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  // Poll as a fallback in case the socket misses an event.
  useEffect(() => {
    if (!payment || payment.status !== 'PENDING') return;
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment?.status]);

  if (loading)
    return (
      <Screen>
        <div className="grid place-items-center py-20 text-bkash"><Spinner className="h-8 w-8" /></div>
      </Screen>
    );

  if (notFound)
    return (
      <Screen>
        <div className="card p-8 text-center">
          <p className="text-lg font-bold text-ink">Payment not found</p>
          <p className="mt-1 text-sm text-ink-soft">This checkout link is invalid or has been removed.</p>
        </div>
      </Screen>
    );

  return (
    <Screen>
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-bkash to-bkash-deep px-6 py-6 text-white">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/80">Pay {payment.merchant}</span>
            <BkashMark className="text-base text-white" />
          </div>
          <p className="mt-4 text-4xl font-extrabold tracking-tight">৳ {fmt(payment.amount)}</p>
          {payment.description && <p className="mt-1 text-sm text-white/80">{payment.description}</p>}
        </div>

        <div className="p-6">
          {payment.status === 'COMPLETED' ? (
            <Success payment={payment} />
          ) : payment.status === 'PENDING' ? (
            <Instructions payment={payment} />
          ) : (
            <Closed status={payment.status} />
          )}
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-ink-faint">
        Secured by NPay · automated <BkashMark className="text-xs" /> verification
      </p>
    </Screen>
  );
}

function Instructions({ payment }) {
  return (
    <div>
      <ol className="space-y-4">
        <Step n={1} title="Open bKash & choose Send Money" />
        <Step n={2} title="Send the exact amount to this number">
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-black/[0.03] p-3">
            <BkashBadge size={38} />
            <div className="flex-1">
              <p className="font-mono text-lg font-bold tracking-wide text-ink">{payment.payTo}</p>
              <p className="text-xs text-ink-faint">Send exactly ৳ {fmt(payment.amount)}</p>
            </div>
            <CopyBtn value={payment.payTo} />
          </div>
        </Step>
        {payment.expectedSenderPhone && (
          <Step n={3} title="Pay from your registered number">
            <p className="mt-1 font-mono text-sm text-ink-soft">{payment.expectedSenderPhone}</p>
          </Step>
        )}
      </ol>

      <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
        <Spinner className="h-4 w-4" /> Waiting for your payment…
      </div>
      <p className="mt-3 text-center text-xs text-ink-faint">
        This page updates automatically the moment your payment is verified.
      </p>
    </div>
  );
}

function Success({ payment }) {
  return (
    <div className="py-4 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
        <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="mt-4 text-xl font-bold text-ink">Payment successful</p>
      <p className="mt-1 text-sm text-ink-soft">Your payment has been verified and confirmed.</p>
      <div className="mt-5 space-y-2 rounded-xl bg-black/[0.03] p-4 text-left text-sm">
        <Row k="Amount" v={`৳ ${fmt(payment.amount)}`} />
        {payment.payerPhone && <Row k="Paid from" v={payment.payerPhone} />}
        {payment.completedAt && <Row k="Confirmed" v={new Date(payment.completedAt).toLocaleString()} />}
      </div>
    </div>
  );
}

function Closed({ status }) {
  const text = status === 'EXPIRED' ? 'This payment link has expired.' : 'This payment was cancelled.';
  return (
    <div className="py-6 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-400">
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </div>
      <p className="mt-4 text-lg font-bold text-ink">{status}</p>
      <p className="mt-1 text-sm text-ink-soft">{text}</p>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-bkash-tint text-xs font-bold text-bkash-dark">{n}</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        {children}
      </div>
    </li>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-faint">{k}</span>
      <span className="font-semibold text-ink">{v}</span>
    </div>
  );
}

function CopyBtn({ value }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn-soft shrink-0"
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

function Screen({ children }) {
  return (
    <div className="min-h-screen bg-[#F7F6FB]">
      <div className="mx-auto max-w-md px-4 py-8">
        <div className="mb-6 flex justify-center"><Logo /></div>
        {children}
      </div>
    </div>
  );
}

const fmt = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
