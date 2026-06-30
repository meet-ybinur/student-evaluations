import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "meet — student evaluations",
  description:
    "Anonymous program evaluation for meet — the middle east entrepreneurs of tomorrow. In partnership with MIT.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
