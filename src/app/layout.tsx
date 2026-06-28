import React from 'react';
import './globals.css';
import { ClientSettingsProvider } from '@/components/client/ClientSettingsProvider';
import { I18nProvider } from '@/components/client/I18nProvider';
import { Footer } from '@/components/client/Footer';
import { ToastProvider } from '@/components/client/ToastProvider';
import { LuxuryHeader } from '@/components/LuxuryHeader';
import { LuxuryMiniCart } from '@/components/LuxuryMiniCart';
import { vi } from '@/locales/vi';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: vi.meta.title,
  description: vi.meta.description,
};

interface Props {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang="vi">
      <body className="antialiased">
        <ToastProvider>
          <ClientSettingsProvider>
            <I18nProvider>
              <LuxuryHeader />
              <LuxuryMiniCart />
              {children}
              <Footer />
            </I18nProvider>
          </ClientSettingsProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
