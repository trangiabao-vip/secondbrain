'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { useAppContext } from "@/contexts/AppContext";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { GlobalScheduleView } from "@/components/details/GlobalScheduleView";
import { TopicDetailView } from "@/components/details/TopicDetailView";
import { TopicGrid } from "@/components/topics/TopicGrid";
import { WelcomeScreen } from "@/components/WelcomeScreen";

const games = [
  {
    id: 'true-or-dare',
    title: 'True or Dare',
    description: 'Một trò chơi cổ điển để khám phá bí mật hoặc thực hiện những thử thách táo bạo.',
    icon: Icons.trueOrDare,
    href: '/games/true-or-dare',
  },
  {
    id: 'lucky-pin',
    title: 'Lucky Pin',
    description: 'Quay bánh xe may mắn để xem ai là người được chọn cho thử thách tiếp theo.',
    icon: Icons.luckyPin,
    href: '/games/lucky-pin',
  },
  {
    id: 'watch-together',
    title: 'Xem phim chung',
    description: 'Cùng bạn bè và người thân xem những bộ phim yêu thích trong thời gian thực.',
    icon: Icons.watchTogether,
    href: '#', // Placeholder link
  }
];

function GamesView() {
  const { setViewMode } = useAppContext();
  const pathname = usePathname();

  useEffect(() => {
    // Set viewMode to games only if we are on the main games page
    if (pathname === '/games') {
      setViewMode('games');
    }
  }, [setViewMode, pathname]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Khu vực Game</h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {games.map((game) => (
          <Link href={game.href} key={game.id} className="no-underline">
            <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg h-full">
              <CardHeader className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <game.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg font-bold">{game.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-grow">
                <CardDescription>{game.description}</CardDescription>
              </CardContent>
              <CardFooter className="p-4 pt-0 mt-auto">
                  <Button className="w-full" disabled={game.href === '#'}>
                      Chơi ngay
                  </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

// This is the component that will be rendered by the Next.js router for this page.
export default function GamesPage() {
  const { 
    viewMode, 
    selectedInterestId, 
    selectedTopicId, 
    interests, 
    isDataLoading 
  } = useAppContext();

  // If viewMode has been changed by the sidebar, render the corresponding view.
  if (viewMode === 'global-schedule') {
    return <GlobalScheduleView />;
  }

  if (viewMode === 'interests') {
    if (selectedTopicId) {
      return <TopicDetailView key={selectedTopicId} />;
    }
    if (selectedInterestId) {
      return <TopicGrid key={selectedInterestId} />;
    }
    return <WelcomeScreen />;
  }

  // Otherwise, render the games view.
  return (
    <AuthGuard>
        <GamesView />
    </AuthGuard>
  );
}
