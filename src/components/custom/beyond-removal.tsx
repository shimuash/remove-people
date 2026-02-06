'use client';

import Container from '@/components/layout/container';
import { HeaderSection } from '@/components/layout/header-section';
import { BeforeAfterSlider } from './before-after-slider';
import { cn } from '@/lib/utils';
import type { MotionValue } from 'motion/react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

// TODO: Replace with actual before/after images
const CAPABILITIES = [
  {
    key: 'extend',
    before:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    after:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
  },
  {
    key: 'move',
    before:
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=600&fit=crop',
    after:
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&h=600&fit=crop',
  },
  {
    key: 'background',
    before:
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop',
    after:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
  },
  {
    key: 'polish',
    before:
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&h=600&fit=crop',
    after:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop',
  },
  {
    key: 'enhance',
    before:
      'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&h=600&fit=crop',
    after:
      'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&h=600&fit=crop',
  },
] as const;

// Background colors for each card
const CARD_COLORS = [
  'bg-slate-50', // 冷灰蓝
  'bg-sky-50', // 天蓝
  'bg-pink-50', // 粉色
  'bg-amber-50', // 暖黄
  'bg-stone-50', // 暖灰
];

const TOTAL_CARDS = CAPABILITIES.length;

interface StackedCardProps {
  index: number;
  isLast: boolean;
  capability: (typeof CAPABILITIES)[number];
  bgColor: string;
  containerProgress: MotionValue<number>;
}

function StackedCard({
  index,
  isLast,
  capability,
  bgColor,
  containerProgress,
}: StackedCardProps) {
  const t = useTranslations('HomePage.beyondRemoval');
  const capabilityKey = capability.key;

  // Calculate this card's animation range based on container progress
  // Each card animates when it's about to be covered by the next card
  const rangeStart = index / TOTAL_CARDS;
  const rangeEnd = (index + 1) / TOTAL_CARDS;

  // Transform values based on container scroll progress
  const scale = useTransform(
    containerProgress,
    [rangeStart, rangeEnd],
    [1, isLast ? 1 : 0.95]
  );
  const borderRadius = useTransform(
    containerProgress,
    [rangeStart, rangeEnd],
    [0, isLast ? 0 : 40]
  );

  return (
    <motion.div
      className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden bg-transparent"
      style={{
        scale,
        borderRadius,
        zIndex: index,
      }}
    >
      <div
        className={cn(
          'container mx-auto px-4 md:px-6 lg:px-16 max-w-7xl rounded-3xl',
          bgColor
        )}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center h-[min(60vh,640px)]">
          <div className="order-1 text-center lg:text-left">
            <h3 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              {t(`capabilities.${capabilityKey}.title`)}
            </h3>
            <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto lg:mx-0">
              {t(`capabilities.${capabilityKey}.description`)}
            </p>
          </div>

          <div className="order-2">
            <BeforeAfterSlider
              beforeImage={capability.before}
              afterImage={capability.after}
              beforeAlt={t(`capabilities.${capabilityKey}.beforeAlt`)}
              afterAlt={t(`capabilities.${capabilityKey}.afterAlt`)}
              beforeLabel={t('sliderLabels.before')}
              afterLabel={t('sliderLabels.after')}
              className="rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SectionContent() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll progress of the entire section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  return (
    <div ref={containerRef} className="relative">
      {CAPABILITIES.map((capability, index) => (
        <StackedCard
          key={capability.key}
          index={index}
          isLast={index === CAPABILITIES.length - 1}
          capability={capability}
          bgColor={CARD_COLORS[index]}
          containerProgress={scrollYProgress}
        />
      ))}
    </div>
  );
}

export default function BeyondRemovalSection() {
  const t = useTranslations('HomePage.beyondRemoval');

  return (
    <section id="beyond-removal">
      <Container className="max-w-6xl">
        <HeaderSection
          subtitle={t('title')}
          subtitleAs="h2"
          subtitleClassName="text-3xl md:text-4xl font-bold"
        />

        <div className="mx-auto mt-6 max-w-3xl space-y-4 text-center">
          <p className="text-lg text-muted-foreground">{t('lead')}</p>
          <p className="text-muted-foreground">{t('contrast')}</p>
          <p className="text-sm font-medium text-primary">
            {t('howToAccess')}
          </p>
        </div>
      </Container>

      <SectionContent />

      <Container className="max-w-6xl">
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
          {t('proNote')}
        </p>
      </Container>
    </section>
  );
}
