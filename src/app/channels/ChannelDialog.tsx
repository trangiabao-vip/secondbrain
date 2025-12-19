
'use client';
import { useState, type ReactNode, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/contexts/AppContext';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChannelDialogProps {
  mode: 'add' | 'edit';
  channelId?: string;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ChannelDialog({ mode, channelId, children, open, onOpenChange }: ChannelDialogProps) {
  const { topics, getChannelById, addChannel, updateChannel } = useAppContext();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isInternalOpen, setIsInternalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [facebook, setFacebook] = useState('');
  const [youtube, setYoutube] = useState('');
  const [discord, setDiscord] = useState('');
  const [zalo, setZalo] = useState('');

  const isOpen = open !== undefined ? open : isInternalOpen;
  const setIsOpen = onOpenChange !== undefined ? onOpenChange : setIsInternalOpen;
  
  useEffect(() => {
    if (isOpen) {
        if (mode === 'edit' && channelId) {
            const channel = getChannelById(channelId);
            if (channel) {
                setName(channel.name);
                setDescription(channel.description || '');
                setSelectedTopicIds(channel.topicIds || []);
                setFacebook(channel.facebook || '');
                setYoutube(channel.youtube || '');
                setDiscord(channel.discord || '');
                setZalo(channel.zalo || '');
            }
        } else {
            setName('');
            setDescription('');
            setSelectedTopicIds([]);
            setFacebook('');
            setYoutube('');
            setDiscord('');
            setZalo('');
        }
    }
  }, [isOpen, mode, channelId, getChannelById]);

  const handleSubmit = async () => {
    if (!name.trim()) {
        toast({
            variant: 'destructive',
            title: 'Lỗi',
            description: 'Tên kênh không được để trống.',
        });
        return
    };

    const channelData = {
        name,
        description,
        topicIds: selectedTopicIds,
        facebook,
        youtube,
        discord,
        zalo,
    };

    if (mode === 'add') {
      await addChannel(channelData);
    } else if (channelId) {
      updateChannel(channelId, channelData);
    }
    
    setIsOpen(false);
  };
  
  const handleTopicSelect = (topicId: string) => {
    setSelectedTopicIds(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const filteredTopics = topics.filter(topic => topic.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
             {mode === 'add' ? 'Tạo kênh mới' : 'Chỉnh sửa kênh'}
          </DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết cho kênh của bạn.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-4">
            <div className="space-y-2">
                <Label htmlFor="channel-name">Tên kênh</Label>
                <Input
                  id="channel-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên kênh"
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="channel-description">Mô tả (tùy chọn)</Label>
                <Textarea
                  id="channel-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ngắn về kênh"
                />
            </div>

            <div className="space-y-2">
                <Label>Chủ đề liên quan</Label>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={popoverOpen}
                        className="w-full justify-between h-auto"
                    >
                        <div className="flex gap-1 flex-wrap">
                            {selectedTopicIds.length > 0 ? selectedTopicIds.map(id => {
                                const topic = topics.find(t => t.id === id);
                                return <Badge key={id} variant="secondary">{topic?.name || id}</Badge>
                            }) : "Chọn chủ đề..."}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <div className="p-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                placeholder="Tìm kiếm chủ đề..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                                />
                            </div>
                        </div>

                        <Separator />

                        <ScrollArea className="h-48">
                            <div className="p-2 space-y-1">
                            {filteredTopics.length > 0 ? (
                                filteredTopics.map((topic) => (
                                <div
                                    key={topic.id}
                                    onClick={() => handleTopicSelect(topic.id)}
                                    className="flex cursor-pointer items-center rounded-md p-2 text-sm hover:bg-accent"
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            selectedTopicIds.includes(topic.id) ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    <span>{topic.name}</span>
                                </div>
                                ))
                            ) : (
                                <p className="p-2 text-center text-sm text-muted-foreground">Không tìm thấy chủ đề.</p>
                            )}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
                <Label>Kênh mạng xã hội (tùy chọn)</Label>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Icons.facebook className="h-5 w-5 text-muted-foreground" />
                        <Input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="Link Facebook" />
                    </div>
                     <div className="flex items-center gap-3">
                        <Icons.youtube className="h-5 w-5 text-muted-foreground" />
                        <Input value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="Link YouTube" />
                    </div>
                     <div className="flex items-center gap-3">
                        <Icons.discord className="h-5 w-5 text-muted-foreground" />
                        <Input value={discord} onChange={e => setDiscord(e.target.value)} placeholder="Link Discord" />
                    </div>
                     <div className="flex items-center gap-3">
                        <Icons.zalo className="h-5 w-5 text-muted-foreground" />
                        <Input value={zalo} onChange={e => setZalo(e.target.value)} placeholder="Link Zalo" />
                    </div>
                </div>
            </div>

        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit}>{mode === 'add' ? 'Tạo kênh' : 'Lưu thay đổi'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
