'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { GlobalScheduleView } from '@/components/details/GlobalScheduleView';
import { TopicDetailView } from '@/components/details/TopicDetailView';
import { TopicGrid } from '@/components/topics/TopicGrid';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { useAppContext } from '@/contexts/AppContext';

function MainContent() {
  const { 
    viewMode, 
    selectedInterestId, 
    selectedTopicId, 
    interests, 
    isDataLoading 
  } = useAppContext();

  if (viewMode === 'global-schedule') {
    return <GlobalScheduleView />;
  }

  // This handles the 'interests' view mode
  if (selectedTopicId) {
    return <TopicDetailView key={selectedTopicId} />;
  }

  if (selectedInterestId) {
    return <TopicGrid key={selectedInterestId} />;
  }

  if (!isDataLoading && interests.length === 0) {
    return <WelcomeScreen />;
  }

  // Default view when data is loading or when no specific item is selected
  return <WelcomeScreen />;
}


export default function AppPage() {
  return (
    <AuthGuard>
      <MainContent />
    </AuthGuard>
  );
}
