'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAppContext } from '@/contexts/AppContext';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { TopicGrid } from '@/components/topics/TopicGrid';
import { TopicDetailView } from '@/components/details/TopicDetailView';
import { GlobalScheduleView } from '@/components/details/GlobalScheduleView';
import { GameView } from '@/components/games/GameView';

export default function AppPage() {
  const { selectedInterestId, selectedTopicId, viewMode } = useAppContext();
  
  const renderContent = () => {
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
    <AuthGuard>
      {renderContent()}
    </AuthGuard>
  );
}
