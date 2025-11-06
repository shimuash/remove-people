'use client';

import { websiteConfig } from '@/config/website';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export function Logo({ className, withText }: { className?: string, withText?: boolean }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // const logoLight = websiteConfig.metadata.images?.logoLight ?? '/logo.png';
  // const logoDark = websiteConfig.metadata.images?.logoDark ?? logoLight;

  // During server-side rendering and initial client render, always use logoLight
  // This prevents hydration mismatch
  // const logo = mounted && theme === 'dark' ? logoDark : logoLight;

  const logo = withText ? '/text-logo.svg' : '/logo.svg'

  // Only show theme-dependent UI after hydration to prevent mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Image
      src={logo}
      alt="Logo of AnyRemover"
      title="Logo"
      width={96}
      height={96}
      className={cn('size-8 rounded-md', className)}
    />
  );
}
