
'use client';
import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
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
import { SalesPageDialog } from '@/components/sales-pages/SalesPageDialog';

function SalesPageManager() {
  const { salesPages, isDataLoading, deleteSalesPage } = useAppContext();

  if (isDataLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Trang bán hàng</h2>
        <SalesPageDialog mode="add">
          <Button>
            <Icons.add className="mr-2 h-4 w-4" />
            Tạo trang mới
          </Button>
        </SalesPageDialog>
      </div>

      {salesPages.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {salesPages.map((page) => (
            <Card key={page.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-2">{page.title}</CardTitle>
                <CardDescription>
                  Cập nhật lần cuối: {page.updatedAt ? format(page.updatedAt.toDate(), "dd/MM/yyyy", { locale: vi }) : 'N/A'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3 break-all">
                  /p/{page.slug}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href={`/p/${page.slug}`} target="_blank">Xem trang</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Icons.ellipsis className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <SalesPageDialog mode="edit" pageId={page.id}>
                      <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                        <Icons.edit className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                      </button>
                    </SalesPageDialog>
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
                            Hành động này sẽ xóa vĩnh viễn trang bán hàng. Bạn có thể hoàn tác hành động này trong vài giây.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteSalesPage(page.id)} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-card p-12 text-center">
          <Icons.salesPage className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Chưa có trang bán hàng nào</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Hãy tạo trang bán hàng đầu tiên của bạn để bắt đầu.
          </p>
          <div className="mt-6">
            <SalesPageDialog mode="add">
              <Button>
                <Icons.add className="mr-2 h-4 w-4" />
                Tạo trang mới
              </Button>
            </SalesPageDialog>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SalesPagesPage() {
    return (
        <AuthGuard>
            <SalesPageManager />
        </AuthGuard>
    )
}
