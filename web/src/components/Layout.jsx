import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Logo } from './Brand.jsx';
import { useAuth } from '../auth.jsx';

const NAV = [
  { to: '/app', label: 'Overview', end: true, icon: GridIcon },
  { to: '/app/payments', label: 'Payments', icon: CardIcon },
  { to: '/app/transactions', label: 'Transactions', icon: ListIcon },
  { to: '/app/accounts', label: 'bKash accounts', icon: WalletIcon },
  { to: '/app/devices', label: 'Devices', icon: PhoneIcon },
  { to: '/app/developers', label: 'Developers', icon: CodeIcon },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden flex-col border-r border-black/5 bg-white px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-bkash-tint text-bkash-dark' : 'text-ink-soft hover:bg-black/[0.03]'
                }`
              }
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 border-t border-black/5 pt-4">
          <div className="px-3">
            <p className="truncate text-sm font-semibold text-ink">{user?.businessName ?? user?.name}</p>
            <p className="truncate text-xs text-ink-faint">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="mt-3 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-ink-soft hover:bg-black/[0.03]"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 lg:hidden">
          <Logo className="h-7" />
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="text-sm font-medium text-ink-soft"
          >
            Sign out
          </button>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function GridIcon() {
  return icon('M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z');
}
function CardIcon() {
  return icon('M2 5h20v14H2zM2 9h20');
}
function ListIcon() {
  return icon('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01');
}
function WalletIcon() {
  return icon('M3 7h16a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 7l0-2h13M17 13h.01');
}
function PhoneIcon() {
  return icon('M7 2h10v20H7zM11 18h2');
}
function CodeIcon() {
  return icon('M8 8l-4 4 4 4M16 8l4 4-4 4');
}
function icon(d) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
