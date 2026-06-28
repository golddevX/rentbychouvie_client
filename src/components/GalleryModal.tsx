'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useI18n } from '@/components/client/I18nProvider';

interface GalleryModalProps {
  images: string[];
  title: string;
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

export function GalleryModal({
  images,
  title,
  initialIndex,
  open,
  onClose,
}: GalleryModalProps) {
  const [active, setActive] = useState(initialIndex);
  const { dictionary } = useI18n();

  useEffect(() => {
    setActive(initialIndex);
  }, [initialIndex, open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setActive((value) => (value + 1) % images.length);
      if (event.key === 'ArrowLeft') setActive((value) => (value - 1 + images.length) % images.length);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [images.length, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--surface-inverse)]/96 text-[var(--surface-2)] backdrop-blur-sm">
      <div className="flex h-24 items-center justify-between border-b border-white/10 px-6 md:px-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
            {dictionary.gallery.label}
          </p>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-[20px] border border-black/15 bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-black shadow-sm transition hover:bg-[var(--accent-soft)] hover:text-black"
        >
          {dictionary.gallery.close}
        </button>
      </div>

      <div className="grid h-[calc(100vh-96px)] grid-rows-[1fr_auto] gap-6 p-6 text-black md:p-10">
        <div className="relative overflow-hidden rounded-[28px] bg-white/[0.04]">
          <Image
            src={images[active]}
            alt={`${title} editorial ${active + 1}`}
            fill
            sizes="100vw"
            className="object-contain"
          />
          <button
            type="button"
            onClick={() => setActive((active - 1 + images.length) % images.length)}
            className="absolute left-4 top-1/2 rounded-full border border-white/20 bg-black/20 px-4 py-3 backdrop-blur transition hover:bg-white hover:text-[var(--surface-inverse)]"
          >
            {dictionary.gallery.prev}
          </button>
          <button
            type="button"
            onClick={() => setActive((active + 1) % images.length)}
            className="absolute right-4 top-1/2 rounded-full border border-white/20 bg-black/20 px-4 py-3 backdrop-blur transition hover:bg-white hover:text-[var(--surface-inverse)]"
          >
            {dictionary.gallery.next}
          </button>
        </div>

        <div className="mx-auto flex max-w-3xl gap-3 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(index)}
              className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-[20px] border transition ${
                active === index ? 'border-white' : 'border-white/15 opacity-55'
              }`}
            >
              <Image src={image} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
