'use client';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { InterestSidebar } from "@/components/interests/InterestSidebar";
import { Header } from "./Header";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TopicGrid } from "../topics/TopicGrid";
import { WelcomeScreen } from "../WelcomeScreen";
import { useAppContext } from "@/contexts/AppContext";
import { TopicDetailView } from "../details/TopicDetailView";

function AppContent() {
    const { selectedInterest, selectedTopicId } = useAppContext();
    
    if (selectedTopicId) {
        return <TopicDetailView />;
    }

    if (selectedInterest) {
        return <TopicGrid />;
    }
    
    return <WelcomeScreen />
}

export function AppLayout({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isGenericPage = !pathname.startsWith('/interests') && pathname !== '/';

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
          {isGenericPage ? children : <AppContent />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
