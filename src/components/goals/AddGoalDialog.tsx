'use client';
import { useState, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAppContext } from '@/contexts/AppContext';
import { Icons } from '../icons';
import { format, setHours, setMinutes } from "date-fns";
import { vi } from 'date-fns/locale';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { GoalPriority } from '@/lib/data';
import { Separator } from '../ui/separator';

export function AddGoalDialog({ children }: { children: ReactNode }) {
  const { addGoal, selectedTopic } = useAppContext();
  const [goalTitle, setGoalTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('Vừa');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState('10:00');
  const [customProperties, setCustomProperties] = useState<Array<{id: number, key: string, value: string}>>([]);
  const [isOpen, setIsOpen] = useState(false);

  const resetState = () => {
    setGoalTitle('');
    setDescription('');
    setPriority('Vừa');
    setStartDate(undefined);
    setEndDate(undefined);
    setStartTime('09:00');
    setEndTime('10:00');
    setCustomProperties([]);
    setIsOpen(false);
  }

  const combineDateTime = (date: Date, time: string): Date => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        return setMinutes(setHours(date, hours), minutes);
      }
    } catch (e) { /* ignore */ }
    return date;
  };
  
  const handleAddProperty = () => {
    setCustomProperties([...customProperties, { id: Date.now(), key: '', value: '' }]);
  };

  const handleRemoveProperty = (id: number) => {
    setCustomProperties(customProperties.filter(p => p.id !== id));
  };
  
  const handlePropertyChange = (id: number, field: 'key' | 'value', text: string) => {
    setCustomProperties(customProperties.map(p => p.id === id ? { ...p, [field]: text } : p));
  };

  const handleAddGoal = () => {
    if (goalTitle.trim()) {
      const finalStartDate = startDate ? combineDateTime(startDate, startTime) : null;
      const finalEndDate = endDate ? combineDateTime(endDate, endTime) : null;
      
      const customPropsObject = customProperties
        .filter(p => p.key.trim() !== '')
        .reduce((acc, prop) => {
          acc[prop.key.trim()] = prop.value;
          return acc;
        }, {} as { [key: string]: string });

      addGoal({
        title: goalTitle.trim(),
        description,
        priority,
        startDate: finalStartDate,
        endDate: finalEndDate,
        customProperties: customPropsObject
      });
      resetState();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm mục tiêu mới</DialogTitle>
          <DialogDescription>
            Đặt mục tiêu mới cho chủ đề của bạn: "{selectedTopic?.name}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[80vh] overflow-y-auto pr-4">
            <div className="space-y-2">
              <Label htmlFor="goal-title">Mục tiêu</Label>
              <Input
                id="goal-title"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="ví dụ: 'Thành thạo React Hooks'"
                onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
              />
            </div>
            <div className="space-y-2">
                <Label htmlFor="goal-description">Mô tả (Tùy chọn)</Label>
                <Textarea
                  id="goal-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chi tiết hơn về mục tiêu này"
                />
            </div>
             <div className="space-y-2">
              <Label htmlFor="priority-add">Mức độ ưu tiên</Label>
              <Select value={priority} onValueChange={(value: GoalPriority) => setPriority(value)}>
                <SelectTrigger id="priority-add">
                  <SelectValue placeholder="Chọn mức độ ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Thấp">Thấp</SelectItem>
                  <SelectItem value="Vừa">Vừa</SelectItem>
                  <SelectItem value="Cao">Cao</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-date">Ngày bắt đầu (Tùy chọn)</Label>
              <div className="flex gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                    >
                        <Icons.calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP", { locale: vi }) : <span>Chọn một ngày</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        locale={vi}
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                {startDate && (
                  <Input 
                    type="time" 
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-32"
                    step="900"
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Ngày kết thúc (Tùy chọn)</Label>
              <div className="flex gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                    >
                        <Icons.calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: vi }) : <span>Chọn một ngày</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        locale={vi}
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                 {endDate && (
                  <Input 
                    type="time" 
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-32"
                    step="900"
                  />
                )}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Thuộc tính tùy chỉnh</Label>
              <div className="space-y-2">
                {customProperties.map((prop) => (
                  <div key={prop.id} className="flex items-center gap-2">
                    <Input _
                      placeholder="Tên thuộc tính" 
                      value={prop.key}
                      onChange={(e) => handlePropertyChange(prop.id, 'key', e.target.value)}
                    />
                    <Input 
                      placeholder="Giá trị" 
                      value={prop.value}
                      onChange={(e) => handlePropertyChange(prop.id, 'value', e.target.value)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveProperty(prop.id)} className='flex-shrink-0'>
                      <Icons.delete className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={handleAddProperty} className='mt-2'>
                <Icons.add className='mr-2 h-4 w-4' />
                Thêm thuộc tính
              </Button>
            </div>
            <div className="flex justify-end pt-2">
                <Button type="submit" onClick={handleAddGoal}>
                    Thêm mục tiêu
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
