import { inter } from '@/lib/fonts';
import Providers from '@/lib/Providers';

export const metadata = {
  title: {
    default: 'Blood Donated — Blood Donation Platform',
    template: '%s | Blood Donated',
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
