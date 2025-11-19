'use client';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAppContext } from "@/contexts/AppContext";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "../ui/avatar";
import { AddTopicDialog } from "../topics/AddTopicDialog";
import { AddGoalDialog } from "../goals/AddGoalDialog";
import { AddOrEditTaskDialog } from "../tasks/AddOrEditTaskDialog";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function Header() {
  const { selectedInterest, selectedTopic, selectInterest, selectTopic, viewMode } = useAppContext();
  const { auth, user } = useFirebase();
  const pathname = usePathname();

  const handleLogout = () => {
    signOut(auth);
  }

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  }

  const renderBreadcrumbs = () => {
    if (pathname.startsWith('/games')) {
      const gameName = pathname.split('/').pop()?.replace(/-/g, ' ');
      return (
        <>
          <Icons.right className="h-4 w-4" />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/games">Game</Link>
          </Button>
          {pathname !== '/games' && (
            <>
              <Icons.right className="h-4 w-4" />
              <Button variant="ghost" size="sm" className="text-foreground capitalize">
                {gameName}
              </Button>
            </>
          )}
        </>
      )
    }
    
    if (viewMode === 'global-schedule') {
      return (
        <>
          <Icons.right className="h-4 w-4" />
          <Button variant="ghost" size="sm" className="text-foreground">
            Lịch toàn cục
          </Button>
        </>
      )
    }

    if (viewMode === 'interests') {
       return (
        <>
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
        </>
       )
    }
    return null;
  }


  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2 flex-1">
        <SidebarTrigger className="md:hidden" />
        <nav className="hidden md:flex items-center text-sm font-medium text-muted-foreground">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => { selectInterest(null)}}>
            <Icons.home className="h-4 w-4" />
            Trang chủ
          </Button>
          {renderBreadcrumbs()}
        </nav>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Icons.add className="h-4 w-4" />
            <span className="sr-only">Tạo mới</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <AddTopicDialog>
            <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full"
              disabled={!selectedInterest}
            >
              <Icons.topic className="mr-2 h-4 w-4" />
              Chủ đề mới...
            </button>
          </AddTopicDialog>
          <AddGoalDialog>
             <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                <Icons.goal className="mr-2 h-4 w-4" />
                Mục tiêu mới...
             </button>
          </AddGoalDialog>
          <AddOrEditTaskDialog mode="add">
            <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                <Icons.task className="mr-2 h-4 w-4" />
                Nhiệm vụ mới...
            </button>
          </AddOrEditTaskDialog>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{getInitials(user.email || 'A')}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Tài khoản</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

    </header>
  );
}
