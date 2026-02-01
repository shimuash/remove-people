import Container from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { LocaleLink } from '@/i18n/navigation';
import { Ban, Clock, Shield, UserX } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

const BULLETS = [
  { key: 'encrypted', icon: Shield },
  { key: 'noTraining', icon: Ban },
  { key: 'deleted', icon: Clock },
  { key: 'noHuman', icon: UserX },
] as const;

export default async function PrivacySection() {
  const t = await getTranslations('HomePage.privacy');

  return (
    <section id="privacy" className="px-4 py-16 md:py-24">
      <Container className="max-w-3xl text-center">
        <h2 className="text-3xl font-bold md:text-4xl">{t('title')}</h2>
        <p className="mt-4 text-lg text-muted-foreground">{t('body')}</p>

        <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
          {BULLETS.map(({ key, icon: Icon }) => (
            <div key={key} className="flex items-start gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <span className="text-muted-foreground">
                {t(`bullets.${key}`)}
              </span>
            </div>
          ))}
        </div>

        <Button asChild variant="link" className="mt-6">
          <LocaleLink href="/privacy-policy">{t('link')} →</LocaleLink>
        </Button>
      </Container>
    </section>
  );
}
