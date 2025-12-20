
'use client';
import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';
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
} from "@/components/ui/alert-dialog"
import { ChannelDialog } from './ChannelDialog';
import { Badge } from '@/components/ui/badge';

const socialIcons: Record<string, React.FC<{ className?: string }>> = {
  facebook: Icons.facebook,
  youtube: Icons.youtube,
  discord: Icons.discord,
  zalo: Icons.zalo,
};

function ChannelManager() {
  const { channels, topics, goals, isDataLoading, deleteChannel } = useAppContext();
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = (mode: 'add' | 'edit', channelId?: string) => {
    setDialogMode(mode);
    setEditingChannelId(channelId || null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsDialogOpen(false);
      setEditingChannelId(null);
    }
  };


  if (isDataLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
    );
  }

  const getTopicNames = (topicIds: string[] = []) => {
    return topicIds.map(id => topics.find(t => t.id === id)?.name).filter(Boolean);
  }
  
  const getGoalTitles = (goalIds: string[] = []) => {
    return goalIds.map(id => goals.find(g => g.id === id)?.title).filter(Boolean);
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
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {channels.map((channel) => {
            const channelTopics = getTopicNames(channel.topicIds);
            const channelGoals = getGoalTitles(channel.goalIds);
            const socialLinks = Object.entries(channel).filter(([key, value]) => ['facebook', 'youtube', 'discord', 'zalo'].includes(key) && value);

            return (
                <Card key={channel.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{channel.name}</CardTitle>
                    {channel.description && <CardDescription>{channel.description}</CardDescription>}
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                     {channelTopics.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Chủ đề</h4>
                            <div className="flex flex-wrap gap-1">
                                {channelTopics.map(name => (
                                    <Badge key={name} variant="secondary">{name}</Badge>
                                ))}
                            </div>
                        </div>
                     )}
                      {channelGoals.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Mục tiêu</h4>
                            <div className="flex flex-wrap gap-1">
                                {channelGoals.map(title => (
                                    <Badge key={title} variant="outline">{title}</Badge>
                                ))}
                            </div>
                        </div>
                     )}
                     {socialLinks.length > 0 && (
                        <div>
                             <h4 className="text-sm font-semibold mb-2">Kênh mạng xã hội</h4>
                             <div className="flex items-center gap-4">
                                {socialLinks.map(([key, value]) => {
                                    const Icon = socialIcons[key];
                                    return (
                                        <a key={key} href={value as string} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                            <Icon className="h-6 w-6" />
                                        </a>
                                    )
                                })}
                             </div>
                        </div>
                     )}
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Icons.ellipsis className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                                Hành động này không thể được hoàn tác. Thao tác này sẽ xóa vĩnh viễn kênh.
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
        mode={dialogMode} 
        channelId={editingChannelId || undefined} 
        open={isDialogOpen} 
        onOpenChange={handleDialogClose}
    />
    </>
  );
}


export default function ChannelsPage() {
    return (
        <AuthGuard>
            <AppLayout>
                <ChannelManager />
            </AppLayout>
        </AuthGuard>
    )
}

    