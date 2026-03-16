'use client';
import { useState, type ReactNode, useEffect, useMemo, useCallback } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import { format, setHours, setMinutes, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Icons } from '@/components/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Notification } from '@/lib/data';

interface NotificationDialogProps {
  mode: 'add' | 'edit';
  notificationId?: string;
  children: ReactNode;
  initialData?: Partial<Omit<Notification, 'id'>>;
}

const getDateFromFirestore = (date: any): Date | undefined => {
    if (!date) return undefined;
    if (typeof date === 'string') return new Date(date);
    if (date && typeof date.toDate === 'function') return date.toDate();
    if (date.seconds) return new Date(date.seconds * 1000);
    return undefined;
};


export function NotificationDialog({ mode, notificationId, children, initialData }: NotificationDialogProps) {
  const { getNotificationById, addNotification, updateNotification, topics, goals, tasks, getTopicBreadcrumbs } = useAppContext();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sendAtDate, setSendAtDate] = useState<Date | undefined>();
  const [sendAtTime, setSendAtTime] = useState('09:00');
  const [linkType, setLinkType] = useState<'none' | 'topic' | 'goal' | 'task'>('none');
  const [linkId, setLinkId] = useState<string | undefined>();

  const [isOpen, setIsOpen] = useState(false);

  const linkableItems = useMemo(() => {
    switch (linkType) {
        case 'topic':
            return topics.map(t => ({ id: t.id, name: getTopicBreadcrumbs(t.id).map(b => b.name).join(' / ') }));
        case 'goal':
            return goals;
        case 'task':
            return tasks.filter(t => !t.recurrence); // Don't link to recurring instances
        default:
            return [];
    }
  }, [linkType, topics, goals, tasks, getTopicBreadcrumbs]);
  
  useEffect(() => {
    if (isOpen) {
        if (mode === 'edit' && notificationId) {
            const notification = getNotificationById(notificationId);
            if (notification) {
                setTitle(notification.title);
                setBody(notification.body);
                const sendDate = getDateFromFirestore(notification.sendAt);
                setSendAtDate(sendDate);
                if (sendDate) {
                    setSendAtTime(format(sendDate, "HH:mm"));
                }
                setLinkType(notification.link?.type || 'none');
                setLinkId(notification.link?.id);
            }
        } else if (initialData) {
            setTitle(initialData.title || '');
            setBody(initialData.body || '');
            const sendDate = getDateFromFirestore(initialData.sendAt);
            setSendAtDate(sendDate);
            if (sendDate) {
                setSendAtTime(format(sendDate, "HH:mm"));
            } else {
                setSendAtTime('09:00');
            }
            setLinkType(initialData.link?.type || 'none');
            setLinkId(initialData.link?.id);
        } else {
            // Reset for 'add' mode
            setTitle('');
            setBody('');
            setSendAtDate(new Date());
            setSendAtTime('09:00');
            setLinkType('none');
            setLinkId(undefined);
        }
    }
  }, [isOpen, mode, notificationId, getNotificationById, initialData]);

  const combineDateTime = (date: Date, time: string): Date => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        return setMinutes(setHours(date, hours), minutes);
      }
    } catch (e) { /* ignore */ }
    return date;
  };

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !body.trim() || !sendAtDate) {
        toast({
            variant: 'destructive',
            title: 'Lỗi',
            description: 'Tiêu đề, nội dung, và thời gian gửi không được để trống.',
        });
        return;
    };

    const notificationData: Partial<Omit<Notification, 'id'>> = {
        title,
        body,
        sendAt: combineDateTime(sendAtDate, sendAtTime),
        isSent: false, // Always reset to false on save
        link: linkType !== 'none' && linkId ? { type: linkType, id: linkId } : undefined,
    };

    if (mode === 'add') {
      await addNotification(notificationData);
    } else if (notificationId) {
      await updateNotification(notificationId, notificationData);
    }
    
    setIsOpen(false);
  }, [title, body, sendAtDate, sendAtTime, linkType, linkId, mode, notificationId, addNotification, updateNotification, toast, setIsOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
             {mode === 'add' ? 'Lên lịch thông báo mới' : 'Chỉnh sửa thông báo'}
          </DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết cho thông báo đẩy của bạn.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-4">
            <div className="space-y-2">
                <Label htmlFor="notif-title">Tiêu đề</Label>
                <Input
                  id="notif-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ví dụ: Sắp đến hạn mục tiêu!"
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="notif-body">Nội dung</Label>
                <Textarea
                  id="notif-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="ví dụ: Mục tiêu 'Hoàn thành báo cáo' sẽ hết hạn trong 1 giờ nữa."
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="send-date">Thời gian gửi</Label>
              <div className="flex gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                    >
                        <Icons.calendar className="mr-2 h-4 w-4" />
                        {sendAtDate ? format(sendAtDate, "PPP", { locale: vi }) : <span>Chọn một ngày</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        locale={vi}
                        mode="single"
                        selected={sendAtDate}
                        onSelect={setSendAtDate}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                {sendAtDate && (
                  <Input 
                    type="time" 
                    value={sendAtTime}
                    onChange={e => setSendAtTime(e.target.value)}
                    className="w-32"
                    step="900"
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="link-type">Liên kết đến (Tùy chọn)</Label>
                <Select value={linkType} onValueChange={(v: any) => { setLinkType(v); setLinkId(undefined); }}>
                    <SelectTrigger id="link-type">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Không có</SelectItem>
                        <SelectItem value="topic">Chủ đề</SelectItem>
                        <SelectItem value="goal">Mục tiêu</SelectItem>
                        <SelectItem value="task">Nhiệm vụ</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                 <Label htmlFor="link-id">Mục cụ thể</Label>
                 <Select value={linkId} onValueChange={setLinkId} disabled={linkType === 'none' || linkableItems.length === 0}>
                    <SelectTrigger id="link-id">
                        <SelectValue placeholder="Chọn một mục..."/>
                    </SelectTrigger>
                    <SelectContent>
                        {linkableItems.map((item: any) => (
                             <SelectItem key={item.id} value={item.id} className="truncate">
                                {('title' in item ? item.title : ('text' in item ? item.text : item.name)) as string}
                             </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit}>{mode === 'add' ? 'Lên lịch' : 'Lưu thay đổi'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
