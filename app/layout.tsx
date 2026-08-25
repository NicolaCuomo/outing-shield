import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Outing Shield',
  description: 'AI Nowcasting & Outing Alerts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
