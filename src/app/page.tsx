'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { GlobalScheduleView } from '@/components/details/GlobalScheduleView';
import { TopicDetailView } from '@/components/details/TopicDetailView';
import { TopicGrid } from '@/components/topics/TopicGrid';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppContext } from '@/contexts/AppContext';

function AppPage() {
  const { 
    viewMode, 
    selectedInterestId, 
    selectedTopicId, 
    interests, 
    isDataLoading 
  } = useAppContext();

  const renderMainContent = () => {
    if (viewMode === 'global-schedule') {
      return <GlobalScheduleView />;
    }
  
    // Default to 'interests' view logic
    if (selectedTopicId) {
      return <TopicDetailView key={selectedTopicId} />;
    }
  
    if (selectedInterestId) {
      return <TopicGrid key={selectedInterestId} />;
    }
  
    // This will show welcome screen if data is loading OR if there are no interests.
    if (isDataLoading || interests.length === 0) {
      return <WelcomeScreen />;
    }
  
    // Default view when no specific item is selected but data is loaded.
    return <WelcomeScreen />;
  };

  return (
    <AuthGuard>
      {renderMainContent()}
    </AuthGuard>
  );
}


export default function Home() {
  return (
    <AppLayout>
      <AppPage />
    </AppLayout>
  )
}