'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CinematicHero } from '@/components/CinematicHero';
import { ProductCard } from '@/components/ProductCard';
import { MotionReveal } from '@/components/MotionReveal';
import { useClientSettings } from '@/components/client/ClientSettingsProvider';
import { useI18n } from '@/components/client/I18nProvider';
import { productsApi } from '@/lib/api';
import { PublicProduct } from '@/types';

export default function HomePage() {
  const { dictionary } = useI18n();
  const { settings } = useClientSettings();
  const [products, setProducts] = useState<PublicProduct[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await productsApi.getAll();
        setProducts(response.data.slice(0, 4));
      } catch (error) {
        console.error(error);
      }
    };

    void run();
  }, []);

  return (
    <main className="min-h-screen bg-[var(--surface)]">
      <CinematicHero
        image={settings.hero.image}
        title={settings.hero.title}
        cta={settings.hero.ctaText}
        copy={settings.hero.subtitle}
      />

      <section className="luxury-container py-16 md:py-24">
        <MotionReveal>
          <div className="grid gap-4 md:grid-cols-[1.25fr_0.75fr] md:items-end">
            <div>
              <p className="label-caps">{dictionary.home.featuredTitle}</p>
              <h2 className="mt-4 max-w-5xl text-5xl font-semibold leading-[0.92] tracking-tight text-[var(--text-primary)] md:text-8xl">
                {dictionary.home.featuredDescription}
              </h2>
            </div>
            <Link href="/products" className="cinematic-link text-[var(--text-primary)] md:justify-self-end">
              {dictionary.home.ctaSecondary}
            </Link>
          </div>
        </MotionReveal>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product, index) => (
            <MotionReveal key={product.id} delay={index * 90}>
              <ProductCard product={product} index={index} />
            </MotionReveal>
          ))}
        </div>
      </section>

      <section className="luxury-container py-12 md:py-20">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <MotionReveal className="rounded-[32px] bg-[var(--surface-inverse)] px-7 py-8 text-white md:px-10 md:py-10">
            <p className="label-caps text-white/46">{dictionary.home.processTitle}</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-[-0.03em] md:text-6xl">
              {dictionary.home.processDescription}
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {dictionary.home.processSteps.map((step, index) => (
                <div key={step} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">0{index + 1}</p>
                  <p className="mt-3 text-sm font-semibold">{step}</p>
                </div>
              ))}
            </div>
          </MotionReveal>
          <MotionReveal className="grid gap-4" delay={120}>
            {settings.homepage.trustBlock.map((item) => (
              <div key={item} className="rounded-[28px] bg-[var(--surface-2)] p-6 shadow-[var(--shadow-soft)]">
                <p className="label-caps">{dictionary.home.trustTitle}</p>
                <p className="mt-3 text-xl font-semibold text-[var(--text-primary)]">{item}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{dictionary.home.trustDescription}</p>
              </div>
            ))}
          </MotionReveal>
        </div>
      </section>
    </main>
  );
}
