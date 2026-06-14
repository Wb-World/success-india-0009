import type { Metadata } from 'next';
import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export const metadata: Metadata = {
  title: 'Success India | Seminar & Chapter Meetup Booking Portal',
  description: 'Reserve seats for Success India leadership development seminars, recruitment training, weekly strategy sessions, and local Tamil Nadu chapter meetups.',
  keywords: 'Success India, seminar booking, leadership development, chapter meetups, Tamil Nadu, Chromepet Chennai, direct selling workshops',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
