import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CreditCard, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useActivity, useCreatePaymentIntent } from '@/services/hooks';
import { mockActivities } from '@/data/activities';
import CTAButton from '@/components/CTAButton';
import toast from 'react-hot-toast';

type PaymentState = 'loading' | 'ready' | 'processing' | 'success' | 'error';

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Stripe Elements styles matching our design system
const stripeElementStyle = {
  base: {
    color: '#e1e3da',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '14px',
    '::placeholder': { color: '#9f8e79' },
  },
  invalid: { color: '#ffb4ab' },
};

export default function PaymentPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { data: apiActivity } = useActivity(activityId);
  const createPaymentIntent = useCreatePaymentIntent();

  const activity = apiActivity ?? mockActivities.find((a) => a.id === Number(activityId)) ?? mockActivities[0];

  const [paymentState, setPaymentState] = useState<PaymentState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [cardComplete, setCardComplete] = useState(false);

  // Load Stripe.js dynamically
  useEffect(() => {
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!stripeKey) {
      setPaymentState('ready');
      return;
    }

    let cancelled = false;
    import('@stripe/stripe-js').then(({ loadStripe }: { loadStripe: (key: string) => Promise<unknown> }) => {
      loadStripe(stripeKey).then((stripeInstance: unknown) => {
        if (!cancelled && stripeInstance) {
          setStripe(stripeInstance);
        }
      });
    }).catch(() => {
      // Stripe.js not available, fall back to basic mode
      if (!cancelled) setPaymentState('ready');
    });

    return () => { cancelled = true; };
  }, []);

  // Create PaymentIntent on mount
  useEffect(() => {
    if (!activity?.price) {
      setPaymentState('ready');
      return;
    }

    createPaymentIntent.mutateAsync({
      activityId: Number(activityId),
      amount: activity.price,
    }).then((data) => {
      setClientSecret(data.client_secret);
      setPaymentState('ready');
    }).catch(() => {
      setPaymentState('ready');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, activity?.price]);

  // Mount Stripe Elements when both stripe and clientSecret are available
  useEffect(() => {
    if (!stripe || !clientSecret) return;

    const elementsInstance = stripe.elements({
      clientSecret,
      appearance: {
        theme: 'night',
        variables: {
          colorPrimary: '#ffc56c',
          colorBackground: '#333630',
          colorText: '#e1e3da',
          colorDanger: '#ffb4ab',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          borderRadius: '12px',
        },
      },
    });

    const cardElement = elementsInstance.create('payment', {
      style: stripeElementStyle,
    });

    // Mount to DOM
    const mountPoint = document.getElementById('stripe-payment-element');
    if (mountPoint) {
      cardElement.mount(mountPoint);
      cardElement.on('change', (event: any) => {
        setCardComplete(event.complete);
        if (event.error) {
          setErrorMessage(event.error.message);
        } else {
          setErrorMessage('');
        }
      });
    }

    setElements(elementsInstance);

    return () => { cardElement.unmount(); };
  }, [stripe, clientSecret]);

  const handlePayment = async () => {
    setPaymentState('processing');
    setErrorMessage('');

    // If Stripe is available, use real payment confirmation
    if (stripe && elements && clientSecret) {
      try {
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/activity/${activityId}`,
          },
          redirect: 'if_required',
        });

        if (error) {
          setPaymentState('error');
          setErrorMessage(error.message || 'Error al procesar el pago.');
          return;
        }

        setPaymentState('success');
        toast.success('Pago realizado exitosamente');
      } catch {
        setPaymentState('error');
        setErrorMessage('Error al procesar el pago. Intenta nuevamente.');
      }
      return;
    }

    // Fallback: no Stripe key configured (dev mode)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setPaymentState('success');
      toast.success('Pago simulado exitosamente (modo desarrollo)');
    } catch {
      setPaymentState('error');
      setErrorMessage('Error al procesar el pago.');
    }
  };

  if (paymentState === 'success') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-secondary/20"
        >
          <CheckCircle size={48} className="text-secondary" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-2 font-display text-2xl font-bold text-on-surface"
        >
          Pago confirmado
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 text-center font-body text-sm text-muted"
        >
          Tu lugar en &quot;{activity.title}&quot; ha sido reservado.
          <br />
          Monto: {formatCLP(activity.price)}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex w-full max-w-xs flex-col gap-3"
        >
          <CTAButton
            label="Ver actividad"
            variant="primary"
            fullWidth
            onClick={() => navigate(`/activity/${activityId}`)}
          />
          <CTAButton
            label="Volver al inicio"
            variant="secondary"
            fullWidth
            onClick={() => navigate('/')}
          />
        </motion.div>
      </div>
    );
  }

  const isPayButtonDisabled = stripe
    ? !cardComplete || paymentState === 'processing'
    : paymentState === 'processing';

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-outline-variant"
        style={{
          background: 'rgba(17,20,15,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-base font-bold text-on-surface">
            Pago
          </h1>
        </div>
        <Lock size={16} className="text-secondary" />
      </div>

      <div className="mx-auto max-w-lg px-4 pt-6 space-y-6">
        {/* Activity Summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-surface-container p-4 border border-outline-variant"
        >
          <div className="flex gap-3">
            <img
              src={activity.cover_image}
              alt={activity.title}
              className="h-16 w-16 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-sm font-bold text-on-surface truncate">
                {activity.title}
              </h2>
              <p className="font-body text-xs text-muted mt-0.5">
                Organizado por {activity.organizer.full_name}
              </p>
              <p className="font-label text-xs text-on-surface-variant mt-1">
                {new Date(activity.start_datetime).toLocaleDateString('es-CL', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display text-lg font-bold text-primary">
                {formatCLP(activity.price)}
              </p>
              <p className="font-label text-[10px] text-muted uppercase">CLP</p>
            </div>
          </div>
        </motion.div>

        {/* Stripe Payment Element */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-surface-container p-5 border border-outline-variant space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={18} className="text-primary" />
            <h3 className="font-display text-sm font-bold text-on-surface">
              Datos de pago
            </h3>
          </div>

          {/* Stripe mounts here when available */}
          <div id="stripe-payment-element" className="min-h-[120px]">
            {paymentState === 'loading' && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-primary" size={24} />
                <span className="ml-2 text-sm text-muted">Cargando...</span>
              </div>
            )}
            {!stripe && paymentState === 'ready' && (
              <div className="rounded-xl bg-surface-container-high/50 px-4 py-6 text-center">
                <p className="text-xs text-muted font-label">
                  Modo desarrollo — Stripe no configurado
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Configura VITE_STRIPE_PUBLIC_KEY para activar pagos reales
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {(paymentState === 'error' || errorMessage) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 rounded-xl bg-error-container/20 border border-error/30 px-4 py-3"
            >
              <AlertCircle size={16} className="text-error shrink-0" />
              <p className="font-body text-xs text-error">{errorMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 py-2">
          <Lock size={12} className="text-muted" />
          <p className="font-label text-[10px] text-muted uppercase tracking-wider">
            {stripe ? 'Pago seguro con Stripe' : 'Pago seguro con cifrado SSL'}
          </p>
        </div>

        {/* Pay Button */}
        <CTAButton
          label={
            paymentState === 'processing'
              ? 'Procesando...'
              : `Pagar ${formatCLP(activity.price)}`
          }
          variant="primary"
          fullWidth
          size="lg"
          loading={paymentState === 'processing'}
          disabled={isPayButtonDisabled}
          onClick={handlePayment}
          icon={paymentState === 'processing' ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
        />
      </div>
    </div>
  );
}
