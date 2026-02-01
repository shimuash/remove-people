import BeyondRemovalSection from '@/components/blocks/beyond-removal/beyond-removal';
import FaqSection from '@/components/blocks/faqs/faqs';
import FinalCtaSection from '@/components/blocks/final-cta/final-cta';
import HeroSection from '@/components/blocks/hero/hero1';
import HowItWorksSection from '@/components/blocks/how-it-works/how-it-works';
import PricingSection from '@/components/blocks/pricing/pricing';
import PrivacySection from '@/components/blocks/privacy/privacy';
import ResultsSection from '@/components/blocks/results/results';
import TechSection from '@/components/blocks/tech/tech';
import { constructMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

/**
 * https://next-intl.dev/docs/environments/actions-metadata-route-handlers#metadata-api
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return constructMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    pathname: '',
  });
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <HowItWorksSection />
      <ResultsSection />
      <TechSection />
      <BeyondRemovalSection />
      <PrivacySection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
    </div>
  );
}
