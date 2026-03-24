import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowRight,
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
  Sparkles,
  Camera,
  Info,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

import CategoryChip from '@/components/CategoryChip';
import { categories as fallbackCategories } from '@/data/categories';
import { useCategories, useCreateActivity, useUploadImage } from '@/services/hooks';
import { useAuthStore } from '@/stores/authStore';
import type { Difficulty } from '@/types/activity';

/* ------------------------------------------------------------------ */
/*  Form data shape                                                    */
/* ------------------------------------------------------------------ */
interface FormData {
  // Step 1
  categoryId: number | null;
  title: string;
  description: string;
  // Step 2
  date: string;
  startTime: string;
  endTime: string;
  locationName: string;
  meetingPoint: string;
  capacity: number;
  isFree: boolean;
  price: number;
  difficulty: Difficulty;
  // Step 3
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
  capacity: 20,
  isFree: true,
  price: 0,
  difficulty: 'moderate',
  coverImage: '',
  whatToBring: '',
  distanceKm: '',
};

/* ------------------------------------------------------------------ */
/*  Shared input classes                                                */
/* ------------------------------------------------------------------ */
const inputClasses =
  'w-full bg-surface-container-highest border-none focus:ring-1 focus:ring-primary/40 rounded-xl px-6 py-4 text-on-surface placeholder:text-on-surface/20 font-body outline-none transition-colors duration-200';

const labelClasses =
  'block font-label text-xs uppercase tracking-widest text-on-surface-variant';

/* ------------------------------------------------------------------ */
/*  Slide animation variants                                           */
/* ------------------------------------------------------------------ */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const difficultyOptions: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Fácil' },
  { value: 'moderate', label: 'Moderada' },
  { value: 'hard', label: 'Difícil' },
  { value: 'expert', label: 'Experto' },
];

/* Step headings configuration */
const stepHeadings: { prefix: string; accent: string; suffix?: string; subtitle: string }[] = [
  {
    prefix: 'Define the',
    accent: 'Adventure',
    subtitle: 'Set the stage for your next community expedition. Precision matters in the wild.',
  },
  {
    prefix: 'Set the',
    accent: 'Details',
    subtitle: 'When, where, and how. Every great adventure starts with a solid plan.',
  },
  {
    prefix: 'Final',
    accent: 'Touches',
    subtitle: 'Add visuals and extra info to make your activity stand out.',
  },
];

