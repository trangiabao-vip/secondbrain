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
import { TaskStatus } from '@/lib/data';

interface AddOrEditTaskDialogProps {
  taskId?: string;
  goalId?: string;
  children: ReactNode;
  mode: 'add' | 'edit';
}

export function AddOrEditTaskDialog({ taskId, goalId: initialGoalId, children, mode }: AddOrEditTaskDialogProps) {
  const { getTaskById, updateTask, deleteTask, addTask, goals, selectedTopic } = useAppContext();
  
  const [taskText, setTaskText] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState('10:00');
  const [status, setStatus] = useState<TaskStatus>('chưa bắt đầu');
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>(initialGoalId);
  const [isOpen, setIsOpen] = useState(false);

  const topicGoals = goals.filter(g => g.topicId === selectedTopic?.id);

  const getTaskDate = (date: any) => {
    if (!date) return undefined;
    if (typeof date === 'string') return new Date(date);
    if (date.seconds) return new Date(date.seconds * 1000);
    return undefined;
  }

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && taskId) {
        const task = getTaskById(taskId);
        if (task) {
          setTaskText(task.text);
          setStatus(task.status);
          setSelectedGoalId(task.goalId || undefined);
          
          const sDate = getTaskDate(task.startDate);
          if (sDate) {
            setStartDate(sDate);
            setStartTime(format(sDate, "HH:mm"));
          } else {
            setStartDate(undefined);
            setStartTime('09:00');
          }

          const eDate = getTaskDate(task.endDate);
          if (eDate) {
            setEndDate(eDate);
            setEndTime(format(eDate, "HH:mm"));
          } else {
            setEndDate(undefined);
            setEndTime('10:00');
          }
        }
      } else {
        // Reset for 'add' mode
        setTaskText('');
        setStatus('chưa bắt đầu');
        setStartDate(undefined);
        setStartTime('09:00');
        setEndDate(undefined);
        setEndTime('10:00');
        setSelectedGoalId(initialGoalId);
      }
    }
  }, [isOpen, taskId, getTaskById, mode, initialGoalId]);

  const combineDateTime = (date: Date, time: string) => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        return setMinutes(setHours(date, hours), minutes);
      }
    } catch (e) { /* ignore time parsing errors */ }
    return date;
  }

  const handleSubmit = () => {
    if (taskText.trim()) {
      const finalStartDate = startDate ? combineDateTime(startDate, startTime) : null;
      const finalEndDate = endDate ? combineDateTime(endDate, endTime) : null;
      
      if (mode === 'edit' && taskId) {
        updateTask(taskId, status, taskText.trim(), finalStartDate, finalEndDate, selectedGoalId);
      } else {
        addTask(taskText.trim(), selectedGoalId, finalStartDate || undefined, finalEndDate || undefined, status);
      }
      setIsOpen(false);
    }
  };

  const handleDeleteTask = () => {
    if (taskId) {
      deleteTask(taskId);
      setIsOpen(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Chỉnh sửa nhiệm vụ' : 'Thêm nhiệm vụ mới'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Cập nhật chi tiết nhiệm vụ của bạn.' : 'Thêm một nhiệm vụ mới vào một trong các mục tiêu của bạn.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="task-text-edit">Nhiệm vụ</Label>
              <Input
                id="task-text-edit"
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="task-goal">Mục tiêu (Tùy chọn)</Label>
              <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                <SelectTrigger id="task-goal">
                  <SelectValue placeholder="Chọn một mục tiêu (hoặc để trống)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có mục tiêu</SelectItem>
                  {topicGoals.map(goal => (
                    <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-date-edit">Thời gian bắt đầu (Tùy chọn)</Label>
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
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-32"
                        step="900"
                    />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date-edit">Thời gian kết thúc (Tùy chọn)</Label>
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
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-32"
                        step="900"
                    />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-edit-task">Trạng thái</Label>
              <Select value={status} onValueChange={(value: TaskStatus) => setStatus(value)}>
                <SelectTrigger id="status-edit-task">
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
                {mode === 'edit' ? (
                    <Button variant="destructive" onClick={handleDeleteTask}>
                        <Icons.delete className="mr-2 h-4 w-4" />
                        Xóa
                    </Button>
                ) : <div></div>}
                <Button type="submit" onClick={handleSubmit}>
                    {mode === 'edit' ? 'Lưu thay đổi' : 'Thêm nhiệm vụ'}
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
