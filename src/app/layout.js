import './globals.css';
import { Fraunces, Sora, JetBrains_Mono } from 'next/font/google';
import { cookies } from 'next/headers';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { DEFAULT_LANG, LANGS } from '@/lib/i18n/messages';

const fraunces = Fraunces({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-fraunces', display: 'swap' });
const sora = Sora({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-sora', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-jetbrains', display: 'swap' });

export const metadata = {
  title: 'Famies · Publiceringsbord',
  description: 'Planera, godkänn och publicera — Famies publiceringsbord. Built with Next.js + Supabase.',
};

export const viewport = { themeColor: '#ff3d7f' };

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get('lang')?.value;
  const lang = LANGS.includes(cookieLang) ? cookieLang : DEFAULT_LANG;

  return (
    <html lang={lang} className={`${fraunces.variable} ${sora.variable} ${mono.variable}`}>
      <body>
        <I18nProvider initialLang={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
