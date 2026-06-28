'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useClientSettings } from './ClientSettingsProvider';
import { useI18n } from './I18nProvider';

export function Footer() {
  const { dictionary } = useI18n();
  const { settings } = useClientSettings();
  const [policyOpen, setPolicyOpen] = useState(false);
  const policyBody = settings.policies.rentalPolicy.replace(/^CHÍNH SÁCH THUÊ VÁY\s*/, '');

  return (
    <>
      <footer className="border-t border-[var(--surface-border)] bg-[var(--surface)] py-12">
        <div className="luxury-container grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <p className="label-caps footer-label">
              {settings.footer.line}
            </p>
            <p className="mt-3 max-w-xl text-2xl font-semibold leading-tight text-[var(--text-primary)]">
              {dictionary.header.eyebrow}
            </p>
            <div className="footer-contact mt-6 grid gap-2">
              <p>{settings.contact.address}</p>
              <p>{settings.contact.hotline}</p>
              <p>{settings.contact.email}</p>
            </div>
          </div>
          <div className="space-y-5">
            <div className="footer-service-strip">
              <span>{settings.footer.appointmentLabel || dictionary.footer.appointment}</span>
              <span>{settings.footer.noPaymentLabel || dictionary.footer.noPayment}</span>
              <span>{settings.footer.fittingLabel || dictionary.footer.fitting}</span>
            </div>
            <div className="footer-link-row">
              {settings.footer.footerLinks.filter((item) => item.visible).map((item) => {
                const opensPolicy = item.label.toLowerCase().includes('chính sách');

                if (opensPolicy) {
                  return (
                    <button
                      key={`${item.href}-${item.label}`}
                      type="button"
                      onClick={() => setPolicyOpen(true)}
                      className="footer-link-button"
                    >
                      {item.label}
                    </button>
                  );
                }

                return (
                  <Link key={`${item.href}-${item.label}`} href={item.href} className="footer-link-button">
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </footer>

      {policyOpen ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/42 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="rental-policy-title">
          <div className="policy-modal max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-[32px] bg-[var(--surface-2)] shadow-[0_30px_120px_rgba(20,12,8,0.28)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--surface-border)] px-6 py-5 md:px-8">
              <div>
                <p className="label-caps footer-label">Thông tin thuê váy</p>
                <h2 id="rental-policy-title" className="mt-2 text-2xl font-semibold text-[var(--text-primary)] md:text-3xl">
                  CHÍNH SÁCH THUÊ VÁY
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPolicyOpen(false)}
                className="rounded-full border border-[var(--surface-border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--accent-soft)]"
              >
                Đóng
              </button>
            </div>
            <div className="max-h-[62vh] overflow-y-auto px-6 py-5 md:px-8">
              <div className="policy-modal-body whitespace-pre-line">
                {policyBody}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
