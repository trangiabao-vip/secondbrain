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
  const { selectedInterestId, selectedTopicId, viewMode, interests } = useAppContext();
  const pathname = usePathname();
  
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  const renderContent = () => {
    // Priority 1: Specific view modes set by the sidebar
    if (viewMode === 'global-schedule') {
      return <GlobalScheduleView />;
    }
    if (viewMode === 'games') {
      // If we are on a specific game page, render its content
      if (pathname.startsWith('/games/')) {
        return children;
      }
      // Otherwise, show the main game menu
      return <GameView />;
    }
    
    // Priority 2: Interest-based views
    if (viewMode === 'interests') {
      if (selectedTopicId) {
        return <TopicDetailView key={selectedTopicId} />;
      }
      if (selectedInterestId) {
        return <TopicGrid key={selectedInterestId} />;
      }
    }
    
    // Priority 3: Fallback to welcome screen or other page children
    // If no interest is selected and there are interests, it means we are at the root
    if (pathname === '/' && interests.length === 0) {
      return <WelcomeScreen />;
    }
    
    // If we land on a page that is not handled by a view mode (like a game page initially)
    if (children) {
      return children;
    }

    // Default to welcome screen if nothing else matches
    return <WelcomeScreen />;
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
