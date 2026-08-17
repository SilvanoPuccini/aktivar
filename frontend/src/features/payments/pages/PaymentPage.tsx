import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import CTAButton from '@/components/CTAButton';
import { useActivity, useCreatePaymentIntent, useJoinActivity } from '@/services/hooks';

type PaymentState = 'loading' | 'ready' | 'processing' | 'success' | 'error';

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);
}

export default function PaymentPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { data: activity } = useActivity(activityId);
  const createPaymentIntent = useCreatePaymentIntent();
  const joinActivity = useJoinActivity();
  const [paymentState, setPaymentState] = useState<PaymentState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripe, setStripe] = useState<import('@stripe/stripe-js').Stripe | null>(null);
  const [elements, setElements] = useState<import('@stripe/stripe-js').StripeElements | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  useEffect(() => {
    const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!key) { setPaymentState('ready'); return; }
    let cancelled = false;
    import('@stripe/stripe-js').then(({ loadStripe }) => loadStripe(key)).then((instance) => { if (!cancelled && instance) setStripe(instance); }).catch(() => setPaymentState('ready'));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activity?.price) { setPaymentState('ready'); return; }
    createPaymentIntent.mutateAsync({ activityId: Number(activityId), amount: activity.price }).then((data) => { setClientSecret(data.client_secret); setPaymentState('ready'); }).catch(() => setPaymentState('ready'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, activity?.price]);

  useEffect(() => {
    if (!stripe || !clientSecret) return;
    const elementsInstance = stripe.elements({ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#ffc56c', colorBackground: '#333630', colorText: '#e1e3da', borderRadius: '18px' } } });
    const paymentElement = elementsInstance.create('payment');
    const mountPoint = document.getElementById('stripe-payment-element');
    if (mountPoint) {
      paymentElement.mount(mountPoint);
      paymentElement.on('change', (event: import('@stripe/stripe-js').StripeElementChangeEvent) => { setCardComplete(event.complete); setErrorMessage(event.error?.message ?? ''); });
    }
    setElements(elementsInstance);
    return () => paymentElement.unmount();
  }, [stripe, clientSecret]);

  if (!activity) return <div className="flex min-h-screen items-center justify-center">Cargando pago…</div>;

  const confirmJoinAfterPayment = async () => {
    try {
      await joinActivity.mutateAsync(Number(activityId));
    } catch {
      // Payment already succeeded — don't strand the user on a broken screen.
      // Surface a warning so they know to double check / contact support if their spot isn't confirmed.
      toast.error('Pago confirmado, pero hubo un problema al reservar tu lugar. Contáctanos si no ves tu confirmación.');
    }
  };

  const handlePayment = async () => {
    setPaymentState('processing');
    setErrorMessage('');
    if (stripe && elements && clientSecret) {
      const { error } = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${window.location.origin}/activity/${activityId}` }, redirect: 'if_required' });
      if (error) { setPaymentState('error'); setErrorMessage(error.message ?? 'No se pudo procesar el pago'); return; }
      await confirmJoinAfterPayment();
      setPaymentState('success'); toast.success('Pago realizado'); return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await confirmJoinAfterPayment();
    setPaymentState('success'); toast.success('Pago simulado en modo desarrollo');
  };

  if (paymentState === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="editorial-card w-full max-w-2xl rounded-lg px-6 py-10 text-left md:px-10">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-secondary/20 text-secondary"><CheckCircle size={40} /></div>
          <p className="section-kicker">Expedition confirmed</p>
          <h1 className="hero-title text-4xl text-on-surface md:text-6xl">Pago confirmado</h1>
          <p className="mt-4 max-w-lg text-on-surface-variant">Ya reservaste tu lugar en <span className="text-on-surface">{activity.title}</span> por {formatCLP(activity.price)}.</p>
          <div className="mt-8 flex flex-col gap-3 md:flex-row">
            <CTAButton label="Ver actividad" onClick={() => navigate(`/activity/${activityId}`)} />
            <CTAButton label="Volver al inicio" variant="secondary" onClick={() => navigate('/')} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-shell py-8 md:py-10 lg:py-12">
      <div className="premium-page mx-auto max-w-2xl">
      <header className="glass sticky top-0 z-20 flex items-center justify-between rounded-xl border border-outline-variant/10 px-5 py-4">
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 cursor-pointer"><ArrowLeft size={18} /><span className="font-label text-[10px] uppercase tracking-[0.16em]">Volver</span></button>
        <div className="font-headline text-2xl font-black uppercase tracking-tight text-primary-container">Checkout</div>
        <Lock size={16} className="text-secondary" />
      </header>

      <section className="editorial-card rounded-lg px-6 py-8 md:px-8">
        <p className="section-kicker">Booking confirmation</p>
        <h1 className="hero-title text-4xl text-on-surface md:text-6xl">Confirma tu lugar</h1>
        <p className="mt-3 text-on-surface-variant">Completa el pago para cerrar tu reserva en la expedición.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-[0.95fr_1.05fr]">
        <div className="editorial-card rounded-md px-6 py-6 md:px-8 md:py-8 space-y-4">
          <p className="section-kicker">Resumen</p>
          <h2 className="font-headline text-3xl font-black uppercase tracking-tight text-on-surface">{activity.title}</h2>
          <div className="rounded-md bg-surface px-4 py-4">
            <p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Monto</p>
            <p className="mt-2 font-headline text-4xl font-black text-primary">{formatCLP(activity.price)}</p>
          </div>
        </div>

        <div className="editorial-card rounded-md px-6 py-6 md:px-8 md:py-8 space-y-5">
          <p className="section-kicker">Pago</p>
          {stripe && clientSecret ? <div id="stripe-payment-element" className="rounded-md bg-surface-container-highest p-4" /> : <div className="rounded-md bg-surface px-4 py-5 text-sm text-on-surface-variant">Modo desarrollo: no hay llave pública de Stripe configurada.</div>}
          {paymentState === 'processing' && <div className="flex items-center gap-2 text-sm text-on-surface-variant"><Loader2 size={16} className="animate-spin" /> Procesando…</div>}
          {errorMessage && <p className="text-sm text-error">{errorMessage}</p>}
          <CTAButton label="Confirmar pago" loading={paymentState === 'processing'} disabled={stripe ? !cardComplete : false} onClick={() => void handlePayment()} fullWidth />
        </div>
      </section>
      </div>
    </div>
  );
}
