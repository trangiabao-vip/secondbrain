'use client';
import { useState, type ReactNode, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
import { Separator } from '../ui/separator';
import { MarkdownRenderer } from '../ui/markdown-renderer';
import { BlockNoteEditorComponent } from '../notes/BlockNoteEditor';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from '../ui/dropdown-menu';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';


const getDateFromFirestore = (date: any): Date | undefined => {
    if (!date) return undefined;
    if (typeof date === 'string') return new Date(date);
    if (date && typeof date.toDate === 'function') return date.toDate();
    if (date.seconds) return new Date(date.seconds * 1000);
    if (date instanceof Date) return date;
    return undefined;
};

function EditableMarkdown({ value, onChange, placeholder }: { value: string, onChange: (value: string) => void, placeholder: string }) {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="min-h-[150px] mt-2"
                onBlur={() => setIsEditing(false)}
                autoFocus
            />
        );
    }

    return (
        <div 
            className="min-h-[150px] mt-2 rounded-md border p-4 bg-secondary/50 cursor-text prose dark:prose-invert prose-sm max-w-none"
            onClick={() => setIsEditing(true)}
        >
            {value ? <MarkdownRenderer>{value}</MarkdownRenderer> : <p className="text-muted-foreground">{placeholder}</p>}
        </div>
    );
}

