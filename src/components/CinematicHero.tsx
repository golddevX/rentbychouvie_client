'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useI18n } from '@/components/client/I18nProvider';

interface CinematicHeroProps {
  image: string;
  eyebrow?: string;
  title?: string;
  cta?: string;
  copy?: string;
}

export function CinematicHero({ image, eyebrow, title, cta, copy }: CinematicHeroProps) {
  const [offset, setOffset] = useState(0);
  const { dictionary } = useI18n();

  useEffect(() => {
    const onScroll = () => setOffset(Math.min(window.scrollY * 0.12, 72));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[var(--surface-inverse)]">
       <div className="absolute inset-0 h-[112%]" style={{ transform: `translateY(${offset}px)` }}>
        <Image
          src={image}
          alt="Luxury fashion campaign"
          fill
          priority
          sizes="100vw"
          className="image-load-zoom h-full w-full object-cover"
        />
      </div>
      <div className="hero-overlay absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[var(--surface)] to-transparent" />

      <div className="luxury-container relative flex min-h-screen items-end pb-14 pt-28 md:pb-20">
        <div className="max-w-[980px] text-[var(--surface-2)]">
          {/* <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/62">
            {eyebrow || dictionary.common.luxuryService}
          </p> */}
          {/* <h1 className="mt-5 max-w-5xl text-[clamp(4.5rem,12vw,11rem)] font-semibold leading-[0.82] tracking-[-0.055em]">
            {title || dictionary.products.title}
          </h1> */}
          <div className="mt-8 grid max-w-4xl gap-6 md:grid-cols-[0.72fr_1fr] md:items-end">
            {/* <Link href="/products" className="cinematic-link text-white">
              {cta || dictionary.products.view_detail}
            </Link> */}
            {/* <p className="max-w-xl text-sm leading-7 text-white/72 md:text-base">
              {copy || dictionary.home.featuredDescription}
            </p> */}
          </div>
        </div>
      </div>
    </section>
  );
}
