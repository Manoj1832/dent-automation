import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/providers/providers';

export const metadata: Metadata = {
  title: 'SREE ARUMUGAVADIVU MULTISPECIALITY DENTAL & IMPLANT CLINIC',
  description:
    'Production-grade dental clinic management and automation system. Digitize patient records, automate appointments, and streamline clinic operations.',
  keywords: ['dental', 'clinic', 'management', 'healthcare', 'appointments', 'patients'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
