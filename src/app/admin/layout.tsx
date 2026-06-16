export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Admin pages are completely standalone — no public Navbar / Footer.
  return <>{children}</>;
}
