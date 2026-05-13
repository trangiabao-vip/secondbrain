
'use client';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { WikiPageDialog } from './WikiPageDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

const getDateFromFirestore = (date: any): Date | null => {
  if (!date) return null;
  if (typeof date === 'string') return parseISO(date);
  if (date.seconds) return new Date(date.seconds * 1000);
  if (date instanceof Date) return date;
  return null;
};

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function WikiView() {
  const { selectedTopic, wikiPages, isDataLoading, deleteWikiPage } = useAppContext();

  if (isDataLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }
  
  const topicWikiPages = wikiPages.filter(page => page.topicId === selectedTopic?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Kiến thức Wiki</h3>
        <WikiPageDialog mode="add">
          <Button>
            <Icons.add className="mr-2 h-4 w-4" />
            Thêm trang Wiki
          </Button>
        </WikiPageDialog>
      </div>

      {topicWikiPages.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {topicWikiPages.map((page) => {
            const updatedAt = getDateFromFirestore(page.updatedAt);
            return (
              <Card key={page.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{page.title}</CardTitle>
                  {updatedAt && (
                     <CardDescription>
                        Cập nhật lần cuối: {format(updatedAt, "HH:mm, dd/MM/yyyy", { locale: vi })}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">{stripHtml(page.content)}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <WikiPageDialog mode="view" pageId={page.id}>
                        <Button variant="outline">Xem chi tiết</Button>
                    </WikiPageDialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Icons.ellipsis className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <WikiPageDialog mode="edit" pageId={page.id}>
                             <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                                <Icons.edit className="mr-2 h-4 w-4" />
                                Chỉnh sửa
                            </button>
                           </WikiPageDialog>
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
                                    Hành động này sẽ xóa vĩnh viễn trang wiki. Bạn có thể hoàn tác hành động này trong vài giây.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteWikiPage(page.id)} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-card p-12 text-center">
          <Icons.topic className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Chưa có trang Wiki nào</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Bắt đầu xây dựng cơ sở kiến thức cho chủ đề này.
          </p>
          <div className="mt-6">
            <WikiPageDialog mode="add">
              <Button>
                <Icons.add className="mr-2 h-4 w-4" />
                Thêm trang Wiki
              </Button>
            </WikiPageDialog>
          </div>
        </div>
      )}
    </div>
  );
}
