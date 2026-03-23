import api, { endpoints } from './api';

/**
 * Request notification permission from the user.
 * Returns the permission state: 'granted', 'denied', or 'default'.
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support push notifications.');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Register the service worker and subscribe to push notifications.
 * Sends the subscription to the backend.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported in this browser.');
    return null;
  }

  try {
    // Register the service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    // Get the VAPID public key from the backend or env
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

    let subscription: PushSubscription | null = null;

    if (vapidPublicKey) {
      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push notifications
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    } else {
      // If no VAPID key, try subscribing without it (for development)
      subscription = await registration.pushManager.getSubscription();
    }

    if (subscription) {
      // Send the subscription to the backend
      await api.post(`${endpoints.notifications}subscribe/`, {
        subscription: subscription.toJSON(),
      });
    }

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications and notify the backend.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Notify the backend
      await api.post(`${endpoints.notifications}unsubscribe/`, {
        subscription: subscription.toJSON(),
      });

      // Unsubscribe locally
      await subscription.unsubscribe();
    }

    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Convert a base64 URL-encoded string to a Uint8Array.
 * Used for the VAPID application server key.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
