
'use client';
import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isPast, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { NotificationDialog } from './NotificationDialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const getDateFromFirestore = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date.toDate === 'function') return date.toDate(); // Firestore Timestamp
    if (date.seconds) return new Date(date.seconds * 1000); // Another form of timestamp
    if (typeof date === 'string') {
        const parsed = parseISO(date);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
    }
    return null;
};


function NotificationManager() {
  const { notifications, isDataLoading, deleteNotification } = useAppContext();

  if (isDataLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const sortedNotifications = [...notifications].sort((a, b) => {
    const dateA = getDateFromFirestore(a.sendAt) || new Date(0);
    const dateB = getDateFromFirestore(b.sendAt) || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">Quản lý Thông báo</h2>
            <p className="text-muted-foreground">Lên lịch và quản lý thông báo đẩy cho người dùng.</p>
        </div>
        <NotificationDialog mode="add">
          <Button>
            <Icons.add className="mr-2 h-4 w-4" />
            Tạo thông báo
          </Button>
        </NotificationDialog>
      </div>

      {sortedNotifications.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {sortedNotifications.map((notification) => {
             const sendDate = getDateFromFirestore(notification.sendAt);
             const hasBeenSent = notification.isSent || (sendDate && isPast(sendDate));

            return (
              <Card key={notification.id} className={cn("flex flex-col", hasBeenSent && "bg-muted/50")}>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{notification.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {notification.body}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                   {sendDate && (
                     <p className="text-sm text-muted-foreground">
                        Gửi lúc: {format(sendDate, "HH:mm, dd/MM/yyyy", { locale: vi })}
                     </p>
                   )}
                   <Badge variant={hasBeenSent ? 'secondary' : 'default'}>
                       {hasBeenSent ? 'Đã gửi' : 'Đã lên lịch'}
                   </Badge>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Icons.ellipsis className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <NotificationDialog mode="edit" notificationId={notification.id}>
                        <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                          <Icons.edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </button>
                      </NotificationDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive">
                            <Icons.delete className="mr-2 h-4 w-4" />
                            Xóa
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Hành động này sẽ xóa vĩnh viễn thông báo. Bạn có thể hoàn tác hành động này trong vài giây.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteNotification(notification.id)} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-card p-12 text-center">
          <Icons.notification className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Chưa có thông báo nào</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Tạo thông báo đầu tiên của bạn để lên lịch nhắc nhở.
          </p>
          <div className="mt-6">
            <NotificationDialog mode="add">
              <Button>
                <Icons.add className="mr-2 h-4 w-4" />
                Tạo thông báo
              </Button>
            </NotificationDialog>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
    return (
        <AuthGuard>
            <NotificationManager />
        </AuthGuard>
    )
}
