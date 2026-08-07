import React from 'react';
import { Inter } from 'next/font/google';
import Providers from '@/lib/Providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata = {
  title: {
    default: 'BloodLife — Intelligent Blood Donation Platform',
    template: '%s | BloodLife',
  },
  description: 'Development of an Intelligent Blood Donation Management Platform Integrated with an AI Chatbot for Donor and Hospital Support. Connecting donors, patients, and hospitals across Cambodia.',
  icons: { icon: '/favicon.ico' },
  keywords: ['blood donation', 'blood bank', 'donor management', 'AI chatbot', 'hospital support', 'Cambodia'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
