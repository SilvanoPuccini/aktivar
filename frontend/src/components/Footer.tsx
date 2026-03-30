import { Mountain } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-outline-variant/10 bg-surface-lowest">
      <div className="max-w-screen-xl mx-auto px-6 md:px-8 py-8 md:py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Mountain size={18} className="text-primary" />
            <span className="font-headline text-base font-black tracking-tight text-on-surface">
              Aktivar
            </span>
            <span className="text-muted text-xs font-label ml-2">LATAM Outdoors</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-on-surface-variant">
            <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
            <Link to="/explore" className="hover:text-primary transition-colors">Explorar</Link>
            <Link to="/create" className="hover:text-primary transition-colors">Crear</Link>
            <Link to="/profile" className="hover:text-primary transition-colors">Perfil</Link>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-muted font-label">
            &copy; {new Date().getFullYear()} Aktivar
          </p>
        </div>
      </div>
    </footer>
  );
}
