"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { CommandMenu } from "./CommandMenu";
import { OnboardingModal } from "./OnboardingModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicApproval = pathname?.startsWith("/approve");

  if (isPublicApproval) {
    return <main className="min-h-screen bg-bg">{children}</main>;
  }

  return (
    <div className="min-h-screen flex bg-bg">
      <Sidebar />
      <div className="flex-1 md:pl-[232px] flex flex-col min-w-0">
        <main className="flex-1 w-full max-w-[1240px] mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <CommandMenu />
      <OnboardingModal />
    </div>
  );
}
