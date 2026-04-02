import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import CTAButton from '@/components/CTAButton';
import EcosystemNav from '@/components/EcosystemNav';
import { useCreateMarketplaceListing } from '@/services/hooks';
import type { MarketplaceListing } from '@/types/ecosystem';

export default function MarketplaceCreatePage() {
  const navigate = useNavigate();
  const createListing = useCreateMarketplaceListing();
  const [form, setForm] = useState<{
    title: string;
    category: MarketplaceListing['category'];
    subcategory: string;
    condition: MarketplaceListing['condition'];
    price: number;
    location_name: string;
    cover_image: string;
  }>({ title: '', category: 'camping', subcategory: '', condition: 'excellent', price: 0, location_name: '', cover_image: '' });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!form.title.trim() || !form.subcategory.trim() || !form.location_name.trim()) {
      toast.error('Completa título, tipo de gear y ubicación');
      return;
    }

    if (form.price <= 0) {
      toast.error('Ingresa un precio válido');
      return;
    }

    createListing.mutate(form, {
      onSuccess: () => {
        toast.success('Gear publicado');
        navigate('/marketplace');
      },
      onError: () => toast.error('No se pudo publicar el gear'),
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <EcosystemNav />
      <section className="editorial-card rounded-[1rem] px-6 py-8 md:px-8">
        <p className="section-kicker">Marketplace</p>
        <h1 className="hero-title text-4xl text-on-surface md:text-6xl">List your gear</h1>
        <form className="mt-8" onSubmit={(event) => { event.preventDefault(); handleSubmit(); }}>
          <div className="grid gap-4 md:grid-cols-2">
            <input className="editorial-input" placeholder="Title" value={form.title} onChange={(e) => set('title', e.target.value)} />
            <input className="editorial-input" placeholder="Subcategory" value={form.subcategory} onChange={(e) => set('subcategory', e.target.value)} />
            <select className="editorial-input" value={form.category} onChange={(e) => set('category', e.target.value as MarketplaceListing['category'])}>
              <option value="camping">Camping</option>
              <option value="climbing">Climbing</option>
              <option value="water_sports">Water sports</option>
              <option value="tech">Tech</option>
              <option value="packs">Packs</option>
            </select>
            <select className="editorial-input" value={form.condition} onChange={(e) => set('condition', e.target.value as MarketplaceListing['condition'])}>
              <option value="new">New / Unused</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good Condition</option>
            </select>
            <input className="editorial-input" type="number" placeholder="Price" value={form.price} onChange={(e) => set('price', Number(e.target.value))} />
            <input className="editorial-input" placeholder="Location" value={form.location_name} onChange={(e) => set('location_name', e.target.value)} />
            <input className="editorial-input md:col-span-2" placeholder="Cover image URL" value={form.cover_image} onChange={(e) => set('cover_image', e.target.value)} />
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <CTAButton label="Cancel" variant="secondary" onClick={() => navigate('/marketplace')} />
            <CTAButton label="Publish gear" type="submit" loading={createListing.isPending} />
          </div>
        </form>
      </section>
    </div>
  );
}
