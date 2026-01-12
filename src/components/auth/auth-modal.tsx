'use client';

import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { SocialLoginPopupButton } from '@/components/auth/social-login-popup-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { LocaleLink } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { Routes } from '@/routes';
import { useAuthModalStore } from '@/stores/auth-modal-store';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

/**
 * Auth Modal component for login/register in a dialog
 */
export function AuthModal() {
  const t = useTranslations('AuthPage');
  const tc = useTranslations('AuthPage.common');
  const { isOpen, view, setView, close } = useAuthModalStore();
  const { refetch: refreshSession } = authClient.useSession();

  // Handle successful login/register
  const handleSuccess = useCallback(async () => {
    await refreshSession();
    close();
  }, [close, refreshSession]);

  // Render social login with popup mode
  const renderPopupSocialLogin = useCallback(
    ({ showDivider }: { showDivider: boolean }) => (
      <SocialLoginPopupButton
        showDivider={showDivider}
        onSuccess={handleSuccess}
      />
    ),
    [handleSuccess]
  );

  // Terms and Privacy Policy disclaimer
  const TermsDisclaimer = () => (
    <div className="mt-4 text-balance text-center text-xs text-muted-foreground">
      {tc('byClickingContinue')}
      <LocaleLink
        href={Routes.TermsOfService}
        className="underline underline-offset-4 hover:text-brand cursor-pointer"
      >
        {tc('termsOfService')}
      </LocaleLink>{' '}
      {tc('and')}{' '}
      <LocaleLink
        href={Routes.PrivacyPolicy}
        className="underline underline-offset-4 hover:text-brand cursor-pointer"
      >
        {tc('privacyPolicy')}
      </LocaleLink>
    </div>
  );

  // Custom footer for login form - switch to register
  const renderLoginFooter = useCallback(
    () => (
      <div className="w-full flex flex-col gap-4 mt-4">
        <Separator />
        <div className="w-full flex flex-col items-center">
          <button
            type="button"
            onClick={() => setView('register')}
            className="text-center text-sm text-muted-foreground"
          >
            {t('login.signUpHintText')}{' '}
            <span className="text-brand cursor-pointer hover:underline underline-offset-4 transition-colors">
              {t('login.signUpLinkText')}
            </span>
          </button>
          <TermsDisclaimer />
        </div>
      </div>
    ),
    [setView, t, tc]
  );

  // Custom footer for register form - switch to login
  const renderRegisterFooter = useCallback(
    () => (
      <div className="w-full flex flex-col gap-4 mt-4">
        <Separator />
        <div className="w-full flex flex-col items-center">
          <button
            type="button"
            onClick={() => setView('login')}
            className="text-center text-sm text-muted-foreground"
          >
            {t('register.signInHintText')}{' '}
            <span className="text-brand cursor-pointer hover:underline underline-offset-4 transition-colors">
              {t('register.signInLinkText')}
            </span>
          </button>
          <TermsDisclaimer />
        </div>
      </div>
    ),
    [setView, t, tc]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {view === 'login' ? t('login.title') : t('register.title')}
          </DialogTitle>
          <DialogDescription>
            {view === 'login'
              ? t('login.welcomeBack')
              : t('register.createAccount')}
          </DialogDescription>
        </DialogHeader>
        <div className="p-0">
          {view === 'login' ? (
            <LoginForm
              className="border-0 shadow-none"
              renderSocialLogin={renderPopupSocialLogin}
              renderFooter={renderLoginFooter}
              onSuccess={handleSuccess}
            />
          ) : (
            <RegisterForm
              className="border-0 shadow-none"
              renderSocialLogin={renderPopupSocialLogin}
              renderFooter={renderRegisterFooter}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
