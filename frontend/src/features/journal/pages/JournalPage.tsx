import { ArrowRight, Flame, MapPin, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '@/components/EmptyState';
import EcosystemNav from '@/components/EcosystemNav';
import { useFeaturedJournalStory, useJournalStories, useTrendingJournalStories } from '@/services/hooks';
import { buildJournalStoryHref, isUsableJournalStory, mergeJournalStories } from '../journalUtils';

const formatStoryDate = (value?: string) => {
  if (!value) return 'Edición actual';
  return new Date(value).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function JournalPage() {
  const navigate = useNavigate();
  const featuredQuery = useFeaturedJournalStory();
  const storiesQuery = useJournalStories();
  const trendingQuery = useTrendingJournalStories();

  const featured = isUsableJournalStory(featuredQuery.data) ? featuredQuery.data : undefined;
  const stories = mergeJournalStories(storiesQuery.data);
  const trending = mergeJournalStories(trendingQuery.data);

  const editorialStories = stories.filter((story) => !story.is_featured);
  const highlightedStory = editorialStories[0];
  const listStories = editorialStories.slice(1);
  const hasContent = Boolean(featured || stories.length || trending.length);
  const isLoading = featuredQuery.isLoading || storiesQuery.isLoading || trendingQuery.isLoading;
  const featuredHref = buildJournalStoryHref(featured);
  const highlightedHref = buildJournalStoryHref(highlightedStory);
  const visibleTrending = trending.filter((story) => buildJournalStoryHref(story)).slice(0, 3);

  if (!hasContent && isLoading) {
    return (
      <div className="premium-page">
        <EcosystemNav />
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]" aria-label="Cargando journal">
          <div className="space-y-6">
            <div className="h-7 w-36 animate-pulse rounded-full bg-surface-container-high" />
            <div className="aspect-[16/10] animate-pulse rounded-[2rem] bg-surface-container" />
            <div className="space-y-3">
              <div className="h-5 w-48 animate-pulse rounded-full bg-surface-container-high" />
              <div className="h-14 w-full animate-pulse rounded-[1.6rem] bg-surface-container" />
              <div className="h-20 w-full animate-pulse rounded-[1.6rem] bg-surface-container-low" />
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-[1.8rem] bg-surface-container-low" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="premium-page">
      <EcosystemNav />

      {featured && (
        <section className="premium-hero p-5 md:p-7 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
            <div className="space-y-6">
              <div className="premium-chip w-fit">
                <Sparkles size={14} />
                Featured expedition
              </div>

              <div className="relative overflow-hidden rounded-[2rem] bg-surface-container-low shadow-[var(--shadow-forest)]">
                <img src={featured.cover_image} alt={featured.title} className="aspect-[16/10] w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                    <span className="premium-chip">{featured.category_label}</span>
                    <span className="premium-chip">{formatStoryDate(featured.published_at)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
                  <span className="section-kicker">Journal cover story</span>
                  <span className="premium-dot text-primary" />
                  <span>By {featured.author_name}</span>
                  <span>{featured.read_time_minutes} min read</span>
                </div>
                <h1 className="hero-title text-5xl text-on-surface md:text-7xl">{featured.title}</h1>
                <p className="max-w-3xl text-base text-on-surface-variant md:text-lg">{featured.summary}</p>
                <div className="flex flex-wrap items-center gap-3">
                  {featuredHref ? (
                    <Link to={featuredHref} className="inline-flex items-center gap-2 rounded-full px-5 py-3 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-[#442c00]" style={{ background: 'var(--cta-gradient)', boxShadow: 'var(--shadow-soft)' }}>
                      Read full relato
                      <ArrowRight size={15} />
                    </Link>
                  ) : null}
                  <div className="premium-chip">
                    <MapPin size={14} />
                    {featured.region_label}
                  </div>
                </div>
              </div>
            </div>

            <aside className="grid gap-4 content-start">
              <div className="editorial-card-tonal rounded-[1.8rem] p-6">
                <p className="section-kicker">The essence</p>
                <p className="mt-5 text-xl italic leading-relaxed text-on-surface">“{featured.featured_quote || featured.summary}”</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  ['Distance', `${featured.distance_km} km`],
                  ['Elevation gain', `${featured.elevation_m} m`],
                  ['Reading time', `${featured.read_time_minutes} min`],
                ].map(([label, value]) => (
                  <div key={label} className="editorial-metric rounded-[1.6rem] px-5 py-5">
                    <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
                    <p className="mt-2 font-headline text-3xl font-black tracking-tight text-on-surface">{value}</p>
                  </div>
                ))}
              </div>

              <div className="editorial-card-tonal rounded-[1.8rem] p-6">
                <div className="flex items-center gap-2 text-primary">
                  <Flame size={16} />
                  <p className="section-kicker text-primary">Trending now</p>
                </div>
                <div className="mt-5 space-y-4">
                  {visibleTrending.map((story, index) => (
                    <Link key={story.id} to={buildJournalStoryHref(story) ?? '/journal'} className="group flex gap-4">
                      <span className="font-headline text-4xl font-black text-outline-variant/45 transition-colors group-hover:text-primary">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <p className="font-headline text-lg font-black leading-tight text-on-surface transition-colors group-hover:text-primary">{story.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-on-surface-variant">{story.region_label}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      )}

      {highlightedStory && (
        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="editorial-card-tonal rounded-[2rem] p-6 md:p-8">
            <p className="section-kicker">Editorial dispatch</p>
            <h2 className="mt-4 font-headline text-4xl font-black uppercase leading-[0.94] tracking-tight text-on-surface md:text-5xl">{highlightedStory.title}</h2>
            <p className="mt-4 max-w-xl text-on-surface-variant">{highlightedStory.summary}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-on-surface-variant">
              <div className="premium-chip">{highlightedStory.category_label}</div>
              <div className="premium-chip">{highlightedStory.read_time_minutes} min</div>
              <div className="premium-chip">{highlightedStory.region_label}</div>
            </div>
            {highlightedHref ? (
              <Link to={highlightedHref} className="mt-8 inline-flex items-center gap-2 font-headline text-sm font-black uppercase tracking-[0.12em] text-primary">
                Open dispatch
                <ArrowRight size={15} />
              </Link>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-[2rem] bg-surface-container shadow-[var(--shadow-soft)]">
            <img src={highlightedStory.cover_image} alt={highlightedStory.title} className="aspect-[16/10] w-full object-cover" />
          </div>
        </section>
      )}

      {hasContent ? (
        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
          <div>
            <p className="section-kicker">Latest relatos</p>
            <h2 className="mt-3 font-headline text-3xl font-black uppercase tracking-tight text-on-surface md:text-4xl">Field notes with stronger rhythm</h2>
          </div>

          {listStories.map((story, index) => (
            <article key={story.id} className={`grid gap-6 ${index % 2 === 0 ? 'md:grid-cols-[0.92fr_1.08fr]' : 'md:grid-cols-[1.08fr_0.92fr]'}`}>
              <div className={index % 2 === 0 ? '' : 'md:order-2'}>
                <div className="overflow-hidden rounded-[1.8rem] bg-surface-container shadow-[var(--shadow-soft)]">
                  <img src={story.cover_image} alt={story.title} className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
                </div>
              </div>
              <div className="flex flex-col justify-center rounded-[1.8rem] bg-surface-container-low/70 p-6 md:p-7">
                <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                  <span className="premium-chip">{story.category_label}</span>
                  <span>{story.author_name}</span>
                  <span>{story.read_time_minutes} min</span>
                </div>
                <h3 className="mt-4 font-headline text-3xl font-black tracking-tight text-on-surface md:text-4xl">{story.title}</h3>
                <p className="mt-4 text-on-surface-variant">{story.summary}</p>
                <div className="mt-6 premium-divider" />
                <div className="mt-5 flex items-center justify-between gap-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">{story.region_label}</p>
                  <Link to={buildJournalStoryHref(story) ?? '/journal'} className="font-headline text-sm font-black uppercase tracking-[0.12em] text-primary">Read full relato</Link>
                </div>
              </div>
            </article>
          ))}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <section className="editorial-card-tonal rounded-[1.9rem] p-6 md:p-7">
              <p className="section-kicker">Reader picks</p>
              <div className="mt-5 space-y-5">
                {trending.filter((story) => buildJournalStoryHref(story)).map((story, index) => (
                  <Link key={story.id} to={buildJournalStoryHref(story) ?? '/journal'} className="group flex items-start gap-4">
                    <span className="font-headline text-4xl font-black text-outline-variant/45 transition-colors group-hover:text-primary">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="font-semibold text-on-surface transition-colors group-hover:text-primary">{story.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant">{story.region_label}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="editorial-card-tonal rounded-[1.9rem] p-6 md:p-7">
              <p className="section-kicker">Journal brief</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  ['Stories', `${stories.length}`],
                  ['Trending', `${trending.length}`],
                  ['Regions', `${new Set(stories.map((story) => story.region_label)).size}`],
                ].map(([label, value]) => (
                  <div key={label} className="editorial-metric rounded-[1.4rem] px-5 py-5">
                    <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
                    <p className="mt-2 font-headline text-3xl font-black tracking-tight text-primary">{value}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      ) : (
        <EmptyState
          title="El journal está vacío por ahora"
          description="No hay relatos publicados todavía. Vuelve al feed o explora otras superficies mientras llegan nuevas historias."
          action={{ label: 'Ir al inicio', onClick: () => navigate('/') }}
        />
      )}
    </div>
  );
}
