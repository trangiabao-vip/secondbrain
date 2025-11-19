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
    // Priority 1: Handle explicit view modes from sidebar first.
    if (viewMode === 'global-schedule') {
      return <GlobalScheduleView />;
    }
    if (viewMode === 'games') {
      // If the view mode is 'games', always show the main game menu.
      // The individual game pages are handled by the next condition.
      return <GameView />;
    }

    // Priority 2: If not in a specific view mode, check if we are on a page with specific children content.
    // This handles rendering for individual game pages like /games/lucky-pin.
    if (pathname.startsWith('/games/')) {
      return children;
    }
    
    // Priority 3: Interest-based views
    if (viewMode === 'interests') {
      if (selectedTopicId) {
        return <TopicDetailView key={selectedTopicId} />;
      }
      if (selectedInterestId) {
        return <TopicGrid key={selectedInterestId} />;
      }
    }
    
    // Priority 4: Fallback to welcome screen.
    // If no interest is selected and there are interests, it means we are at the root
    if (interests.length === 0) {
      return <WelcomeScreen />;
    }
    
    // If we land on a page that is not handled by a view mode and has no children.
    if (!selectedInterestId) {
       return <WelcomeScreen />;
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
