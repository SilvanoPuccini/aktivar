import { ArrowLeft, MapPin, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import CTAButton from '@/components/CTAButton';
import EcosystemNav from '@/components/EcosystemNav';
import EmptyState from '@/components/EmptyState';
import { normalizeMarketplaceListing, normalizeMarketplaceListings } from '@/features/marketplace/listingUtils';
import { useMarketplaceListings } from '@/services/hooks';
import type { MarketplaceListing } from '@/types/ecosystem';

export default function MarketplaceListingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { listingSlug } = useParams<{ listingSlug: string }>();
  const { data: listings = [], isLoading } = useMarketplaceListings();
  const listingFromState = normalizeMarketplaceListing((location.state as { listing?: MarketplaceListing } | null)?.listing);
  const safeListings = useMemo(() => normalizeMarketplaceListings(listings), [listings]);

  const listing = useMemo(
    () => {
      if (listingFromState && (listingFromState.slug === listingSlug || String(listingFromState.id) === listingSlug)) {
        return listingFromState;
      }

      return safeListings.find((item) => item.slug === listingSlug || String(item.id) === listingSlug);
    },
    [listingFromState, listingSlug, safeListings],
  );

  if (isLoading && !listing) {
    return (
      <div className="premium-page">
        <EcosystemNav />
        <EmptyState
          title="Cargando gear"
          description="Estamos recuperando la ficha para mostrar precio, procedencia y estado sin perder el contexto del catálogo."
        />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="premium-page">
        <EcosystemNav />
        <EmptyState
          title="Gear no encontrado"
          description="Este listing ya no está disponible o fue removido del catálogo."
          action={{ label: 'Volver al marketplace', onClick: () => navigate('/marketplace') }}
        />
      </div>
    );
  }

  return (
    <div className="premium-page">
      <EcosystemNav />

      <button type="button" onClick={() => navigate('/marketplace')} className="inline-flex items-center gap-2 font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant transition hover:text-on-surface">
        <ArrowLeft size={16} />
        Back to marketplace
      </button>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <div className="overflow-hidden rounded-[2rem] bg-surface-container shadow-[var(--shadow-forest)]">
          <img src={listing.cover_image} alt={listing.title} className="h-full min-h-[26rem] w-full object-cover" />
        </div>

        <div className="editorial-card-tonal flex flex-col justify-between rounded-[2rem] p-6 md:p-8">
          <div>
            <div className="flex flex-wrap gap-2 text-sm text-on-surface-variant">
              <span className="premium-chip">{listing.condition}</span>
              <span className="premium-chip">{listing.category.replace('_', ' / ')}</span>
              {listing.is_featured && <span className="premium-chip text-primary"><Sparkles size={14} /> Featured</span>}
            </div>

            <h1 className="mt-5 hero-title text-5xl text-on-surface md:text-6xl">{listing.title}</h1>
            <p className="mt-4 text-base text-on-surface-variant md:text-lg">
              Ficha premium con foco en procedencia, estado y confianza para evitar CTAs muertos y cerrar la navegación del catálogo.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="editorial-metric rounded-[1.4rem] px-4 py-5">
                <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Price</p>
                <p className="mt-2 font-headline text-3xl font-black tracking-tight text-primary">${listing.price}</p>
              </div>
              <div className="editorial-metric rounded-[1.4rem] px-4 py-5">
                <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Rating</p>
                <p className="mt-2 inline-flex items-center gap-2 font-headline text-3xl font-black tracking-tight text-on-surface"><Star size={20} className="text-primary" fill="currentColor" /> {listing.rating}</p>
              </div>
              <div className="editorial-metric rounded-[1.4rem] px-4 py-5">
                <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Subtype</p>
                <p className="mt-2 font-headline text-3xl font-black tracking-tight text-on-surface">{listing.subcategory}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4 rounded-[1.6rem] bg-surface-container-low/80 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/12 text-primary">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="font-headline text-2xl font-black text-on-surface">{listing.seller_name}</p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm text-on-surface-variant"><MapPin size={14} className="text-primary" /> {listing.location_name}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <CTAButton label="Back to marketplace" variant="secondary" onClick={() => navigate('/marketplace')} fullWidth />
              <CTAButton label="List your gear" onClick={() => navigate('/marketplace/new')} fullWidth />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
