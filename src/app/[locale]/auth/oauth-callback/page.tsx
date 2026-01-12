'use client';

import { authClient } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

/**
 * OAuth Popup callback page
 * Notifies parent window via postMessage and closes
 */
export default function OAuthCallbackPage() {
  const t = useTranslations('AuthModal');

  useEffect(() => {
    const notifyParentAndClose = async () => {
      try {
        // Verify session
        const session = await authClient.getSession();

        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'oauth-callback',
              success: !!session.data,
              error: session.data ? null : 'No session found',
            },
            window.location.origin
          );
        }
      } catch (error) {
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'oauth-callback',
              success: false,
              error: 'Authentication failed',
            },
            window.location.origin
          );
        }
      } finally {
        window.close();
      }
    };

    notifyParentAndClose();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>{t('completingAuth')}</p>
    </div>
  );
}
