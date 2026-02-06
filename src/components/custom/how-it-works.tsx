import Container from '@/components/layout/container';
import { HeaderSection } from '@/components/layout/header-section';
import { Download, MousePointerClick, Upload } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

const STEPS = [
  { key: 'step1', icon: Upload, step: 1 },
  { key: 'step2', icon: MousePointerClick, step: 2 },
  { key: 'step3', icon: Download, step: 3 },
] as const;

export default async function HowItWorksSection() {
  const t = await getTranslations('HomePage.howItWorks');

  return (
    <section id="how-it-works" className="px-4 py-16 md:py-24">
      <Container className="max-w-6xl">
        <HeaderSection
          subtitle={t('title')}
          subtitleAs="h2"
          subtitleClassName="text-3xl md:text-4xl font-bold"
        />

        <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-12">
          {STEPS.map(({ key, icon: Icon, step }) => (
            <div key={key} className="flex flex-col items-center text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Icon className="size-8 text-primary" />
              </div>
              <div className="mb-2 font-mono text-sm font-medium text-primary">
                Step {step}
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="text-muted-foreground">
                {t(`steps.${key}.description`)}
              </p>
            </div>
          ))}
        </div>

        {/* Optional note */}
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
          {t('optional')}
          <Link href="#beyond-removal" className="text-primary hover:underline">
            {t('cta')} →
          </Link>
        </p>
      </Container>
    </section>
  );
}
