import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-outline-variant/10 bg-surface-lowest/90 backdrop-blur-xl">
      <div className="premium-shell grid gap-8 py-10 md:grid-cols-[1.2fr_1fr_auto] md:items-end">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-container-high text-primary">
              <Compass size={18} />
            </div>
            <div>
              <p className="font-headline text-xl font-black uppercase tracking-tight text-on-surface">Aktivar</p>
              <p className="font-label text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">Digital expedition for Latam outdoors</p>
            </div>
          </div>
          <p className="max-w-md text-sm text-on-surface-variant">
            Explora actividades, comparte rutas y arma tu próxima salida con una interfaz editorial, cálida y precisa.
          </p>
        </div>

        <nav className="grid grid-cols-2 gap-3 text-sm text-on-surface-variant md:justify-self-center">
          <Link to="/" className="transition-colors hover:text-primary">Inicio</Link>
          <Link to="/explore" className="transition-colors hover:text-primary">Explorar</Link>
          <Link to="/create" className="transition-colors hover:text-primary">Crear</Link>
          <Link to="/profile" className="transition-colors hover:text-primary">Perfil</Link>
        </nav>

        <p className="font-label text-[10px] uppercase tracking-[0.18em] text-muted md:text-right">
          © {new Date().getFullYear()} Aktivar
        </p>
      </div>
    </footer>
  );
}