/* ================================================================== */
/*  CreateActivityPage                                                 */
/* ================================================================== */
export default function CreateActivityPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { data: apiCategories } = useCategories();
  const categories = apiCategories ?? fallbackCategories;
  const createMutation = useCreateActivity();
  const uploadMutation = useUploadImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  /* helpers */
  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const next = () => {
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, 2));
  };
  const prev = () => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const toIsoDateTime = (date: string, time: string): string | undefined => {
    if (!date || !time) return undefined;
    const localDate = new Date(`${date}T${time}:00`);
    if (Number.isNaN(localDate.getTime())) return undefined;
    return localDate.toISOString();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    update('coverImage', previewUrl);

    // Try to upload to server
    uploadMutation.mutate(file, {
      onSuccess: (data) => {
        update('coverImage', data.url);
        toast.success('Imagen subida');
      },
      onError: () => {
        // Keep local preview, user can still provide URL
        toast('Imagen guardada localmente', { icon: 'info' });
      },
    });
  };

  const handleCreate = () => {
    if (!isAuthenticated) {
      toast.error('Inicia sesión para crear actividades');
      navigate('/login');
      return;
    }

    if (!formData.categoryId || !formData.title.trim() || !formData.description.trim()) {
      toast.error('Completa título, categoría y descripción');
      setCurrentStep(0);
      return;
    }

    if (!formData.date || !formData.startTime || !formData.locationName.trim()) {
      toast.error('Completa fecha, hora de inicio y ubicación');
      setCurrentStep(1);
      return;
    }

    const startIso = toIsoDateTime(formData.date, formData.startTime);
    const endIso = toIsoDateTime(formData.date, formData.endTime);

    if (!startIso) {
      toast.error('La fecha/hora de inicio no es válida');
      setCurrentStep(1);
      return;
    }

    if (endIso && new Date(endIso) <= new Date(startIso)) {
      toast.error('La hora de fin debe ser posterior al inicio');
      setCurrentStep(1);
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.categoryId,
      cover_image: formData.coverImage,
      location_name: formData.locationName.trim(),
      meeting_point: formData.meetingPoint.trim(),
      start_datetime: startIso,
      end_datetime: endIso,
      capacity: formData.capacity,
      price: formData.isFree ? 0 : formData.price,
      difficulty: formData.difficulty,
      distance_km: formData.distanceKm ? parseFloat(formData.distanceKm) : null,
      what_to_bring: formData.whatToBring,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Actividad creada!');
        navigate('/');
      },
      onError: () => {
        toast.error('Error al crear la actividad');
      },
    });
  };

  const heading = stepHeadings[currentStep];

  /* ---------------------------------------------------------------- */
  /*  Step 1 — Define the Adventure                                    */
  /* ---------------------------------------------------------------- */
  const step1 = (
    <div className="space-y-10">
      {/* Title input */}
      <section className="space-y-4">
        <label className={labelClasses}>Título de la actividad</label>
        <input
          type="text"
          className={`${inputClasses} text-xl font-headline font-bold`}
          placeholder="Ej: Trekking al Cerro Manquehue"
          value={formData.title}
          onChange={(e) => update('title', e.target.value)}
        />
      </section>

      {/* Category chips */}
      <section className="space-y-4">
        <label className={labelClasses}>Tipo de actividad</label>
        <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              category={cat}
              selected={formData.categoryId === cat.id}
              onClick={() => update('categoryId', cat.id)}
            />
          ))}
        </div>
      </section>

      {/* Description */}
      <section className="space-y-4">
        <label className={labelClasses}>Descripción</label>
        <textarea
          rows={4}
          className={`${inputClasses} resize-none leading-relaxed`}
          placeholder="Describe el terreno, equipo necesario, y la vibra de la aventura..."
          value={formData.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </section>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Step 2 — Set the Details                                         */
  /* ---------------------------------------------------------------- */
  const step2 = (
    <div className="space-y-10">
      {/* Date & Time Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className={labelClasses}>Fecha</label>
          <div className="relative">
            <input
              type="date"
              className={`${inputClasses} font-label appearance-none`}
              value={formData.date}
              onChange={(e) => update('date', e.target.value)}
            />
            <Calendar size={20} className="absolute right-4 top-4 text-on-surface-variant pointer-events-none" />
          </div>
        </div>
        <div className="space-y-4">
          <label className={labelClasses}>Hora inicio</label>
          <div className="relative">
            <input
              type="time"
              className={`${inputClasses} font-label`}
              value={formData.startTime}
              onChange={(e) => update('startTime', e.target.value)}
            />
            <Clock size={20} className="absolute right-4 top-4 text-on-surface-variant pointer-events-none" />
          </div>
        </div>
      </section>

      {/* End time */}
      <section className="space-y-4">
        <label className={labelClasses}>Hora fin</label>
        <div className="relative">
          <input
            type="time"
            className={`${inputClasses} font-label`}
            value={formData.endTime}
            onChange={(e) => update('endTime', e.target.value)}
          />
          <Clock size={20} className="absolute right-4 top-4 text-on-surface-variant pointer-events-none" />
        </div>
      </section>

      {/* Map Picker Bento */}
      <section className="space-y-4">
        <label className={labelClasses}>Punto de encuentro</label>
        <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-surface-container-low group">
          {/* Map background image */}
          <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low to-surface-container opacity-80" />
            {/* Grid pattern to simulate topo map */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'linear-gradient(rgba(255,197,108,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,197,108,0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />

          {/* Pulsing location pin */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary/20 p-4 rounded-full animate-pulse">
              <div className="bg-primary p-3 rounded-full shadow-lg">
                <MapPin size={24} className="text-on-primary" />
              </div>
            </div>
          </div>

          {/* Search input overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="relative">
              <input
                type="text"
                className="w-full bg-surface-container/90 backdrop-blur-md border-none focus:ring-1 focus:ring-primary/40 rounded-xl px-4 py-3 text-sm font-body text-on-surface placeholder:text-on-surface/30"
                placeholder="Buscar trailhead o coordenada..."
                value={formData.locationName}
                onChange={(e) => update('locationName', e.target.value)}
              />
              <Search size={16} className="absolute right-3 top-3.5 text-on-surface-variant pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Meeting point text */}
      <section className="space-y-4">
        <label className={labelClasses}>Punto de encuentro (detalle)</label>
        <input
          type="text"
          className={inputClasses}
          placeholder="Ej: Entrada norte del parque"
          value={formData.meetingPoint}
          onChange={(e) => update('meetingPoint', e.target.value)}
        />
      </section>

      {/* Capacity & Pricing Bento */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Capacity Slider Card */}
        <div className="bg-surface-container p-6 rounded-2xl space-y-6">
          <div className="flex justify-between items-center">
            <label className={labelClasses}>
              <Users size={14} className="inline mr-1 -mt-0.5" />
              Capacidad
            </label>
            <span className="font-label text-primary font-bold">{formData.capacity} exploradores</span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            value={formData.capacity}
            onChange={(e) => update('capacity', Number(e.target.value))}
            className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-label text-on-surface-variant uppercase tracking-widest">
            <span>Solo</span>
            <span>Grupo grande</span>
          </div>
        </div>

        {/* Price Toggle Card */}
        <div className="bg-surface-container p-6 rounded-2xl flex flex-col justify-between">
          <label className={labelClasses}>
            <DollarSign size={14} className="inline mr-1 -mt-0.5" />
            Precio
          </label>
          <div className="flex p-1 bg-surface-container-highest rounded-xl mt-4">
            <button
              type="button"
              onClick={() => {
                update('isFree', true);
                update('price', 0);
              }}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                formData.isFree
                  ? 'bg-surface-container text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Gratis
            </button>
            <button
              type="button"
              onClick={() => update('isFree', false)}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                !formData.isFree
                  ? 'bg-surface-container text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              De pago
            </button>
          </div>

          <AnimatePresence>
            {!formData.isFree && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-4"
              >
                <input
                  type="number"
                  min={0}
                  className={`${inputClasses} text-sm`}
                  placeholder="Precio en CLP"
                  value={formData.price || ''}
                  onChange={(e) => update('price', Number(e.target.value))}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex items-center gap-2">
            <Info size={14} className="text-on-surface-variant shrink-0" />
            <p className="text-[10px] text-on-surface-variant font-body">Las actividades gratuitas mejoran tu ranking.</p>
          </div>
        </div>
      </section>

      {/* Difficulty */}
      <section className="space-y-4">
        <label className={labelClasses}>
          <Mountain size={14} className="inline mr-1 -mt-0.5" />
          Dificultad
        </label>
        <div className="flex flex-wrap gap-2">
          {difficultyOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update('difficulty', opt.value)}
              className={`px-5 py-3 rounded-full font-medium text-sm transition-all active:scale-95 ${
                formData.difficulty === opt.value
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-bright'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Step 3 — Final Touches                                           */
  /* ---------------------------------------------------------------- */
  const step3 = (
    <div className="space-y-10">
      {/* Photo Upload */}
      <section className="space-y-4">
        <label className={labelClasses}>Imagen de portada</label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {formData.coverImage ? (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden group">
            <img
              src={formData.coverImage}
              alt="preview"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 bg-surface/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="bg-surface-container-highest p-4 rounded-full">
                <Camera size={24} className="text-primary" />
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video md:aspect-[21/9] border-2 border-dashed border-outline-variant/30 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-surface-container transition-colors cursor-pointer group"
          >
            {uploadMutation.isPending ? (
              <div className="bg-surface-container-highest p-4 rounded-full">
                <Loader2 size={24} className="text-primary animate-spin" />
              </div>
            ) : (
              <div className="bg-surface-container-highest p-4 rounded-full group-hover:scale-110 transition-transform">
                <Camera size={24} className="text-primary" />
              </div>
            )}
            <p className="text-on-surface-variant text-sm font-medium">
              {uploadMutation.isPending ? 'Subiendo...' : 'Subir imagen de portada'}
            </p>
            <p className="text-[10px] font-label text-outline uppercase tracking-widest">Max 10MB &bull; JPG/PNG</p>
          </div>
        )}

        {/* Or paste URL */}
        <input
          type="url"
          className={inputClasses}
          placeholder="O pega una URL de imagen..."
          value={formData.coverImage.startsWith('blob:') ? '' : formData.coverImage}
          onChange={(e) => update('coverImage', e.target.value)}
        />
      </section>

      {/* Description (detailed) */}
      <section className="space-y-4">
        <label className={labelClasses}>
          <Backpack size={14} className="inline mr-1 -mt-0.5" />
          Qué llevar
        </label>
        <textarea
          rows={3}
          className={`${inputClasses} resize-none leading-relaxed`}
          placeholder="Ej: Agua, snacks, bloqueador solar, zapatillas de trekking..."
          value={formData.whatToBring}
          onChange={(e) => update('whatToBring', e.target.value)}
        />
      </section>

      {/* Distance */}
      <section className="space-y-4">
        <label className={labelClasses}>
          <Ruler size={14} className="inline mr-1 -mt-0.5" />
          Distancia (km) &mdash; opcional
        </label>
        <input
          type="number"
          min={0}
          step={0.1}
          className={inputClasses}
          placeholder="Ej: 12.5"
          value={formData.distanceKm}
          onChange={(e) => update('distanceKm', e.target.value)}
        />
      </section>
    </div>
  );

  const steps = [step1, step2, step3];

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div className="min-h-screen bg-surface text-on-surface pb-32">
      {/* Glass Header */}
      <header className="sticky top-0 w-full z-50 bg-[#11140f]/70 backdrop-blur-md flex justify-between items-center px-6 py-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => (currentStep > 0 ? prev() : navigate(-1))}
            className="p-2 hover:bg-surface-container-highest rounded-full transition-colors active:scale-95"
            aria-label="Cerrar"
          >
            <X size={20} className="text-on-surface" />
          </button>
          <h1 className="font-headline font-black text-2xl tracking-tighter text-on-surface">Aktivar</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label text-xs uppercase tracking-widest text-primary">
            Paso {String(currentStep + 1).padStart(2, '0')}/03
          </span>
        </div>
      </header>

      {/* Progress Bars */}
      <nav className="px-6 mt-4">
        <div className="flex gap-2 h-1 w-full max-w-2xl mx-auto">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-colors duration-300 ${
                i < currentStep
                  ? 'bg-secondary'
                  : i === currentStep
                    ? 'bg-primary'
                    : 'bg-surface-container-highest'
              }`}
            />
          ))}
        </div>
      </nav>

      {/* Form Body */}
      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Form Header */}
        <header className="mb-12">
          <h2 className="font-headline font-extrabold text-4xl md:text-5xl leading-tight tracking-tight mb-4">
            {heading.prefix}{' '}
            <span className="text-primary italic">{heading.accent}</span>
            {heading.suffix ? ` ${heading.suffix}` : ''}
          </h2>
          <p className="text-on-surface-variant text-base max-w-md">{heading.subtitle}</p>
        </header>

        {/* Animated Step Content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {steps[currentStep]}
          </motion.div>
        </AnimatePresence>

        {/* Footer CTA */}
        <footer className="pt-10 mt-10 flex items-center justify-between border-t border-outline-variant/10">
          <button
            type="button"
            className="text-on-surface-variant font-bold hover:text-on-surface transition-colors"
          >
            Save Draft
          </button>

          {currentStep < 2 ? (
            <button
              type="button"
              onClick={next}
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-black px-12 py-4 rounded-full active:scale-95 transition-all flex items-center gap-3"
              style={{ boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)' }}
            >
              Continuar
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-black px-12 py-4 rounded-full active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
              style={{ boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)' }}
            >
              {createMutation.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Plus size={20} />
              )}
              Crear Actividad
            </button>
          )}
        </footer>
      </main>

      {/* Floating Pro Tip Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-lg bg-surface-container-low/80 backdrop-blur-xl px-6 py-4 rounded-2xl border border-outline-variant/10 flex items-center gap-4 z-40"
        style={{ boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)' }}
      >
        <div className="h-10 w-10 rounded-full bg-secondary-container/30 flex items-center justify-center shrink-0">
          <Sparkles size={20} className="text-secondary" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-on-surface">Pro Tip</p>
          <p className="text-[10px] text-on-surface-variant font-body">
            Agregar una imagen de portada aumenta la participación en un 40%.
          </p>
        </div>
      </div>
    </div>
  );
}
