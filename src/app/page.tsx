'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { GlobalScheduleView } from '@/components/details/GlobalScheduleView';
import { TopicDetailView } from '@/components/details/TopicDetailView';
import { TopicGrid } from '@/components/topics/TopicGrid';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { useAppContext } from '@/contexts/AppContext';

export default function AppPage() {
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

    // This handles the 'interests' view mode
    if (viewMode === 'interests') {
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

    // Fallback for when no viewmode matches.
    return <WelcomeScreen />;
  };

  return (
    <AuthGuard>
      {renderMainContent()}
    </AuthGuard>
  );
}
