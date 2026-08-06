import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartProvider } from '@/components/CartProvider';
import { SessionTracker } from '@/components/SessionTracker';

export const metadata: Metadata = {
  title: 'Waqt | وقت — Timeless Elegance',
  description: 'Premium watch store — curated collection of luxury and everyday watches, delivered to your doorstep.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <CartProvider>
          <SessionTracker />
          <Navbar />
          <main className="min-h-screen pt-16 sm:pt-20">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
