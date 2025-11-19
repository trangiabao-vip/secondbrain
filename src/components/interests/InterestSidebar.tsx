'use client';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAppContext } from "@/contexts/AppContext";
import { Icons } from "@/components/icons";
import { AddInterestDialog } from "./AddInterestDialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditInterestDialog } from "./EditInterestDialog";
import { Skeleton } from "@/components/ui/skeleton";

export function InterestSidebar() {
  const { interests, selectedInterestId, selectInterest, deleteInterest, viewMode, setViewMode, isDataLoading } = useAppContext();

  if (isDataLoading) {
    return (
      <>
        <SidebarHeader className="border-b p-2">
          <Skeleton className="h-8 w-full" />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t">
          <Skeleton className="h-10 w-full" />
        </SidebarFooter>
      </>
    )
  }

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <Icons.logo className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-semibold">Trung tâm Sở thích</h1>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
           <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setViewMode('global-schedule')}
                isActive={viewMode === 'global-schedule'}
                tooltip="Lịch"
              >
                <Icons.calendar />
                <span>Lịch</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setViewMode('games')}
                isActive={viewMode === 'games'}
                tooltip="Game"
              >
                <Icons.game />
                <span>Game</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setViewMode('watch-together')}
                isActive={viewMode === 'watch-together'}
                tooltip="Xem phim chung"
              >
                <Icons.watchTogether />
                <span>Xem phim chung</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
        <SidebarMenu>
          {interests.map((interest) => (
            <SidebarMenuItem key={interest.id}>
              <SidebarMenuButton
                onClick={() => selectInterest(interest.id)}
                isActive={selectedInterestId === interest.id && viewMode === 'interests'}
                tooltip={interest.name}
              >
                <Icons.interest />
                <span>{interest.name}</span>
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
          ))}
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
