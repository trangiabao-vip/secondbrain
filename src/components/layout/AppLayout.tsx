'use client';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { InterestSidebar } from "@/components/interests/InterestSidebar";
import { Header } from "./Header";
import type { ReactNode } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { usePathname } from "next/navigation";
import { GlobalScheduleView } from "../details/GlobalScheduleView";
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
    // Priority 1: Handle non-interest view modes
    if (viewMode === 'global-schedule') {
      return <GlobalScheduleView />;
    }
    
    // Priority 2: Handle page-specific children for routes like /games/*
    // The GameView is now its own page at /games, so it will be rendered as children.
    if (pathname.startsWith('/games')) {
      return children;
    }

    // Priority 3: Handle interests view mode
    if (viewMode === 'interests') {
      if (selectedTopicId) {
        return <TopicDetailView key={selectedTopicId} />;
      }
      if (selectedInterestId) {
        return <TopicGrid key={selectedInterestId} />;
      }
    }
    
    // Priority 4: Fallback logic
    if (!isDataLoading && interests.length === 0) {
      return <WelcomeScreen />;
    }
    // This is the default view when no interest is selected.
    if (!selectedInterestId && viewMode === 'interests') {
       return <WelcomeScreen />;
    }

    // Fallback for any other case (e.g. root path '/')
    if (children) {
      return children;
    }
    
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
