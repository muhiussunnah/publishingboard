import './globals.css';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { cookies } from 'next/headers';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { DEFAULT_LANG, LANGS } from '@/lib/i18n/messages';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-jakarta', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-jetbrains', display: 'swap' });

export const metadata = {
  title: 'Famies · Publiceringsbord',
  description: 'Planera, godkänn och publicera — Famies publiceringsbord. Next.js + Supabase.',
};

export const viewport = { themeColor: '#ffffff' };

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get('lang')?.value;
  const lang = LANGS.includes(cookieLang) ? cookieLang : DEFAULT_LANG;

  return (
    <html lang={lang} className={`${jakarta.variable} ${mono.variable}`}>
      <body>
        <div className="aurora" aria-hidden />
        <div className="aurora-3" aria-hidden />
        <I18nProvider initialLang={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
