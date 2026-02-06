'use client';

import { HeaderSection } from '@/components/layout/header-section';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';

const FAQ_CATEGORIES = {
  quality: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'],
  capability: ['q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14'],
  technical: ['q15', 'q16', 'q17', 'q18'],
  privacy: ['q19'],
} as const;

type CategoryKey = keyof typeof FAQ_CATEGORIES;

export default function FaqSection() {
  const t = useTranslations('HomePage.faqs');

  return (
    <section id="faqs" className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <HeaderSection
          subtitle={t('title')}
          subtitleAs="h2"
          subtitleClassName="text-3xl md:text-4xl font-bold"
        />

        <Tabs defaultValue="quality" className="mt-12">
          <TabsList className="mb-6 grid w-full grid-cols-2 md:grid-cols-4">
            {(Object.keys(FAQ_CATEGORIES) as CategoryKey[]).map((category) => (
              <TabsTrigger key={category} value={category} className="text-sm">
                {t(`categories.${category}`)}
              </TabsTrigger>
            ))}
          </TabsList>

          {(
            Object.entries(FAQ_CATEGORIES) as [CategoryKey, readonly string[]][]
          ).map(([category, questions]) => (
            <TabsContent key={category} value={category}>
              <Accordion
                type="single"
                collapsible
                className="w-full rounded-2xl border px-6 py-2 shadow-sm ring-4 ring-muted dark:ring-0"
              >
                {questions.map((qKey) => (
                  <AccordionItem
                    key={qKey}
                    value={qKey}
                    className="border-dashed"
                  >
                    <AccordionTrigger className="cursor-pointer text-left text-base hover:no-underline">
                      {t(`items.${qKey}.question`)}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-base text-muted-foreground">
                        {t(`items.${qKey}.answer`)}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
