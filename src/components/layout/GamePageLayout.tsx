'use client';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { InterestSidebar } from "@/components/interests/InterestSidebar";
import { Header } from "./Header";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// A slimmed down version of AppLayout that doesn't use AppContext
export function GamePageLayout({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage) {
    return <main>{children}</main>;
  }
  
  return (
    <SidebarProvider>
      <Sidebar>
        <InterestSidebar />
      </Sidebar>
      <SidebarInset className="flex flex-col @container/main">
        <Header isInGameLayout={true}/>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-background text-foreground">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
