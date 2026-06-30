// Pass-through. The authenticated chrome lives in (authed)/layout.tsx so the
// login route renders without the admin header/nav.
export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
