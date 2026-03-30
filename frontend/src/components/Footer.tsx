import { Mountain, Compass, Github, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="hidden md:block border-t border-outline-variant/10 bg-surface-lowest/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="grid grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <Mountain size={20} className="text-primary" />
              <span className="font-headline text-lg font-black tracking-tight text-on-surface">
                Aktivar
              </span>
            </div>
            <p className="text-sm text-muted leading-relaxed font-body max-w-xs">
              La plataforma outdoor que conecta personas con actividades al aire libre en toda Latinoamérica.
            </p>
            <div className="flex items-center gap-1 text-xs text-muted/60 font-label">
              <Compass size={12} />
              <span>LATAM Outdoors</span>
            </div>
          </div>

          {/* Explore */}
          <div className="space-y-4">
            <h4 className="font-label text-[10px] uppercase tracking-[0.2em] text-muted">
              Explorar
            </h4>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-body">
                Actividades
              </Link>
              <Link to="/explore" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-body">
                Mapa
              </Link>
              <Link to="/create" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-body">
                Crear actividad
              </Link>
            </nav>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <h4 className="font-label text-[10px] uppercase tracking-[0.2em] text-muted">
              Cuenta
            </h4>
            <nav className="flex flex-col gap-2">
              <Link to="/profile" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-body">
                Mi perfil
              </Link>
              <Link to="/notifications" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-body">
                Notificaciones
              </Link>
              <Link to="/dashboard" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-body">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-outline-variant/10 flex items-center justify-between">
          <p className="text-xs text-muted/50 font-label tracking-wider">
            &copy; {new Date().getFullYear()} Aktivar. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-1 text-xs text-muted/40 font-label">
            <span>Hecho con</span>
            <Heart size={10} className="text-error" fill="currentColor" />
            <span>en Patagonia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
