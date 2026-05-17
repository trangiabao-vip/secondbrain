'use client';
import { useState, type ReactNode, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/contexts/AppContext';
import { Icons } from '../icons';
import { format, setHours, setMinutes, addMinutes } from "date-fns";
import { vi } from 'date-fns/locale';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { GoalPriority } from '@/lib/data';
import { Separator } from '../ui/separator';
import { MarkdownRenderer } from '../ui/markdown-renderer';
import { BlockNoteEditorComponent } from '../notes/BlockNoteEditor';

function EditableMarkdown({ value, onChange, placeholder }: { value: string, onChange: (value: string) => void, placeholder: string }) {
    const [isEditing, setIsEditing] = useState(true);

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

export function AddGoalDialog({ 
  children, 
  startDate: initialStartDate,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: { children?: ReactNode, startDate?: Date, open?: boolean, onOpenChange?: (open: boolean) => void }) {
  const { addGoal, selectedTopic, goals, topics, getTopicBreadcrumbs } = useAppContext();
  const [goalTitle, setGoalTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('Vừa');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState('10:00');
  const [parentId, setParentId] = useState<string | null>(null);
  const [customProperties, setCustomProperties] = useState<Array<{id: number, key: string, value: string}>>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [topicPopoverOpen, setTopicPopoverOpen] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalOnOpenChange !== undefined ? externalOnOpenChange : setInternalOpen;

  const topicOptions = useMemo(() => {
    return topics.map(topic => {
      const breadcrumbs = getTopicBreadcrumbs(topic.id);
      const name = breadcrumbs.map(b => b.name).join(' / ');
      return { id: topic.id, name };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [topics, getTopicBreadcrumbs]);

  const potentialParentGoals = useMemo(() => {
    const filterTopics = selectedTopicIds.length > 0 ? selectedTopicIds : (selectedTopic ? [selectedTopic.id] : []);
    return goals.filter(g => {
      const gTopicIds = g.topicIds?.length ? g.topicIds : (g.topicId ? [g.topicId] : []);
      return gTopicIds.some(tid => filterTopics.includes(tid)) && !g.parentId;
    });
  }, [goals, selectedTopicIds, selectedTopic]);

  const handleToggleTopic = (topicId: string) => {
    setSelectedTopicIds(prev =>
      prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
    );
  };

  useEffect(() => {
    if (isOpen) {
      // Pre-fill topic from selectedTopic context
      if (selectedTopic) {
        setSelectedTopicIds([selectedTopic.id]);
      }
      if (initialStartDate) {
        setStartDate(initialStartDate);
        setStartTime(format(initialStartDate, "HH:mm"));
        setEndDate(initialStartDate);
        setEndTime(format(addMinutes(initialStartDate, 60), "HH:mm"));
      }
    } else {
      // Reset state when closing
      setGoalTitle('');
      setDescription('');
      setPriority('Vừa');
      setStartDate(undefined);
      setStartTime('09:00');
      setEndDate(undefined);
      setEndTime('10:00');
      setParentId(null);
      setCustomProperties([]);
      setSelectedTopicIds([]);
    }
  }, [isOpen, initialStartDate, selectedTopic]);

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

      // Merge selectedTopicIds with selectedTopic context (fallback)
      const finalTopicIds = selectedTopicIds.length > 0
        ? selectedTopicIds
        : (selectedTopic ? [selectedTopic.id] : []);

      addGoal({
        title: goalTitle.trim(),
        description,
        priority,
        startDate: finalStartDate,
        endDate: finalEndDate,
        customProperties: customPropsObject,
        parentId,
        topicIds: finalTopicIds,
        topicId: finalTopicIds[0] || null,
      });
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Thêm mục tiêu mới</DialogTitle>
          <DialogDescription>
            Đặt mục tiêu mới, có thể thuộc nhiều chủ đề.
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
              <Label htmlFor="goal-description">Ghi chú & Mô tả chi tiết</Label>
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
                  <Button variant="outline" role="combobox" aria-expanded={topicPopoverOpen} className="w-full justify-between">
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
                          <CommandItem key={topic.id} value={topic.name} onSelect={() => handleToggleTopic(topic.id)}>
                            <Check className={cn("mr-2 h-4 w-4", selectedTopicIds.includes(topic.id) ? "opacity-100" : "opacity-0")} />
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
              <Label htmlFor="parent-goal-add">Mục tiêu cha (Tùy chọn)</Label>
              <Select
                  value={parentId || 'none'}
                  onValueChange={(value) => setParentId(value === 'none' ? null : value)}
                  
              >
                  <SelectTrigger id="parent-goal-add">
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
              <Label htmlFor="priority-add">Mức độ ưu tiên</Label>
              <Select value={priority} onValueChange={(value: GoalPriority) => setPriority(value)} >
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
              <Label htmlFor="end-date">Ngày kết thúc (Tùy chọn)</Label>
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
                      onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                    />
                    <Input 
                      placeholder="Giá trị" 
                      value={prop.value}
                      onChange={(e) => handlePropertyChange(prop.id, 'value', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
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
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button type="submit" onClick={handleAddGoal}>
                Thêm mục tiêu
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
