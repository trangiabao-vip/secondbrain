'use client';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { InterestSidebar } from "@/components/interests/InterestSidebar";
import { Header } from "./Header";
import type { ReactNode } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { usePathname } from "next/navigation";
import { GlobalScheduleView } from "../details/GlobalScheduleView";
import { GameView } from "../games/GameView";
import { TopicDetailView } from "../details/TopicDetailView";
import { TopicGrid } from "../topics/TopicGrid";
import { WelcomeScreen } from "../WelcomeScreen";

export function AppLayout({ children }: { children?: ReactNode }) {
  const { selectedInterestId, selectedTopicId, viewMode } = useAppContext();
  const pathname = usePathname();
  
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  const renderContent = () => {
    // If there are children (from a Next.js page), render them.
    if (children) {
      // Check if we are on a specific page that should render its own content.
      const isGamePage = pathname.startsWith('/games/');
      if (isGamePage) {
        return children;
      }
    }
    
    if (viewMode === 'global-schedule') {
      return <GlobalScheduleView />;
    }
    if (viewMode === 'games') {
        const isGameDetailsPage = pathname.startsWith('/games/');
        if (isGameDetailsPage) {
            return children;
        }
        return <GameView />;
    }
    if (selectedTopicId) {
      return <TopicDetailView key={selectedTopicId} />;
    }
    if (selectedInterestId) {
      return <TopicGrid key={selectedInterestId} />;
    }
    
    if (pathname === '/') {
        return <WelcomeScreen />;
    }

    return children;
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <InterestSidebar />
      </Sidebar>
      <SidebarInset className="flex flex-col @container/main">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-background text-foreground">
          {renderContent()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
