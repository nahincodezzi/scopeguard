import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "ScopeGuard AI — Catch Scope Creep & Bill Paid Change Orders",
  description:
    "B2B micro-SaaS for digital agencies and freelancers. Check client messages against project SOWs and turn scope creep into paid change orders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-ink antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
