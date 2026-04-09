import type { Metadata, Viewport } from 'next';
import { Outfit, DM_Sans, Noto_Sans_Arabic } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import './globals.css';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  adjustFontFallback: false,
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: '--font-noto-arabic',
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LYFE — Your Life, Managed',
  description: 'Goal-driven personal life management. Tasks, goals, workouts, and streaks in one place.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LYFE',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#0D0D12' },
    { media: '(prefers-color-scheme: light)', color: '#F4F3F0' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${dmSans.variable} ${notoSansArabic.variable} h-full`}
    >
      <head>
        {/* Prevent theme flash on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('lyfe-theme');var s=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';if((t||s)==='dark')document.documentElement.classList.add('dark');})();`,
          }}
        />
      </head>
      <body className="h-full bg-bg dark:bg-bg-dark text-text dark:text-text-dark font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
