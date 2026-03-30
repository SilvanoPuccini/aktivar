import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  MapPin,
  Clock,
  Calendar,
  Users,
  DollarSign,
  Mountain,
  Backpack,
  Ruler,
  Loader2,
  Camera,
} from 'lucide-react';
import toast from 'react-hot-toast';

import CategoryChip from '@/components/CategoryChip';
import { categories as fallbackCategories } from '@/data/categories';
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

const inputCls =
  'w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-on-surface text-sm placeholder:text-muted outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors';

const labelCls = 'block text-xs font-label font-bold uppercase tracking-wider text-on-surface-variant mb-2';

const difficultyOptions: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Fácil' },
  { value: 'moderate', label: 'Moderada' },
  { value: 'hard', label: 'Difícil' },
  { value: 'expert', label: 'Experto' },
];

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
};

export default function CreateActivityPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { data: apiCategories } = useCategories();
  const categories = apiCategories ?? fallbackCategories;
  const createMutation = useCreateActivity();
  const uploadMutation = useUploadImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<FormData>(initialFormData);

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const next = () => { setDir(1); setStep((s) => Math.min(s + 1, 2)); };
  const prev = () => { setDir(-1); setStep((s) => Math.max(s - 1, 0)); };

  const toIso = (date: string, time: string): string | undefined => {
    if (!date || !time) return undefined;
    const d = new Date(`${date}T${time}:00`);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    set('coverImage', preview);
    uploadMutation.mutate(file, {
      onSuccess: (data) => { set('coverImage', data.url); toast.success('Imagen subida'); },
      onError: () => { toast('Imagen guardada localmente', { icon: 'info' }); },
    });
  };

  const handleCreate = () => {
    if (!isAuthenticated) { toast.error('Inicia sesión para crear'); navigate('/login'); return; }
    if (!form.categoryId || !form.title.trim() || !form.description.trim()) {
      toast.error('Completa título, categoría y descripción'); setStep(0); return;
    }
    if (!form.date || !form.startTime || !form.locationName.trim()) {
      toast.error('Completa fecha, hora y ubicación'); setStep(1); return;
    }

    const startIso = toIso(form.date, form.startTime);
    if (!startIso) { toast.error('Fecha/hora inválida'); setStep(1); return; }

    // If no end time, default to start + 3 hours
    let endIso = toIso(form.date, form.endTime);
    if (!endIso) {
      const startDate = new Date(startIso);
      startDate.setHours(startDate.getHours() + 3);
      endIso = startDate.toISOString();
    }

    if (new Date(endIso) <= new Date(startIso)) {
      toast.error('La hora de fin debe ser posterior al inicio'); setStep(1); return;
    }

    createMutation.mutate({
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
    }, {
      onSuccess: () => { toast.success('Actividad creada!'); navigate('/'); },
      onError: () => { toast.error('Error al crear la actividad'); },
    });
  };

  const stepTitles = ['Información básica', 'Detalles del evento', 'Imagen y extras'];

  /* ── Steps ── */
  const step1 = (
    <div className="space-y-6">
      <div>
        <label className={labelCls}>Título</label>
        <input type="text" className={inputCls} placeholder="Ej: Trekking al Cerro Manquehue"
          value={form.title} onChange={(e) => set('title', e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Categoría</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <CategoryChip key={cat.id} category={cat} selected={form.categoryId === cat.id}
              onClick={() => set('categoryId', cat.id)} />
          ))}
        </div>
      </div>
      <div>
        <label className={labelCls}>Descripción</label>
        <textarea rows={4} className={`${inputCls} resize-none`}
          placeholder="Describe la aventura..." value={form.description}
          onChange={(e) => set('description', e.target.value)} />
      </div>
    </div>
  );

  const step2 = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}><Calendar size={12} className="inline mr-1" />Fecha</label>
          <input type="date" className={`${inputCls} font-label`} value={form.date}
            onChange={(e) => set('date', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}><Clock size={12} className="inline mr-1" />Hora inicio</label>
          <input type="time" className={`${inputCls} font-label`} value={form.startTime}
            onChange={(e) => set('startTime', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}><Clock size={12} className="inline mr-1" />Hora fin</label>
          <input type="time" className={`${inputCls} font-label`} value={form.endTime}
            onChange={(e) => set('endTime', e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelCls}><MapPin size={12} className="inline mr-1" />Ubicación</label>
        <input type="text" className={inputCls} placeholder="Ej: Circuito Chico, Bariloche"
          value={form.locationName} onChange={(e) => set('locationName', e.target.value)} />
      </div>

      <div>
        <label className={labelCls}>Punto de encuentro</label>
        <input type="text" className={inputCls} placeholder="Ej: Entrada norte del parque"
          value={form.meetingPoint} onChange={(e) => set('meetingPoint', e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Latitud</label>
          <input type="text" className={inputCls} placeholder="-41.1335"
            value={form.latitude} onChange={(e) => set('latitude', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Longitud</label>
          <input type="text" className={inputCls} placeholder="-71.3103"
            value={form.longitude} onChange={(e) => set('longitude', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}><Users size={12} className="inline mr-1" />Capacidad: {form.capacity}</label>
          <input type="range" min={1} max={50} value={form.capacity}
            onChange={(e) => set('capacity', Number(e.target.value))}
            className="w-full h-1 bg-surface-container-highest rounded-full appearance-none cursor-pointer mt-2" />
        </div>
        <div>
          <label className={labelCls}><DollarSign size={12} className="inline mr-1" />Precio</label>
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={() => { set('isFree', true); set('price', 0); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${form.isFree ? 'bg-primary text-on-primary' : 'bg-surface-container text-muted'}`}>
              Gratis
            </button>
            <button type="button" onClick={() => set('isFree', false)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${!form.isFree ? 'bg-primary text-on-primary' : 'bg-surface-container text-muted'}`}>
              Pago
            </button>
          </div>
          {!form.isFree && (
            <input type="number" min={0} className={`${inputCls} mt-2`} placeholder="Precio en CLP"
              value={form.price || ''} onChange={(e) => set('price', Number(e.target.value))} />
          )}
        </div>
      </div>

      <div>
        <label className={labelCls}><Mountain size={12} className="inline mr-1" />Dificultad</label>
        <div className="flex flex-wrap gap-2">
          {difficultyOptions.map((opt) => (
            <button key={opt.value} type="button" onClick={() => set('difficulty', opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                form.difficulty === opt.value
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const step3 = (
    <div className="space-y-6">
      <div>
        <label className={labelCls}>Imagen de portada</label>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        {form.coverImage ? (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-outline-variant/10 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}>
            <img src={form.coverImage} alt="preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={24} className="text-white" />
            </div>
          </div>
        ) : (
          <div onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video border-2 border-dashed border-outline-variant/20 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-surface-container/50 transition-colors cursor-pointer">
            {uploadMutation.isPending
              ? <Loader2 size={24} className="text-primary animate-spin" />
              : <Camera size={24} className="text-muted" />}
            <p className="text-sm text-muted">{uploadMutation.isPending ? 'Subiendo...' : 'Subir imagen'}</p>
          </div>
        )}
        <input type="url" className={`${inputCls} mt-3`} placeholder="O pega una URL de imagen..."
          value={form.coverImage.startsWith('blob:') ? '' : form.coverImage}
          onChange={(e) => set('coverImage', e.target.value)} />
      </div>

      <div>
        <label className={labelCls}><Backpack size={12} className="inline mr-1" />Qué llevar</label>
        <textarea rows={3} className={`${inputCls} resize-none`}
          placeholder="Ej: Agua, snacks, bloqueador solar..."
          value={form.whatToBring} onChange={(e) => set('whatToBring', e.target.value)} />
      </div>

      <div>
        <label className={labelCls}><Ruler size={12} className="inline mr-1" />Distancia (km) — opcional</label>
        <input type="number" min={0} step={0.1} className={`${inputCls} max-w-[200px]`}
          placeholder="Ej: 12.5" value={form.distanceKm}
          onChange={(e) => set('distanceKm', e.target.value)} />
      </div>
    </div>
  );

  const steps = [step1, step2, step3];

  return (
    <div className="bg-surface min-h-[80vh]">
      <div className="max-w-2xl mx-auto px-6 md:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => (step > 0 ? prev() : navigate(-1))}
            className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer text-sm">
            <ArrowLeft size={16} />
            {step > 0 ? 'Atrás' : 'Cancelar'}
          </button>
          <span className="font-label text-xs text-muted tracking-wider">
            PASO {step + 1} DE 3
          </span>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${
              i <= step ? 'bg-primary' : 'bg-surface-container-highest'
            }`} />
          ))}
        </div>
        <h1 className="font-headline text-2xl font-bold text-on-surface mb-8">
          {stepTitles[step]}
        </h1>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
            {steps[step]}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-outline-variant/10">
          {step < 2 ? (
            <button type="button" onClick={next}
              className="flex items-center gap-2 px-8 py-3 rounded-lg gradient-cta text-on-primary font-bold text-sm cursor-pointer">
              Continuar <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={handleCreate} disabled={createMutation.isPending}
              className="flex items-center gap-2 px-8 py-3 rounded-lg gradient-cta text-on-primary font-bold text-sm cursor-pointer disabled:opacity-50">
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Crear Actividad
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
