'use client';

import Container from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export default function FinalCtaSection() {
  const t = useTranslations('HomePage.finalCta');

  const scrollToHero = () => {
    document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="final-cta" className="bg-muted/50 px-4 py-24">
      <Container className="max-w-3xl text-center">
        <h2 className="text-3xl font-bold lg:text-4xl">{t('title')}</h2>
        <p className="mt-4 text-lg text-muted-foreground">{t('body')}</p>

        <Button
          size="lg"
          onClick={scrollToHero}
          className="mt-8 h-12 rounded-full text-base"
        >
          {t('cta')}
        </Button>
      </Container>
    </section>
  );
}
