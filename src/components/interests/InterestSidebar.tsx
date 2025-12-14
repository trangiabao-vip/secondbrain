
'use client';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  SidebarInput,
} from "@/components/ui/sidebar";
import { useAppContext } from "@/contexts/AppContext";
import { Icons } from "@/components/icons";
import { AddInterestDialog } from "./AddInterestDialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditInterestDialog } from "./EditInterestDialog";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSearch } from "../search/GlobalSearchDialog";
import { useFirebase } from "@/firebase";

export function InterestSidebar() {
  const { interests, selectedInterestId, selectInterest, deleteInterest, viewMode, setViewMode, isDataLoading } = useAppContext();
  const { user } = useFirebase();

  const { setOpen: setSearchOpen } = useSearch();
  const pathname = usePathname();
  const isGameView = pathname.startsWith('/games');
  const isSalesPageView = pathname.startsWith('/sales-pages');
  const isScheduleView = viewMode === 'global-schedule' && !isGameView && !isSalesPageView;
  const isDashboardView = viewMode === 'dashboard' && !isGameView && !isSalesPageView;

  const isActive = (id: string) => {
    return selectedInterestId === id && !isGameView && !isScheduleView && !isDashboardView && !isSalesPageView
  }

  const renderInterests = () => {
    if (isDataLoading) {
      return (
        <div className="p-2 space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      );
    }
    
    return interests.map((interest) => (
        <SidebarMenuItem key={interest.id}>
            <SidebarMenuButton
                asChild
                isActive={isActive(interest.id)}
                tooltip={interest.name}
            >
                <Link href="/" onClick={() => selectInterest(interest.id)}>
                <Icons.interest />
                <span>{interest.name}</span>
                </Link>
            </SidebarMenuButton>
            <div className="absolute top-1.5 right-1">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/menu-item:opacity-100">
                    <Icons.ellipsis className="h-4 w-4" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                <EditInterestDialog interestId={interest.id}>
                    <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                        <Icons.edit className="mr-2 h-4 w-4" />
                        Đổi tên
                    </button>
                </EditInterestDialog>
                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteInterest(interest.id); }}>
                    <Icons.delete className="mr-2 h-4 w-4" />
                    Xóa
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            </div>
        </SidebarMenuItem>
    ));
  };


  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <Icons.logo className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-semibold">Trung tâm Sở thích</h1>
          </div>
        </div>
        <div className="p-2">
          <div className="relative">
            <Icons.search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <SidebarInput 
              placeholder="Tìm kiếm..." 
              className="pl-8"
              onFocus={() => setSearchOpen(true)}
            />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
           <SidebarMenuItem>
             <SidebarMenuButton
                asChild
                isActive={isScheduleView}
                tooltip="Lịch"
              >
                <Link href="/" onClick={() => setViewMode && setViewMode('global-schedule')}>
                  <Icons.calendar />
                  <span>Lịch</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isGameView}
                tooltip="Game"
              >
                <Link href="/games">
                  <Icons.game />
                  <span>Game</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isSalesPageView}
                tooltip="Sales Pages"
              >
                <Link href="/sales-pages">
                  <Icons.salesPage />
                  <span>Sales Pages</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isDashboardView}
                tooltip="Tổng hợp"
              >
                <Link href="/" onClick={() => setViewMode && setViewMode('dashboard')}>
                  <Icons.dashboard />
                  <span>Tổng hợp</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
        <SidebarMenu>
          {renderInterests()}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t">
        <AddInterestDialog>
            <Button variant="ghost" className="w-full justify-start">
              <Icons.add className="mr-2 h-4 w-4" />
              Thêm sở thích mới
            </Button>
        </AddInterestDialog>
      </SidebarFooter>
    </>
  );
}
