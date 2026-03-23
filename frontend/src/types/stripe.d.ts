declare module '@stripe/stripe-js' {
  interface Stripe {
    elements: (options?: Record<string, unknown>) => StripeElements;
    confirmPayment: (options: {
      elements: StripeElements;
      confirmParams?: { return_url?: string };
      redirect?: 'if_required' | 'always';
    }) => Promise<{ error?: { message?: string }; paymentIntent?: { status: string } }>;
  }

  interface StripeElements {
    create: (type: string, options?: Record<string, unknown>) => StripeElement;
  }

  interface StripeElementChangeEvent {
    complete: boolean;
    error?: { message: string };
  }

  interface StripeElement {
    mount: (domElement: string | HTMLElement) => void;
    unmount: () => void;
    destroy: () => void;
    on: (event: string, handler: (event: StripeElementChangeEvent) => void) => void;
  }

  export function loadStripe(publishableKey: string): Promise<Stripe | null>;
}
