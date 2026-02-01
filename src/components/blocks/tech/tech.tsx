import Container from '@/components/layout/container';
import { Card, CardContent } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';

const QUOTES = ['quote1', 'quote2'] as const;

export default async function TechSection() {
  const t = await getTranslations('HomePage.tech');

  return (
    <section id="tech" className="px-4 py-16 md:py-24">
      <Container className="max-w-4xl">
        <h2 className="text-center text-3xl font-bold md:text-4xl">
          {t('title')}
        </h2>

        <div className="mt-6 space-y-4 text-center">
          <p className="text-lg text-muted-foreground">{t('lead')}</p>
          <p className="text-muted-foreground">{t('detail')}</p>
        </div>

        {/* Social Proof */}
        <div className="mt-12">
          <h3 className="mb-6 text-center text-xl font-semibold">
            {t('socialProof.title')}
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            {QUOTES.map((key) => (
              <Card key={key} className="bg-muted/30">
                <CardContent className="pt-6">
                  <blockquote className="text-lg italic">
                    &ldquo;{t(`socialProof.quotes.${key}.text`)}&rdquo;
                  </blockquote>
                  <cite className="mt-3 block text-sm text-muted-foreground not-italic">
                    — {t(`socialProof.quotes.${key}.author`)}
                  </cite>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
