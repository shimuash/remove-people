'use client';

import { BottomLink } from '@/components/auth/bottom-link';
import { Logo } from '@/components/layout/logo';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { LocaleLink } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  children: React.ReactNode;
  headerLabel: string;
  bottomButtonLabel: string;
  bottomButtonHref: string;
  className?: string;
  /** Custom footer renderer, replaces default BottomLink when provided */
  renderFooter?: () => React.ReactNode;
}

export const AuthCard = ({
  children,
  headerLabel,
  bottomButtonLabel,
  bottomButtonHref,
  className,
  renderFooter,
}: AuthCardProps) => {
  return (
    <Card className={cn('shadow-xs border border-border', className)}>
      <CardHeader className="flex flex-col items-center">
        <LocaleLink href="/" prefetch={false}>
          <Logo className="mb-2" />
        </LocaleLink>
        <CardDescription>{headerLabel}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter>
        {renderFooter ? (
          renderFooter()
        ) : (
          <BottomLink label={bottomButtonLabel} href={bottomButtonHref} />
        )}
      </CardFooter>
    </Card>
  );
};
