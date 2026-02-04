
'use client';
import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { ChannelDialog } from './ChannelDialog';
import { Badge } from '@/components/ui/badge';
import { AddOrEditTaskDialog } from '@/components/tasks/AddOrEditTaskDialog';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const socialIcons: Record<string, React.FC<{ className?: string }>> = {
  facebook: Icons.facebook,
  youtube: Icons.youtube,
  discord: Icons.discord,
  zalo: Icons.zalo,
};

function ChannelManager() {
  const { channels, isDataLoading, deleteChannel } = useAppContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>(undefined);

  const handleOpenDialog = (mode: 'add' | 'edit', channelId?: string) => {
    setDialogMode(mode);
    setSelectedChannelId(channelId);
    setDialogOpen(true);
  };
  
  if (isDataLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Quản lý Kênh</h2>
          <Button onClick={() => handleOpenDialog('add')}>
              <Icons.add className="mr-2 h-4 w-4" />
              Tạo kênh mới
          </Button>
        </div>

        {channels.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {channels.map((channel) => {
              const socialLinks = Object.entries(channel).filter(([key, value]) => ['facebook', 'youtube', 'discord', 'zalo'].includes(key) && value);

              return (
                  <Link href={`/channels/${channel.id}`} key={channel.id} className="h-full">
                    <Card className="flex flex-col h-full transition-all hover:shadow-lg hover:border-primary/50">
                      <CardHeader className="pb-4">
                        <CardTitle className="line-clamp-2">{channel.name}</CardTitle>
                        {channel.description && <CardDescription className="line-clamp-2">{channel.description}</CardDescription>}
                      </CardHeader>
                      <CardContent className="flex-grow space-y-4">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <Icons.topic className="h-4 w-4" />
                              <span>{channel.topicIds?.length || 0} Chủ đề</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Icons.goal className="h-4 w-4" />
                              <span>{channel.goalIds?.length || 0} Mục tiêu</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Icons.task className="h-4 w-4" />
                              <span>{channel.taskIds?.length || 0} Nhiệm vụ</span>
                            </div>
                          </div>
                      
                        {socialLinks.length > 0 && (
                            <div className="flex items-center gap-4 pt-2">
                                {socialLinks.map(([key, value]) => {
                                    const Icon = socialIcons[key];
                                    return (
                                        <TooltipProvider key={key}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
                                                        <Icon className="h-5 w-5" />
                                                    </a>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{value as string}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )
                                })}
                            </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-end pt-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {e.preventDefault(); e.stopPropagation();}}>
                                <Icons.ellipsis className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => {e.preventDefault(); e.stopPropagation();}}>
                              <AddOrEditTaskDialog mode="add" topicId={channel.topicIds[0]} channelId={channel.id}>
                                 <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full" disabled={!channel.topicIds || channel.topicIds.length === 0}>
                                  <Icons.task className="mr-2 h-4 w-4" />
                                  Thêm nhiệm vụ
                                 </button>
                              </AddOrEditTaskDialog>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => handleOpenDialog('edit', channel.id)}>
                                  <Icons.edit className="mr-2 h-4 w-4" />
                                  Chỉnh sửa
                              </DropdownMenuItem>
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
                                      Hành động này sẽ xóa vĩnh viễn kênh. Bạn có thể hoàn tác hành động này trong vài giây.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteChannel(channel.id)} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </CardFooter>
                    </Card>
                  </Link>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-card p-12 text-center">
            <Icons.channel className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Chưa có kênh nào</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Hãy tạo kênh đầu tiên của bạn để bắt đầu.
            </p>
            <div className="mt-6">
                <Button onClick={() => handleOpenDialog('add')}>
                    <Icons.add className="mr-2 h-4 w-4" />
                    Tạo kênh mới
                </Button>
            </div>
          </div>
        )}
      </div>
      <ChannelDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        channelId={selectedChannelId}
      />
    </>
  );
}


export default function ChannelsPage() {
    return (
        <AuthGuard>
            <ChannelManager />
        </AuthGuard>
    )
}
