import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Camera, Clock3, DollarSign, MapPin, Mountain, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import CategoryChip from '@/components/CategoryChip';
import CTAButton from '@/components/CTAButton';
import { preparePostAuthRedirect } from '@/lib/authRedirect';
import { useCategories, useCreateActivity, useUploadImage } from '@/services/hooks';
import { useAuthStore } from '@/stores/authStore';
import type { Difficulty } from '@/types/activity';

interface FormData {
  categoryId: number | null;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  locationName: string;
  meetingPoint: string;
  latitude: string;
  longitude: string;
  capacity: number;
  isFree: boolean;
  price: number;
  difficulty: Difficulty;
  coverImage: string;
  whatToBring: string;
  distanceKm: string;
}

const initialFormData: FormData = {
  categoryId: null,
  title: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  locationName: '',
  meetingPoint: '',
  latitude: '-41.1335',
  longitude: '-71.3103',
  capacity: 20,
  isFree: true,
  price: 0,
  difficulty: 'moderate',
  coverImage: '',
  whatToBring: '',
  distanceKm: '',
};

const difficultyOptions: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Fácil' },
  { value: 'moderate', label: 'Moderada' },
  { value: 'hard', label: 'Difícil' },
  { value: 'expert', label: 'Experto' },
];

export default function CreateActivityPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { data: categoriesData } = useCategories();
  const categories = categoriesData ?? [];
  const createMutation = useCreateActivity();
  const uploadMutation = useUploadImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialFormData);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const toIso = (date: string, time: string): string | undefined => {
    if (!date || !time) return undefined;
    const parsed = new Date(`${date}T${time}:00`);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  };

  const validateIdentityStep = () => {
    if (!form.categoryId || !form.title.trim() || !form.description.trim()) {
      toast.error('Completa la información principal');
      setStep(0);
      return false;
    }

    return true;
  };

  const validateRouteStep = () => {
    if (!form.date || !form.startTime || !form.locationName.trim()) {
      toast.error('Completa fecha, hora y ubicación');
      setStep(1);
      return false;
    }

    const startIso = toIso(form.date, form.startTime);
    if (!startIso) {
      toast.error('Fecha u hora inválidas');
      setStep(1);
      return false;
    }

    if (new Date(startIso).getTime() <= Date.now()) {
      toast.error('La actividad debe programarse en el futuro');
      setStep(1);
      return false;
    }

    if (form.endTime) {
      const endIso = toIso(form.date, form.endTime);
      if (!endIso) {
        toast.error('Fecha u hora inválidas');
        setStep(1);
        return false;
      }

      if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
        toast.error('La hora de fin debe ser posterior al inicio');
        setStep(1);
        return false;
      }
    }

    return true;
  };

  const validatePublicationStep = () => {
    if (!form.isFree && form.price <= 0) {
      toast.error('Ingresa un precio mayor a 0 para actividades pagas');
      setStep(2);
      return false;
    }

    return true;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    set('coverImage', preview);
    uploadMutation.mutate(file, {
      onSuccess: (data) => {
        set('coverImage', data.url);
        toast.success('Imagen subida');
      },
      onError: () => toast('Vista previa aplicada. No se pudo subir aún.', { icon: '🖼️' }),
    });
  };

  const next = () => {
    if (step === 0 && !validateIdentityStep()) return;
    if (step === 1 && !validateRouteStep()) return;
    setStep((current) => Math.min(current + 1, 2));
  };
  const prev = () => setStep((current) => Math.max(current - 1, 0));

  const handleSubmit = () => {
    if (!isAuthenticated) {
      toast.error('Inicia sesión para crear actividades');
      const returnPath = preparePostAuthRedirect(location.pathname, location.search, location.hash);
      navigate('/login', { state: { from: returnPath } });
      return;
    }

    if (!validateIdentityStep() || !validateRouteStep() || !validatePublicationStep()) return;

    const startIso = toIso(form.date, form.startTime);
    if (!startIso) {
      toast.error('Fecha u hora inválidas');
      setStep(1);
      return;
    }

    let endIso = toIso(form.date, form.endTime);
    if (!endIso) {
      const fallback = new Date(startIso);
      fallback.setHours(fallback.getHours() + 3);
      endIso = fallback.toISOString();
    }

    createMutation.mutate(
      {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.categoryId,
        cover_image: form.coverImage,
        location_name: form.locationName.trim(),
        latitude: parseFloat(form.latitude) || -41.1335,
        longitude: parseFloat(form.longitude) || -71.3103,
        meeting_point: form.meetingPoint.trim() || form.locationName.trim(),
        start_datetime: startIso,
        end_datetime: endIso,
        capacity: form.capacity,
        price: form.isFree ? 0 : form.price,
        difficulty: form.difficulty,
        distance_km: form.distanceKm ? parseFloat(form.distanceKm) : null,
        what_to_bring: form.whatToBring,
      },
      {
        onSuccess: () => {
          toast.success('Actividad creada');
          navigate('/');
        },
        onError: (error) => {
          const axiosError = error as AxiosError<{ detail?: string }>;
          toast.error(axiosError.response?.data?.detail ?? 'No se pudo crear la actividad');
        },
      },
    );
  };

  const steps = ['Identidad', 'Ruta', 'Publicación'];

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <section className="editorial-card rounded-[2.25rem] px-6 py-7 md:px-8 md:py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="section-kicker">Nueva actividad</p>
            <h1 className="hero-title text-4xl text-on-surface md:text-6xl">New activity</h1>
          </div>
          <span className="font-label text-[10px] uppercase tracking-[0.18em] text-primary">Paso {step + 1}/3</span>
        </div>
        <div className="mt-6 flex gap-2">
          {steps.map((label, index) => (
            <div key={label} className="flex-1 space-y-2">
              <div className={`h-1.5 rounded-full ${index <= step ? 'bg-primary-container' : 'bg-surface-container-highest'}`} />
              <p className={`font-label text-[10px] uppercase tracking-[0.16em] ${index === step ? 'text-on-surface' : 'text-on-surface-variant'}`}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {step === 0 && (
        <section className="editorial-card rounded-[2rem] px-6 py-6 md:px-8 md:py-8 space-y-6">
          <div>
            <label className="section-kicker">Cover expedition photo</label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative mt-3 flex min-h-64 w-full items-center justify-center overflow-hidden rounded-[1.75rem] border border-dashed border-outline-variant/30 bg-surface cursor-pointer"
            >
              {form.coverImage ? (
                <img src={form.coverImage} alt="preview" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                  <Camera size={26} />
                  <span className="font-label text-[10px] uppercase tracking-[0.18em]">Drop image or click to upload</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </button>
          </div>
          <div>
            <label className="section-kicker">Activity title</label>
            <input className="editorial-input mt-3" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g., Pacific Coast Road Trip" />
          </div>
          <div>
            <label className="section-kicker">Select terrain / category</label>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((category) => (
                <CategoryChip key={category.id} category={category} selected={form.categoryId === category.id} onClick={() => set('categoryId', category.id)} />
              ))}
            </div>
          </div>
          <div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-3">
                <span className="section-kicker flex items-center gap-2"><Calendar size={14} /> Expedition date</span>
                <input type="date" className="editorial-input font-label" value={form.date} onChange={(e) => set('date', e.target.value)} />
              </label>
              <label className="space-y-3">
                <span className="section-kicker flex items-center gap-2"><MapPin size={14} /> Starting base</span>
                <input className="editorial-input" value={form.locationName} onChange={(e) => set('locationName', e.target.value)} placeholder="Search coordinates..." />
              </label>
            </div>
          </div>
          <div className="rounded-[1.75rem] bg-surface px-5 py-5">
            <div className="flex items-center justify-between">
              <span className="section-kicker flex items-center gap-2"><Users size={14} /> Squad capacity</span>
              <div className="text-right">
                <p className="font-headline text-4xl font-black text-primary">{form.capacity}</p>
                <p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">spots</p>
              </div>
            </div>
            <input type="range" min={1} max={20} value={form.capacity} onChange={(e) => set('capacity', Number(e.target.value))} className="mt-5 w-full" />
          </div>
          <div>
            <label className="section-kicker">The brief / description</label>
            <textarea className="editorial-input mt-3 min-h-32 resize-none" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Tell the explorers what to expect..." />
          </div>
          <div className="rounded-[1.75rem] bg-surface px-5 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-headline text-xl font-black text-on-surface">Expedition cost</p>
                <p className="text-sm text-on-surface-variant">Is this a free community event or paid?</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-label text-[10px] uppercase tracking-[0.16em] ${form.isFree ? 'text-on-surface' : 'text-on-surface-variant'}`}>Free</span>
                <button
                  type="button"
                  onClick={() => {
                    if (form.isFree) {
                      set('isFree', false);
                    } else {
                      set('isFree', true);
                      set('price', 0);
                    }
                  }}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${form.isFree ? 'bg-surface-container-highest' : 'bg-primary'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-surface transition-transform ${form.isFree ? 'translate-x-1' : 'translate-x-8'}`} />
                </button>
                <span className={`font-label text-[10px] uppercase tracking-[0.16em] ${!form.isFree ? 'text-primary' : 'text-on-surface-variant'}`}>Paid</span>
              </div>
            </div>
            {!form.isFree && (
              <input
                type="number"
                className="editorial-input mt-4"
                value={form.price}
                onChange={(e) => set('price', Number(e.target.value))}
                placeholder="Price per person"
              />
            )}
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="editorial-card rounded-[2rem] px-6 py-6 md:px-8 md:py-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-3"><span className="section-kicker flex items-center gap-2"><Calendar size={14} /> Fecha</span><input type="date" className="editorial-input font-label" value={form.date} onChange={(e) => set('date', e.target.value)} /></label>
            <label className="space-y-3"><span className="section-kicker flex items-center gap-2"><Clock3 size={14} /> Inicio</span><input type="time" className="editorial-input font-label" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} /></label>
            <label className="space-y-3"><span className="section-kicker flex items-center gap-2"><Clock3 size={14} /> Fin</span><input type="time" className="editorial-input font-label" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} /></label>
          </div>
          <label className="space-y-3 block"><span className="section-kicker flex items-center gap-2"><MapPin size={14} /> Ubicación</span><input className="editorial-input" value={form.locationName} onChange={(e) => set('locationName', e.target.value)} placeholder="Circuito Chico, Bariloche" /></label>
          <label className="space-y-3 block"><span className="section-kicker">Punto de encuentro</span><input className="editorial-input" value={form.meetingPoint} onChange={(e) => set('meetingPoint', e.target.value)} placeholder="Entrada norte / refugio / parking" /></label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-3 block"><span className="section-kicker">Latitud</span><input className="editorial-input font-label" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} /></label>
            <label className="space-y-3 block"><span className="section-kicker">Longitud</span><input className="editorial-input font-label" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} /></label>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="editorial-card rounded-[2rem] px-6 py-6 md:px-8 md:py-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-[1.75rem] bg-surface cursor-pointer">
              {form.coverImage ? <img src={form.coverImage} alt="preview" className="absolute inset-0 h-full w-full object-cover" /> : <div className="flex flex-col items-center gap-3 text-on-surface-variant"><Camera size={26} /><span className="font-label text-[10px] uppercase tracking-[0.18em]">Subir portada</span></div>}
              <div className="absolute bottom-4 right-4 rounded-full bg-surface/80 px-4 py-2 font-label text-[10px] uppercase tracking-[0.16em] text-on-surface backdrop-blur-sm">Cambiar imagen</div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </button>
            <div className="space-y-5">
              <label className="space-y-3 block"><span className="section-kicker flex items-center gap-2"><Mountain size={14} /> Dificultad</span><div className="flex flex-wrap gap-2">{difficultyOptions.map((option) => <button key={option.value} type="button" onClick={() => set('difficulty', option.value)} className={`rounded-full px-4 py-3 font-label text-[10px] uppercase tracking-[0.16em] ${form.difficulty === option.value ? 'bg-primary text-[#442c00]' : 'bg-surface text-on-surface-variant'}`}>{option.label}</button>)}</div></label>
              <label className="space-y-3 block"><span className="section-kicker">Distancia estimada</span><input className="editorial-input" value={form.distanceKm} onChange={(e) => set('distanceKm', e.target.value)} placeholder="12.5" /></label>
              <label className="space-y-3 block"><span className="section-kicker">Qué llevar</span><textarea className="editorial-input min-h-32 resize-none" value={form.whatToBring} onChange={(e) => set('whatToBring', e.target.value)} placeholder="Agua, rompeviento, linterna, snack, documento" /></label>
              <div className="rounded-[1.5rem] bg-surface px-5 py-5 space-y-4">
                <div className="flex items-center justify-between"><span className="section-kicker flex items-center gap-2"><DollarSign size={14} /> Precio</span><span className="font-headline text-3xl font-black text-primary">{form.isFree ? 'Gratis' : `$${form.price}`}</span></div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { set('isFree', true); set('price', 0); }} className={`flex-1 rounded-full px-4 py-3 font-label text-[10px] uppercase tracking-[0.16em] ${form.isFree ? 'bg-primary text-[#442c00]' : 'bg-surface-container-high text-on-surface-variant'}`}>Gratis</button>
                  <button type="button" onClick={() => set('isFree', false)} className={`flex-1 rounded-full px-4 py-3 font-label text-[10px] uppercase tracking-[0.16em] ${!form.isFree ? 'bg-primary text-[#442c00]' : 'bg-surface-container-high text-on-surface-variant'}`}>Pago</button>
                </div>
                {!form.isFree && <input type="number" className="editorial-input" value={form.price} onChange={(e) => set('price', Number(e.target.value))} placeholder="Precio por persona" />}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="flex items-center justify-between gap-3">
        <CTAButton label="Anterior" variant="secondary" onClick={prev} disabled={step === 0} />
        {step < 2 ? <CTAButton label={step === 0 ? 'Next expedition step' : 'Siguiente'} onClick={next} /> : <CTAButton label="Publicar actividad" loading={createMutation.isPending} onClick={handleSubmit} />}
      </div>
    </div>
  );
}
