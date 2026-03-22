import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-lowest relative overflow-hidden">
      {/* Subtle ambient glow effects */}
      <div
        className="pointer-events-none absolute -top-[150px] -right-[150px] h-[500px] w-[500px]"
        style={{
          background: 'radial-gradient(circle, rgba(255,197,108,0.10) 0%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-[80px] -left-[80px] h-[350px] w-[350px]"
        style={{
          background: 'radial-gradient(circle, rgba(123,218,150,0.07) 0%, transparent 70%)',
        }}
      />
      <main className="relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
