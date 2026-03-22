import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  ImageIcon,
  MapPin,
  Clock,
  Calendar,
  Users,
  DollarSign,
  Mountain,
  Backpack,
  Ruler,
  Upload,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import CTAButton from '@/components/CTAButton';
import CategoryChip from '@/components/CategoryChip';
import ProgressDots from '@/components/ProgressDots';
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
  'w-full bg-surface-container border border-[#514533] rounded-xl px-4 py-3 text-on-surface placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-200 font-body';

const labelClasses =
  'block font-label text-xs uppercase tracking-wider text-muted mb-2';

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

    const payload = {
      title: formData.title,
      description: formData.description,
      category: formData.categoryId,
      cover_image: formData.coverImage,
      location_name: formData.locationName,
      meeting_point: formData.meetingPoint,
      start_datetime: formData.date && formData.startTime
        ? `${formData.date}T${formData.startTime}:00Z`
        : undefined,
      end_datetime: formData.date && formData.endTime
        ? `${formData.date}T${formData.endTime}:00Z`
        : undefined,
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

  const selectedCategory = categories.find((c: { id: number }) => c.id === formData.categoryId);

  /* ---------------------------------------------------------------- */
  /*  Step 1 — ¿Qué actividad?                                        */
  /* ---------------------------------------------------------------- */
  const step1 = (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-on-surface">
        ¿Qué actividad?
      </h2>

      {/* Category selection */}
      <div>
        <label className={labelClasses}>Categoría</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              category={cat}
              selected={formData.categoryId === cat.id}
              onClick={() => update('categoryId', cat.id)}
            />
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className={labelClasses}>Título</label>
        <input
          type="text"
          className={inputClasses}
          placeholder="Ej: Trekking al Cerro Manquehue"
          value={formData.title}
          onChange={(e) => update('title', e.target.value)}
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelClasses}>Descripción</label>
        <textarea
          rows={4}
          className={`${inputClasses} resize-none`}
          placeholder="Describe la actividad, qué se hará, nivel requerido..."
          value={formData.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </div>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Step 2 — ¿Cuándo y dónde?                                       */
  /* ---------------------------------------------------------------- */
  const step2 = (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-on-surface">
        ¿Cuándo y dónde?
      </h2>

      {/* Date */}
      <div>
        <label className={labelClasses}>
          <Calendar size={14} className="inline mr-1 -mt-0.5" />
          Fecha
        </label>
        <input
          type="date"
          className={inputClasses}
          value={formData.date}
          onChange={(e) => update('date', e.target.value)}
        />
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>
            <Clock size={14} className="inline mr-1 -mt-0.5" />
            Hora inicio
          </label>
          <input
            type="time"
            className={inputClasses}
            value={formData.startTime}
            onChange={(e) => update('startTime', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClasses}>
            <Clock size={14} className="inline mr-1 -mt-0.5" />
            Hora fin
          </label>
          <input
            type="time"
            className={inputClasses}
            value={formData.endTime}
            onChange={(e) => update('endTime', e.target.value)}
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className={labelClasses}>
          <MapPin size={14} className="inline mr-1 -mt-0.5" />
          Ubicación
        </label>
        <input
          type="text"
          className={inputClasses}
          placeholder="Ej: Cerro Manquehue, Santiago"
          value={formData.locationName}
          onChange={(e) => update('locationName', e.target.value)}
        />
      </div>

      {/* Meeting point */}
      <div>
        <label className={labelClasses}>Punto de encuentro</label>
        <input
          type="text"
          className={inputClasses}
          placeholder="Ej: Entrada norte del parque"
          value={formData.meetingPoint}
          onChange={(e) => update('meetingPoint', e.target.value)}
        />
      </div>

      {/* Capacity slider */}
      <div>
        <label className={labelClasses}>
          <Users size={14} className="inline mr-1 -mt-0.5" />
          Capacidad: <span className="text-primary font-semibold">{formData.capacity}</span>
        </label>
        <input
          type="range"
          min={8}
          max={50}
          value={formData.capacity}
          onChange={(e) => update('capacity', Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>8</span>
          <span>50</span>
        </div>
      </div>

      {/* Price toggle */}
      <div>
        <label className={labelClasses}>
          <DollarSign size={14} className="inline mr-1 -mt-0.5" />
          Precio
        </label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => {
              update('isFree', true);
              update('price', 0);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-label tracking-wider transition-colors duration-200 ${
              formData.isFree
                ? 'bg-secondary text-surface font-semibold'
                : 'bg-surface-container text-muted border border-[#514533]'
            }`}
          >
            Gratis
          </button>
          <button
            type="button"
            onClick={() => update('isFree', false)}
            className={`px-4 py-2 rounded-xl text-sm font-label tracking-wider transition-colors duration-200 ${
              !formData.isFree
                ? 'bg-primary text-[#442c00] font-semibold'
                : 'bg-surface-container text-muted border border-[#514533]'
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
              className="overflow-hidden"
            >
              <input
                type="number"
                min={0}
                className={inputClasses}
                placeholder="Precio en CLP"
                value={formData.price || ''}
                onChange={(e) => update('price', Number(e.target.value))}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Difficulty */}
      <div>
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
              className={`px-4 py-2 rounded-xl text-sm font-label tracking-wider transition-colors duration-200 ${
                formData.difficulty === opt.value
                  ? 'bg-primary text-[#442c00] font-semibold'
                  : 'bg-surface-container text-muted border border-[#514533]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Step 3 — Detalles finales                                       */
  /* ---------------------------------------------------------------- */
  const step3 = (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-on-surface">
        Detalles finales
      </h2>

      {/* Cover image upload */}
      <div>
        <label className={labelClasses}>
          <ImageIcon size={14} className="inline mr-1 -mt-0.5" />
          Imagen de portada
        </label>

        {/* Upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#514533] bg-surface-container px-4 py-6 text-muted hover:border-primary hover:text-on-surface transition-colors"
          >
            {uploadMutation.isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Upload size={20} />
            )}
            <span className="font-label text-sm">
              {uploadMutation.isPending ? 'Subiendo...' : 'Subir imagen'}
            </span>
          </button>

          {/* Or paste URL */}
          <input
            type="url"
            className={inputClasses}
            placeholder="O pega una URL de imagen..."
            value={formData.coverImage.startsWith('blob:') ? '' : formData.coverImage}
            onChange={(e) => update('coverImage', e.target.value)}
          />
        </div>
      </div>

      {/* What to bring */}
      <div>
        <label className={labelClasses}>
          <Backpack size={14} className="inline mr-1 -mt-0.5" />
          Qué llevar
        </label>
        <textarea
          rows={3}
          className={`${inputClasses} resize-none`}
          placeholder="Ej: Agua, snacks, bloqueador solar, zapatillas de trekking..."
          value={formData.whatToBring}
          onChange={(e) => update('whatToBring', e.target.value)}
        />
      </div>

      {/* Distance */}
      <div>
        <label className={labelClasses}>
          <Ruler size={14} className="inline mr-1 -mt-0.5" />
          Distancia (km) — opcional
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
      </div>

      {/* Preview card */}
      <div>
        <label className={labelClasses}>Vista previa</label>
        <div className="rounded-2xl overflow-hidden border border-[#514533] bg-surface-container">
          {/* Cover */}
          <div className="h-40 bg-surface-container-highest flex items-center justify-center relative overflow-hidden">
            {formData.coverImage ? (
              <img
                src={formData.coverImage}
                alt="preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon size={48} className="text-muted/40" />
            )}
            {selectedCategory && (
              <span className="absolute top-3 left-3 bg-surface/80 backdrop-blur-sm text-xs font-label px-2.5 py-1 rounded-full text-on-surface">
                {selectedCategory.name}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="p-4 space-y-2">
            <h3 className="font-display font-bold text-lg text-on-surface leading-tight">
              {formData.title || 'Título de la actividad'}
            </h3>

            <p className="text-sm text-on-surface-variant line-clamp-2">
              {formData.description || 'Descripción de la actividad...'}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted pt-1">
              {formData.date && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {formData.date}
                </span>
              )}
              {formData.startTime && (
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {formData.startTime}
                  {formData.endTime ? ` - ${formData.endTime}` : ''}
                </span>
              )}
              {formData.locationName && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} /> {formData.locationName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted pt-1">
              <span className="flex items-center gap-1">
                <Users size={12} /> {formData.capacity} cupos
              </span>
              <span>
                {formData.isFree
                  ? 'Gratis'
                  : `$${formData.price.toLocaleString('es-CL')}`}
              </span>
              <span className="capitalize">{formData.difficulty}</span>
              {formData.distanceKm && <span>{formData.distanceKm} km</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const steps = [step1, step2, step3];

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-[#514533]/30 px-4 py-4">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-3">
          <div className="flex items-center w-full">
            {currentStep > 0 && (
              <button
                onClick={prev}
                className="text-muted hover:text-on-surface transition-colors"
                aria-label="Volver"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="font-display font-bold text-lg text-on-surface mx-auto">
              Crear actividad
            </h1>
            {/* Spacer to center title */}
            {currentStep > 0 && <div className="w-5" />}
          </div>

          <ProgressDots
            steps={3}
            currentStep={currentStep}
            labels={['Actividad', 'Detalles', 'Final']}
          />
        </div>
      </header>

      {/* Form body */}
      <main className="max-w-lg mx-auto px-4 pt-6">
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
      </main>

      {/* Footer buttons */}
      <footer className="fixed bottom-0 inset-x-0 bg-surface/90 backdrop-blur-md border-t border-[#514533]/30 px-4 py-4 z-30">
        <div className="max-w-lg mx-auto flex gap-3">
          {currentStep > 0 && (
            <CTAButton
              label="Anterior"
              variant="secondary"
              onClick={prev}
              icon={<ArrowLeft size={16} />}
            />
          )}

          <div className="flex-1">
            {currentStep < 2 ? (
              <CTAButton
                label="Siguiente"
                onClick={next}
                fullWidth
                icon={<ArrowRight size={16} />}
              />
            ) : (
              <CTAButton
                label="Crear Actividad"
                onClick={handleCreate}
                loading={createMutation.isPending}
                fullWidth
                icon={<Plus size={16} />}
              />
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
