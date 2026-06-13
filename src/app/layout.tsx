import type { Metadata } from 'next';
import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export const metadata: Metadata = {
  title: 'CyberStrike 2026 | Global Cyber Exploitation & Defense Summit',
  description: 'Secure your access coordinates for CyberStrike 2026. Select session tracks, allocate terminal slots, and join the elite CTF cyber defense networks.',
  keywords: 'hacker summit, cyber security conference, zero-day, ctf, cryptanalysis, offensive ai, hardware hacking',
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
