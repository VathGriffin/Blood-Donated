import React from 'react';
import Providers from '@/lib/Providers';

export const metadata = {
  title: 'Blood Donated',
  description: 'Blood donation management platform — connect donors with patients across Cambodia',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
