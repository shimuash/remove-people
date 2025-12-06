import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import type { ReactNode } from 'react';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar scroll={false} className="border-0 bg-background py-3" />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
