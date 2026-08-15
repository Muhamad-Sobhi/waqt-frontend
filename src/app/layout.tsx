import type { Metadata, Viewport } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartProvider } from '@/components/CartProvider';
import { SessionTracker } from '@/components/SessionTracker';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-arabic' });

export const metadata: Metadata = {
  title: 'Waqt | وقت — Timeless Elegance',
  description: 'Premium watch store — curated collection of luxury and everyday watches, delivered to your doorstep.',
  icons: {
    icon: '/logo.png',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className={`${inter.variable} ${cairo.variable}`}>
      <body suppressHydrationWarning>
        <CartProvider>
          <SessionTracker />
          <Navbar />
          <main className="min-h-screen pt-16 sm:pt-20">
            {children}
          </main>
          <Footer />
        </CartProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
