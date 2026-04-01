import { useMemo, useState } from 'react';
import { ArrowRight, Gauge, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CTAButton from '@/components/CTAButton';
import EmptyState from '@/components/EmptyState';
import EcosystemNav from '@/components/EcosystemNav';
import SearchBar from '@/components/SearchBar';
import { normalizeMarketplaceListings } from '@/features/marketplace/listingUtils';
import { useMarketplaceListings } from '@/services/hooks';
import type { MarketplaceListing } from '@/types/ecosystem';

const categories = ['all', 'camping', 'climbing', 'water_sports', 'tech', 'packs'] as const;
const conditions = ['all', 'new', 'excellent', 'good'] as const;

export default function MarketplacePage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<(typeof categories)[number]>('all');
  const [condition, setCondition] = useState<(typeof conditions)[number]>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'featured' | 'newest'>('featured');

  const { data: listings = [], isLoading } = useMarketplaceListings({ category: category === 'all' ? undefined : category });
  const safeListings = useMemo(() => normalizeMarketplaceListings(listings), [listings]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const next = safeListings.filter((item) => {
      if (condition !== 'all' && item.condition !== condition) return false;
      if (!normalizedQuery) return true;
      return [item.title, item.location_name, item.seller_name, item.subcategory]
        .some((field) => field.toLowerCase().includes(normalizedQuery));
    });

    return [...next].sort((a, b) => {
      if (sort === 'featured') return Number(b.is_featured) - Number(a.is_featured) || b.rating - a.rating;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [condition, query, safeListings, sort]);

  const featuredListing = filtered.find((listing) => listing.is_featured) ?? filtered[0];
  const listingGrid = featuredListing ? filtered.filter((listing) => listing.id !== featuredListing.id) : filtered;
  const openListing = (slug: string, listing: MarketplaceListing) => {
    navigate(`/marketplace/${slug}`, { state: { listing } });
  };
  const hasNoResults = filtered.length === 0;

  const resetFilters = () => {
    setCategory('all');
    setCondition('all');
    setQuery('');
    setSort('featured');
  };

  return (
    <div className="premium-page">
      <EcosystemNav />

      <section className="premium-hero p-5 md:p-7 lg:p-8">
        <div className="grid gap-8 xl:grid-cols-[18rem_1fr]">
          <aside className="space-y-5">
            <div className="editorial-card-tonal rounded-[1.8rem] p-5">
              <p className="section-kicker">Categories</p>
              <div className="mt-4 space-y-2.5">
                {categories.filter((value) => value !== 'all').map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={`flex w-full items-center justify-between rounded-[1rem] px-4 py-4 font-label text-[10px] uppercase tracking-[0.16em] transition ${category === value ? 'bg-primary text-[#442c00] shadow-[var(--shadow-soft)]' : 'bg-surface-container-high/80 text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'}`}
                  >
                    {value.replace('_', ' ')}
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            </div>

            <div className="editorial-card-tonal rounded-[1.8rem] p-5">
              <p className="section-kicker">Condition</p>
              <div className="mt-4 space-y-3 text-sm text-on-surface-variant">
                {conditions.filter((value) => value !== 'all').map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCondition(value)}
                    className={`flex w-full items-center justify-between rounded-[1rem] px-4 py-3 ${condition === value ? 'bg-surface-container-highest text-on-surface' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'}`}
                  >
                    <span className="capitalize">{value.replace('_', ' ')}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${condition === value ? 'bg-primary' : 'bg-outline-variant/40'}`} />
                  </button>
                ))}
              </div>
            </div>

            <CTAButton label="List your gear" onClick={() => navigate('/marketplace/new')} fullWidth />
          </aside>

          <div className="space-y-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap gap-2 text-sm text-on-surface-variant">
                  <span className="premium-chip"><Sparkles size={14} /> Premium marketplace</span>
                  <span className="premium-chip"><ShieldCheck size={14} /> Confidence-first gear exchange</span>
                </div>
                <h1 className="mt-5 hero-title text-5xl text-on-surface md:text-7xl">Aktivar gear exchange</h1>
                <p className="mt-4 text-base text-on-surface-variant md:text-lg">Más jerarquía visual, mejores filtros y una presentación de producto más aspiracional para transmitir confianza, procedencia y deseo.</p>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:w-auto">
                {[
                  ['Items', `${filtered.length}`],
                  ['Featured', `${filtered.filter((item) => item.is_featured).length}`],
                  ['Top rated', `${filtered.filter((item) => item.rating >= 4.8).length}`],
                ].map(([label, value]) => (
                  <div key={label} className="editorial-metric rounded-[1.4rem] px-4 py-4">
                    <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
                    <p className="mt-2 font-headline text-3xl font-black tracking-tight text-primary">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <SearchBar value={query} onChange={setQuery} placeholder="Busca por marca, seller o tipo de equipo" />
              <div className="flex items-center gap-2 rounded-[1.2rem] bg-surface-container-low/80 p-1.5">
                {[
                  ['featured', 'Featured'],
                  ['newest', 'Newest'],
                ].map(([key, label]) => {
                  const active = sort === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSort(key as 'featured' | 'newest')}
                      className={`rounded-[0.9rem] px-4 py-3 font-label text-[10px] uppercase tracking-[0.18em] ${active ? 'bg-surface-container-highest text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {isLoading && safeListings.length === 0 ? (
        <EmptyState
          title="Cargando marketplace"
          description="Estamos preparando los listings para que puedas explorar el catálogo con contexto completo."
        />
      ) : (
        <>

      {featuredListing && (
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <div className="relative overflow-hidden rounded-[2rem] bg-surface-container shadow-[var(--shadow-forest)]">
            <img src={featuredListing.cover_image} alt={featuredListing.title} className="h-full min-h-[24rem] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
              <div className="flex flex-wrap gap-2 text-sm text-on-surface-variant">
                <span className="premium-chip">{featuredListing.condition}</span>
                <span className="premium-chip">{featuredListing.category.replace('_', ' / ')}</span>
              </div>
              <h2 className="mt-5 max-w-xl font-headline text-4xl font-black uppercase leading-[0.94] tracking-tight text-on-surface md:text-5xl">{featuredListing.title}</h2>
              <p className="mt-4 max-w-lg text-on-surface-variant">Selección destacada por su estado, reputación y presentación visual. Ideal para reforzar la dimensión premium del marketplace.</p>
              <div className="mt-6">
                <CTAButton label="View gear" variant="secondary" onClick={() => openListing(featuredListing.slug, featuredListing)} />
              </div>
            </div>
          </div>

          <div className="editorial-card-tonal flex flex-col justify-between rounded-[2rem] p-6 md:p-8">
            <div>
              <p className="section-kicker">Seller confidence</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/12 text-primary"><ShieldCheck size={24} /></div>
                <div>
                  <p className="font-headline text-3xl font-black text-on-surface">{featuredListing.seller_name}</p>
                  <p className="text-sm text-on-surface-variant">{featuredListing.location_name}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                ['Price', `$${featuredListing.price}`],
                ['Rating', `${featuredListing.rating}`],
                ['Subtype', featuredListing.subcategory],
              ].map(([label, value]) => (
                <div key={label} className="editorial-metric rounded-[1.4rem] px-4 py-5">
                  <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
                  <p className="mt-2 font-headline text-2xl font-black tracking-tight text-on-surface">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[1.5rem] bg-surface-container-low/80 p-5">
              <div className="flex items-center gap-2 text-primary">
                <Gauge size={16} />
                <p className="section-kicker text-primary">Marketplace intent</p>
              </div>
              <p className="mt-3 text-sm text-on-surface-variant">Se priorizó una lectura clara de procedencia, valor y estado para reducir el look de grilla genérica y acercarlo a un catálogo de outdoor premium.</p>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-kicker">Curated listings</p>
            <h2 className="font-headline text-3xl font-black uppercase tracking-tight text-on-surface md:text-4xl">Product cards with more desire and trust</h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Star size={16} className="text-primary" />
            {listingGrid.length} listings in rotation
          </div>
        </div>

        {hasNoResults ? (
          <EmptyState
            title="No encontramos gear"
            description="Prueba limpiar los filtros o publicar tu equipo para evitar un catálogo sin salida visible."
            action={{ label: 'Reset filters', onClick: resetFilters }}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listingGrid.map((listing) => (
              <article key={listing.id} className="group editorial-card-tonal overflow-hidden rounded-[1.8rem] p-3 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-forest)]">
                <div className="relative overflow-hidden rounded-[1.4rem]">
                  <img src={listing.cover_image} alt={listing.title} className="h-72 w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <span className="premium-chip">{listing.condition}</span>
                    {listing.is_featured && <span className="premium-chip text-primary">Featured</span>}
                  </div>
                  <div className="absolute bottom-3 right-3 rounded-[1rem] bg-surface/82 px-4 py-2 font-headline text-2xl font-black text-primary backdrop-blur-md">${listing.price}</div>
                </div>

                <div className="space-y-4 px-3 py-5">
                  <div className="flex items-center justify-between text-xs text-on-surface-variant">
                    <span className="uppercase tracking-[0.18em]">{listing.category.replace('_', ' / ')}</span>
                    <span className="inline-flex items-center gap-1 text-primary"><Star size={13} fill="currentColor" /> {listing.rating}</span>
                  </div>
                  <h3 className="font-headline text-3xl font-black tracking-tight text-on-surface transition-colors group-hover:text-primary">{listing.title}</h3>
                  <div className="premium-divider" />
                  <div className="flex items-center justify-between text-sm text-on-surface-variant">
                    <div>
                      <p className="font-semibold text-on-surface">{listing.seller_name}</p>
                      <p className="mt-1">{listing.location_name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openListing(listing.slug, listing)}
                      className="rounded-full bg-primary/10 px-4 py-2 font-label text-[10px] uppercase tracking-[0.18em] text-primary transition hover:bg-primary hover:text-[#442c00]"
                    >
                      View gear
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
}
