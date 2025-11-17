'use client';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAppContext } from "@/contexts/AppContext";
import { Icons } from "@/components/icons";
import { AddInterestDialog } from "./AddInterestDialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function InterestSidebar() {
  const { interests, selectedInterestId, selectInterest, deleteInterest } = useAppContext();

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 p-2">
          <Icons.logo className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-semibold">Trung tâm Sở thích</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {interests.map((interest) => (
            <SidebarMenuItem key={interest.id}>
              <SidebarMenuButton
                onClick={() => selectInterest(interest.id)}
                isActive={selectedInterestId === interest.id}
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
            Thêm sở thích
          </Button>
        </AddInterestDialog>
      </SidebarFooter>
    </>
  );
}
