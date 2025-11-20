'use client';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { InterestSidebar } from "@/components/interests/InterestSidebar";
import { Header } from "./Header";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAppContext } from "@/contexts/AppContext";
import AppPage from "@/app/page";

export function AppLayout({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const { viewMode } = useAppContext();
  
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isGamePage = pathname.startsWith('/games');

  if (isAuthPage) {
    return <main>{children}</main>;
  }
  
  return (
    <SidebarProvider>
      <Sidebar>
        <InterestSidebar />
      </Sidebar>
      <SidebarInset className="flex flex-col @container/main">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-background text-foreground">
           {isGamePage ? children : <AppPage />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
