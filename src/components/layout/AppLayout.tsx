'use client';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { InterestSidebar } from "@/components/interests/InterestSidebar";
import { useAppContext } from "@/contexts/AppContext";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { TopicGrid } from "@/components/topics/TopicGrid";
import { TopicDetailView } from "@/components/details/TopicDetailView";
import { Header } from "./Header";
import { GlobalScheduleView } from "../details/GlobalScheduleView";
import { GameView } from "../games/GameView";
import { usePathname } from 'next/navigation';

export function AppLayout({ children }: { children?: React.ReactNode }) {
  const { selectedInterestId, selectedTopicId, viewMode } = useAppContext();
  const pathname = usePathname();

  const renderContent = () => {
    // If there are children (from a Next.js page), render them.
    if (children) {
      return children;
    }

    if (pathname.startsWith('/games')) {
      return null;
    }

    if (viewMode === 'global-schedule') {
      return <GlobalScheduleView />;
    }
    if (viewMode === 'games') {
      return <GameView />;
    }
    if (selectedTopicId) {
      return <TopicDetailView key={selectedTopicId} />;
    }
    if (selectedInterestId) {
      return <TopicGrid key={selectedInterestId} />;
    }
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
