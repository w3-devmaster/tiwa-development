import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tiwa - AI Orchestrator System',
  description: 'AI Organization Monitor & Orchestrator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
