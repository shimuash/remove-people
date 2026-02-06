'use client';

import Container from '@/components/layout/container';
import { HeaderSection } from '@/components/layout/header-section';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { ScenarioCard } from './scenario-card';

// TODO: Replace with actual before/after images
const SCENARIOS = [
  {
    key: 'travel',
    before:
      'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800&h=600&fit=crop',
    after:
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop',
  },
  {
    key: 'photobombers',
    before:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop',
    after:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
  },
  {
    key: 'ex',
    before:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop',
    after:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
  },
  {
    key: 'keepSome',
    before:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop',
    after:
      'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=800&h=600&fit=crop',
  },
  {
    key: 'solo',
    before:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=600&fit=crop',
    after:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&h=600&fit=crop',
  },
  {
    key: 'weddings',
    before:
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
    after:
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&h=600&fit=crop',
  },
] as const;

export default function ResultsSection() {
  const t = useTranslations('HomePage.results');

  const scrollToHero = () => {
    document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="results" className="bg-muted/30 px-4 py-16 md:py-24">
      <Container className="px-4">
        <HeaderSection
          subtitle={t('title')}
          subtitleAs="h2"
          subtitleClassName="text-3xl md:text-4xl font-bold"
          description={t('subtitle')}
        />

        <div className="mt-24 space-y-24 lg:space-y-32">
          {SCENARIOS.map(({ key, before, after }, index) => (
            <ScenarioCard
              key={key}
              title={t(`scenarios.${key}.title`)}
              copy={t(`scenarios.${key}.copy`)}
              details={t(`scenarios.${key}.details`)}
              beforeImage={before}
              afterImage={after}
              beforeAlt={t(`scenarios.${key}.beforeAlt`)}
              afterAlt={t(`scenarios.${key}.afterAlt`)}
              beforeLabel={t('sliderLabels.before')}
              afterLabel={t('sliderLabels.after')}
              reversed={index % 2 === 1}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <Button
            size="lg"
            onClick={scrollToHero}
            className="rounded-full text-base"
          >
            {t('cta')}
          </Button>
        </div>
      </Container>
    </section>
  );
}
