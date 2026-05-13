
'use client';
import React, { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAppContext } from "@/contexts/AppContext";
import { useUIContext } from "@/contexts/UIContext";
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
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";


export function Header() {
  const { selectedInterest, topicBreadcrumbs } = useAppContext();
  const { pathname } = useUIContext();
  const { auth, user } = useFirebase();
  const { toast } = useToast();

  const handleLogout = () => {
    signOut(auth);
  }

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  }

  const renderBreadcrumbs = () => {
    if (pathname.startsWith('/interests')) {
      return (
        <>
          {selectedInterest && (
            <>
              <Icons.right className="h-4 w-4" />
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/interests/${selectedInterest.id}`}>{selectedInterest.name}</Link>
              </Button>
            </>
          )}
          {topicBreadcrumbs.map((topic, index) => (
             <React.Fragment key={topic.id}>
                <Icons.right className="h-4 w-4" />
                <Button 
                    variant="ghost" 
                    asChild
                    size="sm" 
                    className={index === topicBreadcrumbs.length -1 ? 'text-foreground' : ''}
                >
                    <Link href={`/interests/${topic.interestId}/${topic.id}`}>{topic.name}</Link>
                </Button>
             </React.Fragment>
          ))}
        </>
      )
    }

    if (pathname.startsWith('/dashboard')) {
        return <><Icons.right className="h-4 w-4" /><span className="text-sm font-medium">Tổng hợp</span></>;
    }
     if (pathname.startsWith('/schedule')) {
        return <><Icons.right className="h-4 w-4" /><span className="text-sm font-medium">Lịch</span></>;
    }
     if (pathname.startsWith('/games')) {
        const pathSegments = pathname.split('/').filter(Boolean);
        return (
            <>
                <Icons.right className="h-4 w-4" />
                <Button variant="ghost" size="sm" asChild><Link href="/games">Game</Link></Button>
                {pathSegments.length > 1 && (
                    <>
                        <Icons.right className="h-4 w-4" />
                        <span className="text-sm font-medium capitalize">{pathSegments[1].replace(/-/g, ' ')}</span>
                    </>
                )}
            </>
        )
    }
    if (pathname.startsWith('/sales-pages')) {
        return <><Icons.right className="h-4 w-4" /><span className="text-sm font-medium">Trang bán hàng</span></>;
    }
    if (pathname.startsWith('/channels')) {
        return <><Icons.right className="h-4 w-4" /><span className="text-sm font-medium">Kênh</span></>;
    }
     if (pathname.startsWith('/profile')) {
        return <><Icons.right className="h-4 w-4" /><span className="text-sm font-medium">Hồ sơ</span></>;
    }
    if (pathname.startsWith('/notifications')) {
        return <><Icons.right className="h-4 w-4" /><span className="text-sm font-medium">Thông báo</span></>;
    }
    if (pathname.startsWith('/notes')) {
        return <><Icons.right className="h-4 w-4" /><span className="text-sm font-medium">Ghi chú</span></>;
    }


    return null;
  }


  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2 flex-1">
        <SidebarTrigger className="md:hidden" />
        <nav className="hidden md:flex items-center text-sm font-medium text-muted-foreground">
          <Button variant="ghost" size="sm" className="gap-1" asChild>
            <Link href="/schedule"><Icons.home className="h-4 w-4" />Trang chủ</Link>
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
             <DropdownMenuItem asChild>
                <Link href="/profile">
                    <Icons.businessCard className="mr-2 h-4 w-4" />
                    Hồ sơ của bạn
                </Link>
            </DropdownMenuItem>
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
