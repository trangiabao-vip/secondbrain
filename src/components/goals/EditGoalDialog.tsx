

'use client';
import { useState, type ReactNode, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { GoalStatus, GoalPriority, Goal } from '@/lib/data';
import { Textarea } from '../ui/textarea';

const getDateFromFirestore = (date: any): Date | undefined => {
    if (!date) return undefined;
    if (typeof date === 'string') return new Date(date);
    if (date && typeof date.toDate === 'function') return date.toDate();
    if (date.seconds) return new Date(date.seconds * 1000);
    if (date instanceof Date) return date;
    return undefined;
};


export function EditGoalDialog({ goalId, children }: { goalId: string, children: ReactNode }) {
  const { getGoalById, updateGoal, deleteGoal } = useAppContext();
  const [goalTitle, setGoalTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('Vừa');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState('10:00');
  const [status, setStatus] = useState<GoalStatus>('chưa bắt đầu');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const goal = getGoalById(goalId);
      if (goal) {
        setGoalTitle(goal.title);
        setDescription(goal.description || '');
        setStatus(goal.status);
        setPriority(goal.priority || 'Vừa');
        
        const sDate = getDateFromFirestore(goal.startDate);
        if (sDate) {
          setStartDate(sDate);
          setStartTime(format(sDate, "HH:mm"));
        } else {
          setStartDate(undefined);
          setStartTime('09:00');
        }

        const eDate = getDateFromFirestore(goal.endDate);
        if (eDate) {
          setEndDate(eDate);
          setEndTime(format(eDate, "HH:mm"));
        } else {
          setEndDate(undefined);
          setEndTime('10:00');
        }
      }
    }
  }, [isOpen, goalId, getGoalById]);

   const combineDateTime = (date: Date, time: string): Date => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        return setMinutes(setHours(date, hours), minutes);
      }
    } catch (e) { /* ignore */ }
    return date;
  };

  const handleUpdateGoal = () => {
    if (goalTitle.trim()) {
      const finalStartDate = startDate ? combineDateTime(startDate, startTime) : null;
      const finalEndDate = endDate ? combineDateTime(endDate, endTime) : null;

      const updatedData: Partial<Omit<Goal, 'id'>> = {
        title: goalTitle.trim(),
        description: description,
        priority: priority,
        startDate: finalStartDate,
        endDate: finalEndDate,
        status: status,
      };

      updateGoal(goalId, updatedData);
      setIsOpen(false);
    }
  };

  const handleDeleteGoal = async () => {
    await deleteGoal(goalId);
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa mục tiêu</DialogTitle>
          <DialogDescription>
            Cập nhật chi tiết mục tiêu của bạn.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[80vh] overflow-y-auto pr-4">
            <div className="space-y-2">
              <Label htmlFor="goal-title-edit">Mục tiêu</Label>
              <Input
                id="goal-title-edit"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="ví dụ: 'Thành thạo React Hooks'"
              />
            </div>
             <div className="space-y-2">
                <Label htmlFor="goal-description-edit">Mô tả (Tùy chọn)</Label>
                <Textarea
                  id="goal-description-edit"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chi tiết hơn về mục tiêu này"
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority-edit">Mức độ ưu tiên</Label>
              <Select value={priority} onValueChange={(value: GoalPriority) => setPriority(value)}>
                <SelectTrigger id="priority-edit">
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
              <Label htmlFor="start-date-edit">Ngày bắt đầu (Tùy chọn)</Label>
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
              <Label htmlFor="end-date-edit">Ngày kết thúc (Tùy chọn)</Label>
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
            <div className="space-y-2">
              <Label htmlFor="status-edit">Trạng thái</Label>
              <Select value={status} onValueChange={(value: GoalStatus) => setStatus(value)}>
                <SelectTrigger id="status-edit">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chưa bắt đầu">Chưa bắt đầu</SelectItem>
                  <SelectItem value="đang làm">Đang làm</SelectItem>
                  <SelectItem value="hoàn thành">Hoàn thành</SelectItem>
                  <SelectItem value="thất bại">Thất bại</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between">
                <Button variant="destructive" onClick={handleDeleteGoal}>
                    <Icons.delete className="mr-2 h-4 w-4" />
                    Xóa
                </Button>
                <Button type="submit" onClick={handleUpdateGoal}>
                    Lưu thay đổi
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
