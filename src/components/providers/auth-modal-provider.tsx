'use client';

import { AuthModal } from '@/components/auth/auth-modal';

/**
 * Provider component that mounts AuthModal at app root
 */
export function AuthModalProvider() {
  return <AuthModal />;
}
