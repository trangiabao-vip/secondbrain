'use client';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { InterestSidebar } from "@/components/interests/InterestSidebar";
import { useAppContext } from "@/contexts/AppContext";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { TopicGrid } from "@/components/topics/TopicGrid";
import { TopicDetailView } from "@/components/details/TopicDetailView";
import { Header } from "./Header";

export function AppLayout() {
  const { selectedInterestId, selectedTopicId } = useAppContext();

  const renderContent = () => {
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
