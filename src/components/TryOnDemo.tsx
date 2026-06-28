'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { aiPreviewApi } from '@/lib/api';
import { getProductImage } from '@/lib/product-images';
import { PublicProduct } from '@/types';
import { useI18n } from '@/components/client/I18nProvider';
import { useClientSettings } from '@/components/client/ClientSettingsProvider';

export function TryOnDemo({ product }: { product?: PublicProduct | null }) {
  const { dictionary } = useI18n();
  const { settings } = useClientSettings();
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [bodyImage, setBodyImage] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'pending' | 'completed' | 'failed'>('idle');
  const [message, setMessage] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);

  const facePreview = useMemo(() => faceImage ? URL.createObjectURL(faceImage) : null, [faceImage]);
  const bodyPreview = useMemo(() => bodyImage ? URL.createObjectURL(bodyImage) : null, [bodyImage]);

  useEffect(() => {
    if (!requestId || status !== 'pending') return;

    let active = true;
    let attempts = 0;
    const poll = async () => {
      try {
        const response = await aiPreviewApi.getResult(requestId);
        if (!active) return;
        if (response.data.status === 'completed' && response.data.previewImageUrl) {
          setResultUrl(response.data.previewImageUrl);
          setStatus('completed');
          setMessage(response.data.message || dictionary.preview.completed);
          return;
        }
        if (response.data.status === 'failed') {
          setStatus('failed');
          setMessage(response.data.message || dictionary.preview.generateError);
          return;
        }
        attempts += 1;
        if (attempts < 60) {
          window.setTimeout(() => void poll(), 3000);
        }
      } catch (error: any) {
        if (!active) return;
        attempts += 1;
        if (attempts < 60) {
          window.setTimeout(() => void poll(), 3000);
        } else {
          setStatus('failed');
          setMessage(error?.response?.data?.message || dictionary.preview.generateError);
        }
      }
    };

    void poll();
    return () => {
      active = false;
    };
  }, [
    dictionary.preview.completed,
    dictionary.preview.generateError,
    requestId,
    status,
  ]);

  if (!settings.preview.enabled) return null;

  const generate = async () => {
    if (!product || !faceImage) {
      setMessage(dictionary.preview.faceRequired);
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const response = await aiPreviewApi.generate({
        productId: product.id,
        faceImage,
        bodyImage,
      });
      setResultUrl(response.data.previewImageUrl);
      setStatus(response.data.status === 'completed' ? 'completed' : 'pending');
      setRequestId(response.data.requestId);
      setMessage(response.data.message || dictionary.preview.requestReceived);
    } catch (error: any) {
      setStatus('failed');
      setMessage(error?.response?.data?.message || dictionary.preview.generateError);
    }
  };

  return (
    <section className="overflow-hidden rounded-[32px] bg-[var(--surface-inverse)] text-white">
      <div className="grid lg:grid-cols-[1fr_380px]">
        <div className="grid gap-5 p-5 md:grid-cols-3 md:p-8">
          <PhotoInput
            label={dictionary.preview.uploadFace}
            preview={facePreview}
            required
            requiredLabel={dictionary.preview.required}
            optionalLabel={dictionary.preview.optional}
            onChange={setFaceImage}
          />
          <PhotoInput
            label={dictionary.preview.uploadBody}
            preview={bodyPreview}
            requiredLabel={dictionary.preview.required}
            optionalLabel={dictionary.preview.optional}
            onChange={setBodyImage}
          />
          <div className="relative min-h-[360px] overflow-hidden rounded-[26px] border border-white/10 bg-white/5">
            <Image
              src={resultUrl || getProductImage(product)}
              alt={product?.name || dictionary.preview.garmentAlt}
              fill
              unoptimized={Boolean(resultUrl)}
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                {dictionary.preview.renderOutput}
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {status === 'loading'
                  ? dictionary.preview.composing
                  : status === 'completed'
                    ? dictionary.preview.completed
                    : status === 'pending'
                      ? dictionary.preview.pendingReview
                      : dictionary.preview.awaiting}
              </p>
            </div>
          </div>
        </div>

        <aside className="border-t border-white/10 p-7 lg:border-l lg:border-t-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">{dictionary.preview.lab}</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[0.95]">{dictionary.preview.title}</h2>
          <p className="mt-5 text-sm leading-7 text-white/65">{settings.preview.reviewCopy}</p>
          <button
            type="button"
            onClick={() => void generate()}
            disabled={!product || !faceImage || status === 'loading'}
            className="mt-8 w-full rounded-[22px] bg-white px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-black disabled:opacity-40"
          >
            {status === 'loading' ? dictionary.preview.composing : dictionary.preview.generate}
          </button>
          {message ? (
            <div className="mt-5 rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/72">
              {message}
            </div>
          ) : null}
          <p className="mt-6 text-xs leading-6 text-white/48">{settings.preview.disclaimer}</p>
        </aside>
      </div>
    </section>
  );
}

function PhotoInput({
  label,
  preview,
  required,
  requiredLabel,
  optionalLabel,
  onChange,
}: {
  label: string;
  preview: string | null;
  required?: boolean;
  requiredLabel: string;
  optionalLabel: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="relative min-h-[360px] cursor-pointer overflow-hidden rounded-[26px] border border-dashed border-white/20 bg-white/5">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        capture="user"
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      {preview ? (
        <Image src={preview} alt={label} fill unoptimized sizes="33vw" className="object-cover" />
      ) : (
        <div className="grid h-full min-h-[360px] place-items-center p-6 text-center">
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="mt-2 text-xs text-white/50">{required ? requiredLabel : optionalLabel}</p>
          </div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5">
        <p className="text-sm font-semibold">{label}</p>
      </div>
    </label>
  );
}
