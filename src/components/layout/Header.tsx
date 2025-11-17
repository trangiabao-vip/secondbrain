'use client';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAppContext } from "@/contexts/AppContext";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function Header() {
  const { selectedInterest, selectedTopic, selectInterest, selectTopic, viewMode, setViewMode } = useAppContext();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <nav className="hidden md:flex items-center text-sm font-medium text-muted-foreground">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => { selectInterest(null)}}>
            <Icons.home className="h-4 w-4" />
            Trang chủ
          </Button>
          {selectedInterest && (
            <>
              <Icons.right className="h-4 w-4" />
              <Button variant="ghost" size="sm" onClick={() => selectTopic(null)}>
                {selectedInterest.name}
              </Button>
            </>
          )}
          {selectedTopic && (
            <>
              <Icons.right className="h-4 w-4" />
              <Button variant="ghost" size="sm" className="text-foreground">
                {selectedTopic.name}
              </Button>
            </>
          )}
           {viewMode === 'global-schedule' && (
            <>
              <Icons.right className="h-4 w-4" />
              <Button variant="ghost" size="sm" className="text-foreground">
                Lịch toàn cục
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
