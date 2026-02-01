import Container from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Banana, CheckCircle2, Shield, Users, Zap } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import ImageUploader from './image-uploader';

const TRUST_BADGES = [
  { key: 'powered', icon: Banana, color: 'text-yellow-500' },
  { key: 'clean', icon: CheckCircle2, color: 'text-emerald-500' },
  { key: 'speed', icon: Zap, color: 'text-amber-500' },
  { key: 'control', icon: Users, color: 'text-blue-500' },
  { key: 'privacy', icon: Shield, color: 'text-violet-500' },
] as const;

export default async function HeroSection() {
  const t = await getTranslations('HomePage.hero');

  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-12 pb-16 md:pt-20 lg:pt-24 2xl:pt-28 md:pb-24"
    >
      <Container className="px-4">
        <div className="flex flex-col xl:flex-row justify-between xl:items-end mb-8 gap-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-tight font-title leading-tight max-w-3xl">
            {t('title')}
          </h1>

          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-md">
            {t('description')}
          </p>
        </div>

        <Button
          size="lg"
          className="rounded-full text-base cursor-pointer h-12"
        >
          {t('cta')}
        </Button>

        <ImageUploader />

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {TRUST_BADGES.map(({ key, icon: Icon, color }) => (
            <div
              key={key}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Icon className={`size-4 shrink-0 ${color}`} />
              <span>{t(`trustBadges.${key}`)}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
