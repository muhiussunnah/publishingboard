import './globals.css';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { cookies } from 'next/headers';
import { Toaster } from 'react-hot-toast';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { DEFAULT_LANG, LANGS } from '@/lib/i18n/messages';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import ScrollToTop from '@/components/shared/ScrollToTop';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-jakarta', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-jetbrains', display: 'swap' });

export const metadata = {
  title: 'Famies · Publishing Board',
  description: 'Plan, approve and publish — the Famies publishing board. Built with Next.js + Supabase.',
};

export const viewport = { themeColor: '#ffffff' };

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get('lang')?.value;
  const lang = LANGS.includes(cookieLang) ? cookieLang : DEFAULT_LANG;

  return (
    <html lang={lang} data-scroll-behavior="smooth" className={`${jakarta.variable} ${mono.variable}`}>
      <body>
        <div className="aurora" aria-hidden />
        <div className="aurora-3" aria-hidden />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#0c0d11',
              border: '1px solid rgba(12, 13, 17, 0.12)',
              borderRadius: '12px',
              boxShadow: '0 10px 34px rgba(14, 16, 30, 0.08)',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#12bd8a', secondary: '#ffffff' } },
            error: { iconTheme: { primary: '#ff3d7f', secondary: '#ffffff' } },
          }}
        />
        <I18nProvider initialLang={lang}>
          <Navbar />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
          <ScrollToTop />
        </I18nProvider>
      </body>
    </html>
  );
}
