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
  
  return (
    <AuthGuard>
       <div />
    </AuthGuard>
  );
}
