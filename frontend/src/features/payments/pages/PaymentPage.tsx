import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CreditCard, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useActivity, useCreatePaymentIntent } from '@/services/hooks';
import { mockActivities } from '@/data/activities';
import CTAButton from '@/components/CTAButton';
import toast from 'react-hot-toast';

/**
 * NOTE: This payment page uses a simulated card form.
 * In production, replace the MockCardForm with Stripe Elements:
 *
 * import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
 * import { loadStripe } from '@stripe/stripe-js';
 *
 * const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
 *
 * Wrap the form with:
 * <Elements stripe={stripePromise} options={{ clientSecret }}>
 *   <CardElement />
 * </Elements>
 */

type PaymentState = 'idle' | 'processing' | 'success' | 'error';

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function PaymentPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { data: apiActivity } = useActivity(activityId);
  const createPaymentIntent = useCreatePaymentIntent();

  // Fallback to mock data
  const activity = apiActivity ?? mockActivities.find((a) => a.id === Number(activityId)) ?? mockActivities[0];

  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const isFormValid = () => {
    const digits = cardNumber.replace(/\s/g, '');
    return digits.length === 16 && expiry.length === 5 && cvc.length >= 3 && cardName.trim().length > 0;
  };

  const handlePayment = async () => {
    if (!isFormValid()) return;

    setPaymentState('processing');
    setErrorMessage('');

    try {
      // Call backend to create payment intent
      await createPaymentIntent.mutateAsync({
        activityId: Number(activityId),
        amount: activity.price,
      });

      /**
       * In production with Stripe, you would:
       * 1. Get the clientSecret from createPaymentIntent response
       * 2. Call stripe.confirmCardPayment(clientSecret, { payment_method: { card: elements.getElement(CardElement) } })
       * 3. Handle the result
       */

      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setPaymentState('success');
      toast.success('Pago realizado exitosamente');
    } catch {
      setPaymentState('error');
      setErrorMessage('Error al procesar el pago. Verifica los datos de tu tarjeta e intenta nuevamente.');
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

        {/* Card Form (Simulated - replace with Stripe Elements in production) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-surface-container p-5 border border-outline-variant space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={18} className="text-primary" />
            <h3 className="font-display text-sm font-bold text-on-surface">
              Datos de la tarjeta
            </h3>
          </div>

          {/* Card Number */}
          <div>
            <label className="font-label text-xs text-muted block mb-1.5">
              Numero de tarjeta
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full rounded-xl bg-surface-container-high border border-outline-variant px-4 py-3 text-sm text-on-surface placeholder:text-muted font-body outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Name on Card */}
          <div>
            <label className="font-label text-xs text-muted block mb-1.5">
              Nombre en la tarjeta
            </label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="CATALINA REYES"
              className="w-full rounded-xl bg-surface-container-high border border-outline-variant px-4 py-3 text-sm text-on-surface placeholder:text-muted font-body outline-none focus:border-primary transition-colors uppercase"
            />
          </div>

          {/* Expiry & CVC */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-label text-xs text-muted block mb-1.5">
                Vencimiento
              </label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full rounded-xl bg-surface-container-high border border-outline-variant px-4 py-3 text-sm text-on-surface placeholder:text-muted font-body outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="font-label text-xs text-muted block mb-1.5">
                CVC
              </label>
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                maxLength={4}
                className="w-full rounded-xl bg-surface-container-high border border-outline-variant px-4 py-3 text-sm text-on-surface placeholder:text-muted font-body outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {paymentState === 'error' && errorMessage && (
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
            Pago seguro con cifrado SSL
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
          disabled={!isFormValid() || paymentState === 'processing'}
          onClick={handlePayment}
          icon={paymentState === 'processing' ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
        />
      </div>
    </div>
  );
}
