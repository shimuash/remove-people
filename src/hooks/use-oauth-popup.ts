'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { getLocalePathname } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const POPUP_WIDTH = 500;
const POPUP_HEIGHT = 600;

interface UseOAuthPopupOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onFallback?: () => void;
}

interface UseOAuthPopupReturn {
  openPopup: (provider: 'google' | 'github') => Promise<void>;
  isLoading: boolean;
}

/**
 * Open a centered popup window
 */
function openCenteredPopup(url: string): Window | null {
  const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
  const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;

  return window.open(
    url,
    'oauth-popup',
    `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},` +
      'menubar=no,toolbar=no,location=no,status=no'
  );
}

/**
 * Hook for handling OAuth authentication via popup window
 * Uses "open window first, set URL later" strategy to avoid browser blocking
 */
export function useOAuthPopup(
  options: UseOAuthPopupOptions = {}
): UseOAuthPopupReturn {
  const { onSuccess, onError, onFallback } = options;
  const isMobile = useIsMobile();
  const locale = useLocale();
  const t = useTranslations('AuthModal');
  const { refetch: refreshSession } = authClient.useSession();

  const popupRef = useRef<Window | null>(null);
  const messageReceivedRef = useRef(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    popupRef.current = null;
    messageReceivedRef.current = false;
    setIsLoading(false);
  }, []);

  // Handle postMessage from popup
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Validate origin
      if (event.origin !== window.location.origin) return;

      // Validate source (ensure it's from our popup)
      if (event.source !== popupRef.current) return;

      // Validate message type
      if (event.data?.type !== 'oauth-callback') return;

      messageReceivedRef.current = true;

      // Process result
      if (event.data.success) {
        await refreshSession();
        onSuccess?.();
      } else {
        onError?.(event.data.error || t('authFailed'));
      }

      cleanup();
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [cleanup, onError, onSuccess, refreshSession, t]);

  const openPopup = useCallback(
    async (provider: 'google' | 'github') => {
      // Generate callback URLs
      const popupCallbackUrl = `${window.location.origin}${getLocalePathname({ href: '/auth/oauth-callback', locale })}`;
      const fallbackCallbackUrl = window.location.href;

      // Mobile: always fallback to redirect (silent, no popup attempted)
      if (isMobile) {
        onFallback?.();
        await authClient.signIn.social({
          provider,
          callbackURL: fallbackCallbackUrl,
        });
        return;
      }

      setIsLoading(true);

      // Desktop: open blank popup first (ensure within user gesture validity)
      const popup = openCenteredPopup('about:blank');

      if (!popup || popup.closed) {
        // Popup blocked, fallback to redirect
        toast.info(t('popupBlocked'));
        onFallback?.();
        setIsLoading(false);
        await authClient.signIn.social({
          provider,
          callbackURL: fallbackCallbackUrl,
        });
        return;
      }

      popupRef.current = popup;
      messageReceivedRef.current = false;

      // Show loading state in popup
      popup.document.write(`
        <html>
          <head><title>OAuth</title></head>
          <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui">
            <p>Loading...</p>
          </body>
        </html>
      `);

      try {
        // Async get OAuth URL
        const result = await authClient.signIn.social({
          provider,
          callbackURL: popupCallbackUrl,
          disableRedirect: true, // Key: don't auto redirect, return URL
        });

        if (!result?.data?.url) {
          popup.close();
          setIsLoading(false);
          onError?.('Failed to get OAuth URL');
          return;
        }

        // Navigate to OAuth URL
        popup.location.href = result.data.url;

        // Start polling for popup close
        pollIntervalRef.current = setInterval(() => {
          if (popupRef.current?.closed) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            if (!messageReceivedRef.current) {
              // User manually closed popup
              toast.info(t('authCancelled'));
              onError?.(t('authCancelled'));
            }
            cleanup();
          }
        }, 500);
      } catch (error) {
        popup.close();
        cleanup();
        onError?.('Failed to initiate OAuth');
      }
    },
    [cleanup, isMobile, locale, onError, onFallback, onSuccess, t]
  );

  return { openPopup, isLoading };
}
