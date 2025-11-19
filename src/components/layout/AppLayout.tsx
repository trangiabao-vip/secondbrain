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
  const { selectedInterestId, selectedTopicId, viewMode, interests, isDataLoading } = useAppContext();
  const pathname = usePathname();
  
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  const renderContent = () => {
    // Priority 1: Handle view modes set by the sidebar, which override any page content.
    if (viewMode === 'global-schedule') {
      return <GlobalScheduleView />;
    }
    if (viewMode === 'games') {
      return <GameView />;
    }
    if (viewMode === 'interests') {
      if (selectedTopicId) {
        return <TopicDetailView key={selectedTopicId} />;
      }
      if (selectedInterestId) {
        return <TopicGrid key={selectedInterestId} />;
      }
      // If viewMode is 'interests' but no interest is selected, show welcome screen
      return <WelcomeScreen />;
    }

    // Priority 2: If no overriding view mode, render page-specific children (e.g., for /games/lucky-pin)
    if (children) {
       // This will render the content from page.tsx for routes like /games/*
       return children;
    }
    
    // Priority 3: Fallback logic if no viewMode is active and no children are provided.
    // This is the default state when landing on the root of the app.
    if (!isDataLoading && interests.length === 0) {
      return <WelcomeScreen />;
    }

    // If there are interests but none is selected, show welcome screen.
    if (!selectedInterestId) {
       return <WelcomeScreen />;
    }

    // This should not be reached in normal flow, but as a safe fallback.
    return null;
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
