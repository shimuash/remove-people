'use client';

import { DividerWithText } from '@/components/auth/divider-with-text';
import { GitHubIcon } from '@/components/icons/github';
import { GoogleColorIcon } from '@/components/icons/google';
import { Button } from '@/components/ui/button';
import { websiteConfig } from '@/config/website';
import { useOAuthPopup } from '@/hooks/use-oauth-popup';
import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface SocialLoginPopupButtonProps {
  showDivider?: boolean;
  onSuccess?: () => void;
  onFallback?: () => void;
}

/**
 * Social login buttons with popup mode for Auth Modal
 */
export const SocialLoginPopupButton = ({
  showDivider = true,
  onSuccess,
  onFallback,
}: SocialLoginPopupButtonProps) => {
  if (
    !websiteConfig.auth.enableGoogleLogin &&
    !websiteConfig.auth.enableGithubLogin
  ) {
    return null;
  }

  const t = useTranslations('AuthPage.login');
  const [loadingProvider, setLoadingProvider] = useState<
    'google' | 'github' | null
  >(null);

  const { openPopup, isLoading } = useOAuthPopup({
    onSuccess: () => {
      setLoadingProvider(null);
      onSuccess?.();
    },
    onError: () => {
      setLoadingProvider(null);
    },
    onFallback: () => {
      setLoadingProvider(null);
      onFallback?.();
    },
  });

  const handleClick = async (provider: 'google' | 'github') => {
    setLoadingProvider(provider);
    await openPopup(provider);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {showDivider && <DividerWithText text={t('or')} />}
      {websiteConfig.auth.enableGoogleLogin && (
        <Button
          size="lg"
          className="w-full cursor-pointer"
          variant="outline"
          onClick={() => handleClick('google')}
          disabled={isLoading || loadingProvider === 'google'}
        >
          {loadingProvider === 'google' ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : (
            <GoogleColorIcon className="size-4 mr-2" />
          )}
          <span>{t('signInWithGoogle')}</span>
        </Button>
      )}
      {websiteConfig.auth.enableGithubLogin && (
        <Button
          size="lg"
          className="w-full cursor-pointer"
          variant="outline"
          onClick={() => handleClick('github')}
          disabled={isLoading || loadingProvider === 'github'}
        >
          {loadingProvider === 'github' ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : (
            <GitHubIcon className="size-4 mr-2" />
          )}
          <span>{t('signInWithGitHub')}</span>
        </Button>
      )}
    </div>
  );
};
