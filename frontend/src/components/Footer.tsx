import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export default function Footer() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const primaryLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/explore', label: 'Explorar' },
    { to: '/journal', label: 'Journal' },
    { to: '/communities', label: 'Comunidades' },
    { to: '/marketplace', label: 'Marketplace' },
  ];
  const memberLinks = [
    { to: '/create', label: 'Crear' },
    { to: '/profile', label: 'Perfil' },
    { to: '/safety', label: 'Safety' },
  ];

  return (
    <footer className="mt-12 border-t border-outline-variant/10 bg-surface-lowest/85 backdrop-blur-xl">
      <div className="premium-shell grid gap-8 py-10 md:grid-cols-[1.2fr_1fr_auto] md:items-end">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(255,197,108,0.18),_transparent_58%),rgba(40,43,37,0.95)] text-primary">
              <Compass size={18} />
            </div>
            <div>
              <p className="font-headline text-xl font-black uppercase tracking-tight text-on-surface">Aktivar</p>
              <p className="font-label text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">Digital expedition for Latam outdoors</p>
            </div>
          </div>
          <p className="max-w-md text-sm text-on-surface-variant">
            Explora actividades, comparte rutas y arma tu próxima salida con una interfaz editorial, cálida y claramente premium.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-on-surface-variant">
            <span className="premium-chip">Journal</span>
            <span className="premium-chip">Gear</span>
            <span className="premium-chip">Safety</span>
          </div>
        </div>

        <nav className="grid grid-cols-2 gap-3 text-sm text-on-surface-variant md:justify-self-center">
          {primaryLinks.map((link) => (
            <Link key={link.to} to={link.to} className="transition-colors hover:text-primary">{link.label}</Link>
          ))}
          {isAuthenticated && memberLinks.map((link) => (
            <Link key={link.to} to={link.to} className="transition-colors hover:text-primary">{link.label}</Link>
          ))}
        </nav>

        <p className="font-label text-[10px] uppercase tracking-[0.18em] text-muted md:text-right">
          © {new Date().getFullYear()} Aktivar
        </p>
      </div>
    </footer>
  );
}
