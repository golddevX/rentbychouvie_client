import Link from 'next/link';
import Image from 'next/image';
import { MotionReveal } from './MotionReveal';

interface EditorialSectionProps {
  eyebrow: string;
  title: string;
  copy: string;
  image: string;
  href?: string;
  cta: string;
  reverse?: boolean;
}

export function EditorialSection({
  eyebrow,
  title,
  copy,
  image,
  href = '/products',
  cta,
  reverse = false,
}: EditorialSectionProps) {
  return (
    <section className="luxury-container py-20 md:py-28">
      <div className={`grid gap-10 md:grid-cols-[0.92fr_1.08fr] md:items-center ${reverse ? 'md:[&>*:first-child]:order-2' : ''}`}>
        <MotionReveal>
          <div className="relative">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[28px] bg-[var(--accent-soft)] md:ml-10">
              <Image src={image} alt={title} fill sizes="(max-width: 768px) 100vw, 45vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-8 right-8 hidden aspect-[4/5] w-44 overflow-hidden rounded-[24px] bg-[var(--surface-2)] p-2 shadow-[var(--shadow-soft)] md:block">
              <Image
                src="https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=500&q=85"
                alt=""
                fill
                sizes="176px"
                className="rounded-[18px] object-cover p-2"
              />
            </div>
          </div>
        </MotionReveal>

        <MotionReveal delay={120} className="md:px-10">
          <p className="label-caps">{eyebrow}</p>
          <h2 className="mt-5 max-w-2xl text-5xl font-semibold leading-[0.95] tracking-tight text-[var(--text-primary)] md:text-7xl">
            {title}
          </h2>
          <p className="mt-7 max-w-lg text-sm leading-8 text-[var(--text-secondary)] md:text-base">
            {copy}
          </p>
          <Link href={href} className="cinematic-link mt-9 text-[var(--text-primary)]">
            {cta}
          </Link>
        </MotionReveal>
      </div>
    </section>
  );
}
