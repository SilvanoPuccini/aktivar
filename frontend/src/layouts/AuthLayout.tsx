import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface text-on-surface">
      <div
        className="pointer-events-none absolute -right-28 top-0 h-[28rem] w-[28rem] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,197,108,0.12), transparent 68%)' }}
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-0 h-[24rem] w-[24rem] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(123,218,150,0.1), transparent 70%)' }}
      />
      <main className="relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
