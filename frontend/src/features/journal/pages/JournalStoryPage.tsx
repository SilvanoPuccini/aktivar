import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CTAButton from '@/components/CTAButton';
import EcosystemNav from '@/components/EcosystemNav';
import EmptyState from '@/components/EmptyState';
import { useFeaturedJournalStory, useJournalStories, useTrendingJournalStories } from '@/services/hooks';
import { mergeJournalStories } from '../journalUtils';

export default function JournalStoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const storiesQuery = useJournalStories();
  const featuredQuery = useFeaturedJournalStory();
  const trendingQuery = useTrendingJournalStories();
  const stories = useMemo(
    () => mergeJournalStories(storiesQuery.data, featuredQuery.data ? [featuredQuery.data] : [], trendingQuery.data),
    [featuredQuery.data, storiesQuery.data, trendingQuery.data],
  );
  const story = useMemo(() => stories.find((item) => item.slug === slug), [stories, slug]);
  const isLoading = (storiesQuery.isLoading || featuredQuery.isLoading || trendingQuery.isLoading) && !story;

  if (isLoading) {
    return (
      <div className="space-y-8 pb-12">
        <EcosystemNav />
        <div className="flex min-h-[50vh] items-center justify-center gap-3 text-on-surface-variant">
          <Loader2 className="animate-spin text-primary" size={20} />
          <span>Cargando relato…</span>
        </div>
      </div>
    );
  }

  if (!story) {
    return <EmptyState title="Relato no encontrado" description="Este journal no está disponible." action={{ label: 'Volver', onClick: () => navigate('/journal') }} />;
  }

  return (
    <div className="space-y-8 pb-12">
      <EcosystemNav />
      <div className="overflow-hidden rounded-[2rem] bg-surface-container">
        {story.cover_image ? (
          <img src={story.cover_image} alt={story.title} className="h-[28rem] w-full object-cover" />
        ) : (
          <div className="flex h-[28rem] items-center justify-center bg-surface-container-low text-on-surface-variant">
            Imagen editorial no disponible.
          </div>
        )}
      </div>
      <div className="grid gap-10 lg:grid-cols-[1fr_0.34fr]">
        <article className="space-y-6">
          <p className="section-kicker">{story.category_label}</p>
          <h1 className="hero-title text-5xl text-on-surface md:text-7xl">{story.title}</h1>
          <p className="max-w-3xl text-lg text-on-surface-variant">{story.summary}</p>
          <div className="rounded-[1.8rem] bg-surface-container-low px-6 py-6 text-on-surface-variant leading-relaxed">
            {story.body || `${story.summary} Este circuito editorial abre una lectura más profunda del territorio, del ritmo humano y de cómo una expedición también se convierte en memoria compartida.`}
          </div>
        </article>
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="editorial-card rounded-[1.6rem] px-6 py-6">
            <p className="section-kicker">Author</p>
            <p className="mt-2 font-headline text-3xl font-black text-on-surface">{story.author_name}</p>
          </div>
          <div className="editorial-card rounded-[1.6rem] px-6 py-6">
            <p className="section-kicker">Reading time</p>
            <p className="mt-2 font-headline text-3xl font-black text-on-surface">{story.read_time_minutes} min</p>
          </div>
          <CTAButton label="Back to journal" variant="secondary" onClick={() => navigate('/journal')} fullWidth />
        </aside>
      </div>
    </div>
  );
}
