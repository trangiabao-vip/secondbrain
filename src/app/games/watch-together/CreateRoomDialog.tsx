'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Icons } from '@/components/icons';
import { generateId } from '@/lib/utils';
import { format, setHours, setMinutes } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export function CreateRoomDialog() {
  const { firestore, user } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [showtimeDate, setShowtimeDate] = useState<Date | undefined>();
  const [showtimeTime, setShowtimeTime] = useState('20:00');

  const combineDateTime = (date: Date, time: string): Date => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        return setMinutes(setHours(date, hours), minutes);
      }
    } catch (e) { /* ignore */ }
    return date;
  };

  const handleCreateRoom = async () => {
    if (!name.trim() || !user || !firestore) {
        toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Tên phòng không được để trống.",
        });
        return;
    }

    const finalShowtime = showtimeDate ? combineDateTime(showtimeDate, showtimeTime) : null;

    const newRoomData = {
      name: name.trim(),
      description: description.trim(),
      isPublic: isPublic,
      showtime: finalShowtime,
      videoUrl: '',
      isPlaying: false,
      currentTime: 0,
      createdAt: serverTimestamp(),
      lastUpdatedBy: user.uid,
      participants: [],
    };
    
    try {
        const docRef = await addDoc(collection(firestore, 'watchRooms'), newRoomData);
        setIsOpen(false);
        router.push(`${pathname}?roomId=${docRef.id}`);
        toast({
            title: "Đã tạo phòng!",
            description: `Phòng "${name}" đã được tạo.`,
        });
    } catch (error) {
        console.error("Error creating room: ", error);
        toast({
            variant: "destructive",
            title: "Lỗi tạo phòng",
            description: "Đã có lỗi xảy ra. Vui lòng thử lại.",
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Icons.add className="mr-2 h-4 w-4" />
          Tạo phòng mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo phòng xem phim mới</DialogTitle>
          <DialogDescription>
            Thiết lập chi tiết cho phòng xem phim của bạn.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="room-name">Tên phòng</Label>
            <Input
              id="room-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ví dụ: 'Cùng xem phim cuối tuần'"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="room-description">Mô tả (Tùy chọn)</Label>
            <Textarea
              id="room-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về buổi xem phim này"
            />
          </div>
          <div className="space-y-2">
              <Label htmlFor="showtime-date">Giờ công chiếu (Tùy chọn)</Label>
              <div className="flex gap-2">
                <Popover modal={true}>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                    >
                        <Icons.calendar className="mr-2 h-4 w-4" />
                        {showtimeDate ? format(showtimeDate, "PPP", { locale: vi }) : <span>Chọn một ngày</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        locale={vi}
                        mode="single"
                        selected={showtimeDate}
                        onSelect={setShowtimeDate}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                {showtimeDate && (
                  <Input 
                    type="time" 
                    value={showtimeTime}
                    onChange={e => setShowtimeTime(e.target.value)}
                    className="w-32"
                    step="900"
                  />
                )}
              </div>
            </div>
           <div className="flex items-center space-x-2">
            <Switch 
                id="is-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
            />
            <Label htmlFor="is-public">Công khai phòng này</Label>
          </div>
          <p className="text-xs text-muted-foreground">Nếu công khai, phòng của bạn sẽ hiển thị cho mọi người trong sảnh chờ.</p>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleCreateRoom}>
            Tạo phòng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
