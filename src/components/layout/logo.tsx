'use client';

import { websiteConfig } from '@/config/website';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface LogoProps {
  className?: string;
  variant?: 'text' | 'icon';
}

export function Logo({ className, variant = 'icon' }: LogoProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // const logoLight = websiteConfig.metadata.images?.logoLight ?? '/logo.png';
  // const logoDark = websiteConfig.metadata.images?.logoDark ?? logoLight;

  // During server-side rendering and initial client render, always use logoLight
  // This prevents hydration mismatch
  // const logo = mounted && theme === 'dark' ? logoDark : logoLight;

  const logo = variant === 'text' ? '/logo-text.svg' : '/logo-s.png';

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
      className={cn(
        'size-6 rounded-md',
        variant === 'text' && 'h-5 w-auto',
        className
      )}
    />
  );
}