export function EditGoalDialog({ goalId, children }: { goalId: string, children: ReactNode }) {
  const { getGoalById, updateGoal, deleteGoal, duplicateGoal, goals, topics, getTopicBreadcrumbs, addNotification } = useAppContext();
  const [goalTitle, setGoalTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('Vừa');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState('10:00');
  const [status, setStatus] = useState<GoalStatus>('chưa bắt đầu');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [customProperties, setCustomProperties] = useState<Array<{id: number, key: string, value: string}>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [topicPopoverOpen, setTopicPopoverOpen] = useState(false);
  const [createdAt, setCreatedAt] = useState<Date | undefined>();
  
  const originalGoal = useMemo(() => getGoalById(goalId), [getGoalById, goalId]);

  const topicOptions = useMemo(() => {
    return topics.map(topic => {
        const breadcrumbs = getTopicBreadcrumbs(topic.id);
        const name = breadcrumbs.map(b => b.name).join(' / ');
        return {
            id: topic.id,
            name: name,
            interestId: topic.interestId
        }
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [topics, getTopicBreadcrumbs]);

  const potentialParentGoals = useMemo(() => {
    const descendants = new Set<string>();
    const findDescendants = (parentId: string) => {
        goals.forEach(g => {
            if (g.parentId === parentId) {
                descendants.add(g.id);
                findDescendants(g.id);
            }
        });
    };
    findDescendants(goalId);

    return goals.filter(g => {
      if (g.id === goalId || descendants.has(g.id)) return false;
      if (selectedTopicIds.length === 0) return true;
      const gTopicIds = g.topicIds?.length ? g.topicIds : (g.topicId ? [g.topicId] : []);
      return gTopicIds.some(tid => selectedTopicIds.includes(tid));
    });
  }, [goals, selectedTopicIds, goalId]);


  useEffect(() => {
    if (isOpen) {
      if (originalGoal) {
        setGoalTitle(originalGoal.title);
        setDescription(originalGoal.description || '');
        setStatus(originalGoal.status);
        setPriority(originalGoal.priority || 'Vừa');
        // Load topicIds array with fallback to singular topicId
        const loadedTopicIds = originalGoal.topicIds?.length
          ? originalGoal.topicIds
          : (originalGoal.topicId ? [originalGoal.topicId] : []);
        setSelectedTopicIds(loadedTopicIds);
        setSelectedParentId(originalGoal.parentId || null);
        
        const sDate = getDateFromFirestore(originalGoal.startDate);
        setStartDate(sDate || undefined);
        if (sDate) setStartTime(format(sDate, "HH:mm"));
        else setStartTime('09:00');

        const eDate = getDateFromFirestore(originalGoal.endDate);
        setEndDate(eDate || undefined);
        if (eDate) setEndTime(format(eDate, "HH:mm"));
        else setEndTime('10:00');

        const cDate = getDateFromFirestore(originalGoal.createdAt);
        setCreatedAt(cDate || undefined);

        if (originalGoal.customProperties) {
          setCustomProperties(
            Object.entries(originalGoal.customProperties).map(([key, value], index) => ({ id: index, key, value: String(value) }))
          );
        } else {
          setCustomProperties([]);
        }
      }
    }
  }, [isOpen]); // Only run when opening the dialog

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
  
  const handleToggleTopic = (topicId: string) => {
    setSelectedTopicIds(prev =>
      prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
    );
    setTopicPopoverOpen(false);
  };

  const handleUpdateGoal = async () => {
    if (goalTitle.trim()) {
      const finalStartDate = startDate ? combineDateTime(startDate, startTime) : null;
      const finalEndDate = endDate ? combineDateTime(endDate, endTime) : null;

      const customPropsObject = customProperties
        .filter(p => p.key.trim() !== '')
        .reduce((acc, prop) => {
          acc[prop.key.trim()] = prop.value;
          return acc;
        }, {} as { [key: string]: string });

      const updatedData: Partial<Omit<Goal, 'id'>> & { topicIds?: string[] } = {
        title: goalTitle.trim(),
        description: description,
        priority: priority,
        startDate: finalStartDate,
        endDate: finalEndDate,
        status: status,
        customProperties: customPropsObject,
        topicIds: selectedTopicIds,
        topicId: selectedTopicIds[0] || null,
        parentId: selectedParentId,
      };

      await updateGoal(goalId, updatedData);
      setIsOpen(false);
    }
  };

  const handleDeleteGoal = async () => {
    await deleteGoal(goalId);
    setIsOpen(false);
  }

  const handleDuplicateGoal = async () => {
    await duplicateGoal(goalId);
    setIsOpen(false);
  };
  
  const handleAddReminder = (minutes: number, before: 'start' | 'end') => {
    if (before === 'start' && !startDate) return;
    if (before === 'end' && !endDate) return;

    const referenceDate = before === 'start' ? startDate : endDate;
    const sendAt = new Date(referenceDate!.getTime() - minutes * 60000);

    const notificationData = {
      title: `Mục tiêu sắp ${before === 'start' ? 'bắt đầu' : 'hết hạn'}: ${goalTitle}`,
      body: `Mục tiêu "${goalTitle}" sẽ ${before === 'start' ? 'bắt đầu' : 'kết thúc'} trong ${minutes} phút nữa.`,
      sendAt,
      link: { type: 'goal' as const, id: goalId }
    };
    
    addNotification(notificationData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa mục tiêu</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span>Cập nhật chi tiết mục tiêu của bạn.</span>
            {createdAt && (
              <span className="text-xs text-muted-foreground ml-auto">
                Đã tạo lúc {format(createdAt, "HH:mm 'ngày' dd/MM/yyyy", { locale: vi })}
              </span>
            )}
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
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateGoal()}
              />
            </div>
             <div className="space-y-2">
                <Label htmlFor="goal-description-edit">Ghi chú & Mô tả chi tiết</Label>
                <BlockNoteEditorComponent
                    content={description}
                    onChange={setDescription}
                    placeholder="Ghi chú chi tiết hơn về mục tiêu này. Hỗ trợ Wikilinks [[...]], #tags..."
                />
            </div>
            <div className="space-y-2">
              <Label>Chủ đề (có thể chọn nhiều)</Label>
              {selectedTopicIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {selectedTopicIds.map(tid => {
                    const t = topicOptions.find(o => o.id === tid);
                    return t ? (
                      <span key={tid} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5 font-medium">
                        {t.name}
                        <button type="button" onClick={() => handleToggleTopic(tid)} className="ml-0.5 hover:text-destructive" aria-label={`Bỏ chọn ${t.name}`}>
                          <Icons.close className="h-3 w-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <Popover open={topicPopoverOpen} onOpenChange={setTopicPopoverOpen} modal={true}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={topicPopoverOpen}
                        className="w-full justify-between"
                    >
                        <span className="text-muted-foreground">
                          {selectedTopicIds.length > 0 ? `${selectedTopicIds.length} chủ đề đã chọn` : "Chọn chủ đề..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Tìm chủ đề..." />
                        <CommandList>
                            <CommandEmpty>Không tìm thấy chủ đề.</CommandEmpty>
                            <CommandGroup>
                              {topicOptions.map(topic => (
                                  <CommandItem
                                      key={topic.id}
                                      value={topic.name}
                                      onSelect={() => handleToggleTopic(topic.id)}
                                  >
                                      <Check
                                          className={cn(
                                              "mr-2 h-4 w-4",
                                              selectedTopicIds.includes(topic.id) ? "opacity-100" : "opacity-0"
                                          )}
                                      />
                                      <span className="truncate">{topic.name}</span>
                                  </CommandItem>
                              ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent-goal-edit">Mục tiêu cha (Tùy chọn)</Label>
              <Select
                  value={selectedParentId || 'none'}
                  onValueChange={(value) => setSelectedParentId(value === 'none' ? null : value)}
                  
              >
                  <SelectTrigger id="parent-goal-edit">
                      <SelectValue placeholder="Chọn mục tiêu cha..." />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="none">Không có (Mục tiêu gốc)</SelectItem>
                      {potentialParentGoals.map((parentGoal) => (
                          <SelectItem key={parentGoal.id} value={parentGoal.id}>
                              {parentGoal.title}
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
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
                <Popover modal={true}>
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
                <Popover modal={true}>
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
                  <SelectItem value="hủy">Hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <Separator />
              <div className="space-y-2">
                  <Label>Nhắc nhở</Label>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between" disabled={!startDate && !endDate}>
                              <span>Thêm lời nhắc...</span>
                              <Icons.notification className="h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                          <DropdownMenuSub>
                              <DropdownMenuSubTrigger disabled={!startDate}>
                                  <span>Trước khi bắt đầu</span>
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                  {[5, 15, 30, 60].map(min => (
                                      <DropdownMenuItem key={`start-${min}`} onSelect={() => handleAddReminder(min, 'start')}>
                                          Trước {min} phút
                                      </DropdownMenuItem>
                                  ))}
                              </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSub>
                              <DropdownMenuSubTrigger disabled={!endDate}>
                                  <span>Trước khi kết thúc</span>
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                  {[5, 15, 30, 60].map(min => (
                                      <DropdownMenuItem key={`end-${min}`} onSelect={() => handleAddReminder(min, 'end')}>
                                          Trước {min} phút
                                      </DropdownMenuItem>
                                  ))}
                              </DropdownMenuSubContent>
                          </DropdownMenuSub>
                      </DropdownMenuContent>
                  </DropdownMenu>
                  {(!startDate && !endDate) && <p className="text-xs text-muted-foreground mt-2">Vui lòng đặt ngày bắt đầu hoặc kết thúc để thêm lời nhắc.</p>}
              </div>
            <Separator />
            <div className="space-y-2">
              <Label>Thuộc tính tùy chỉnh</Label>
              <div className="space-y-2">
                {customProperties.map((prop) => (
                  <div key={prop.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Tên thuộc tính" 
                      value={prop.key}
                      onChange={(e) => handlePropertyChange(prop.id, 'key', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateGoal()}
                    />
                    <Input 
                      placeholder="Giá trị" 
                      value={prop.value}
                      onChange={(e) => handlePropertyChange(prop.id, 'value', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateGoal()}
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
        </div>
        <DialogFooter className="sm:justify-between pt-2">
          <div className='flex gap-2'>
              <Button variant="destructive" onClick={handleDeleteGoal}>
                  <Icons.delete className="mr-2 h-4 w-4" />
                  Xóa
              </Button>
               <Button variant="secondary" onClick={handleDuplicateGoal}>
                  <Icons.copy className="mr-2 h-4 w-4" />
                  Nhân bản
              </Button>
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
                <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button type="submit" onClick={handleUpdateGoal}>
                Lưu thay đổi
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
