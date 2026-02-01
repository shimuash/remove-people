'use client';

import { BeforeAfterSlider } from '@/components/ui/before-after-slider';
import { cn } from '@/lib/utils';

interface ScenarioCardProps {
  title: string;
  copy: string;
  details?: string;
  beforeImage: string;
  afterImage: string;
  beforeAlt: string;
  afterAlt: string;
  beforeLabel?: string;
  afterLabel?: string;
  reversed?: boolean;
}

export function ScenarioCard({
  title,
  copy,
  details,
  beforeImage,
  afterImage,
  beforeAlt,
  afterAlt,
  beforeLabel = 'Original',
  afterLabel = 'Cleaned',
  reversed = false,
}: ScenarioCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-8 md:flex-row md:items-center md:gap-16',
        reversed && 'md:flex-row-reverse'
      )}
    >
      {/* Image */}
      <div className="md:w-1/2">
        <BeforeAfterSlider
          beforeImage={beforeImage}
          afterImage={afterImage}
          beforeAlt={beforeAlt}
          afterAlt={afterAlt}
          beforeLabel={beforeLabel}
          afterLabel={afterLabel}
          className="rounded-xl"
        />
      </div>

      {/* Text */}
      <div className="space-y-4 md:w-1/2">
        <h3 className="text-2xl font-semibold md:text-3xl">{title}</h3>
        <p className="text-lg text-muted-foreground">{copy}</p>
        {details && (
          <p className="text-base text-muted-foreground/80">{details}</p>
        )}
      </div>
    </div>
  );
}
