import type { Metadata } from 'next';
import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export const metadata: Metadata = {
  title: 'GreenWheels | Premium Bus Ticket Booking',
  description: 'Book premium and luxury bus tickets online with ease. Select your favorite seats, make instant payments, and enjoy a safe journey with GreenWheels.',
  keywords: 'bus ticket, online booking, luxury travel, bus seating map, green wheels, fast transit',
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
