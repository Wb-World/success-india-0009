import type { Metadata } from 'next';
import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export const metadata: Metadata = {
  title: 'Success Team - Official Event & Leadership Portal',
  description: 'Reserve seats for Success Team leadership development seminars, recruitment training, weekly strategy sessions, and local Tamil Nadu chapter meetups.',
  keywords: 'Success Team, seminar booking, leadership development, chapter meetups, Tamil Nadu, Chromepet Chennai, direct selling workshops',
  icons: {
    icon: [
      { url: '/favicon.png?v=2', type: 'image/png', sizes: '32x32' },
      { url: '/favicon.png?v=2', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: '/favicon.png?v=2',
    apple: { url: '/favicon.png?v=2', sizes: '180x180' },
  },
  openGraph: {
    title: 'Success Team - Official Event & Leadership Portal',
    description: 'Official seminar registration, leadership development, and chapter meetup portal for Success Team.',
    type: 'website',
    images: ['/favicon.png?v=2'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png?v=2" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png?v=2" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png?v=2" />
        <link rel="shortcut icon" href="/favicon.png?v=2" />
      </head>
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
