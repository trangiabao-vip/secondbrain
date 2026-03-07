
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
import { getMessaging, getToken } from "firebase/messaging";
import { doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';


export function Header() {
  const { selectedInterest, topicBreadcrumbs } = useAppContext();
  const { pathname } = useUIContext();
  const { auth, user, firestore, firebaseApp } = useFirebase();
  const { toast } = useToast();
  const [notificationStatus, setNotificationStatus] = useState('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (!user || !firestore || !firebaseApp) {
        toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Dịch vụ Firebase chưa sẵn sàng.",
        });
        return;
    }
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
        toast({
            variant: "destructive",
            title: "Trình duyệt không hỗ trợ",
            description: "Trình duyệt của bạn không hỗ trợ thông báo đẩy.",
        });
        return;
    }
    
    if (notificationStatus === 'granted') {
        toast({
            title: "Thông báo đã được bật",
            description: "Bạn đã cho phép nhận thông báo trên thiết bị này.",
        });
        return;
    }

    if (notificationStatus === 'denied') {
        toast({
            variant: "destructive",
            title: "Thông báo bị chặn",
            description: "Bạn đã chặn thông báo. Vui lòng thay đổi cài đặt trong trình duyệt.",
        });
        return;
    }

    try {
        const messaging = getMessaging(firebaseApp);
        const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;

        if (!vapidKey || vapidKey === 'YOUR_VAPID_KEY_HERE_FROM_FIREBASE_CONSOLE') {
            console.error('VAPID key is not configured.');
            toast({
                variant: 'destructive',
                title: 'Lỗi cấu hình',
                description: 'Vui lòng cấu hình VAPID key trong tệp .env.'
            });
            return;
        }

        const currentToken = await getToken(messaging, { vapidKey: vapidKey });

        if (currentToken) {
            console.log('FCM Token:', currentToken);
            const tokenRef = doc(firestore, 'fcmTokens', currentToken);
            setDocumentNonBlocking(tokenRef, {
                userId: user.uid,
                createdAt: serverTimestamp(),
            }, { merge: true });

            setNotificationStatus('granted');
            toast({
                title: "Đã bật thông báo!",
                description: "Bạn sẽ nhận được thông báo từ bây giờ.",
            });
        } else {
            console.log('No registration token available. Request permission to generate one.');
            setNotificationStatus('denied');
             toast({
                variant: "destructive",
                title: "Yêu cầu bị từ chối",
                description: "Bạn đã không cấp quyền nhận thông báo.",
            });
        }
    } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
        setNotificationStatus('denied');
        toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Đã có lỗi xảy ra khi đăng ký thông báo.",
        });
    }
  };


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

    return null;
  }


  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2 flex-1">
        <SidebarTrigger className="md:hidden" />
        <nav className="hidden md:flex items-center text-sm font-medium text-muted-foreground">
          <Button variant="ghost" size="sm" className="gap-1" asChild>
            <Link href="/dashboard"><Icons.home className="h-4 w-4" />Trang chủ</Link>
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
            <DropdownMenuItem onClick={handleEnableNotifications} disabled={notificationStatus === 'denied'}>
              {notificationStatus === 'granted' ? 'Thông báo đã bật' : 'Bật thông báo'}
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
