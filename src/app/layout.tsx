import type { Metadata } from 'next';
import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export const metadata: Metadata = {
  title: 'Success India - Official Seminar & Leadership Portal',
  description: 'Reserve seats for Success India leadership development seminars, recruitment training, weekly strategy sessions, and local Tamil Nadu chapter meetups.',
  keywords: 'Success India, seminar booking, leadership development, chapter meetups, Tamil Nadu, Chromepet Chennai, direct selling workshops',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Success India - Official Seminar & Leadership Portal',
    description: 'Official seminar registration, leadership development, and chapter meetup portal for Success India.',
    type: 'website',
    images: ['/favicon.png'],
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
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
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
