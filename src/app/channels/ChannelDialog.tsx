'use client';
import { useState, type ReactNode, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  channelId?: string;
}

export function ChannelDialog({ open, onOpenChange, mode, channelId }: ChannelDialogProps) {
  const { topics, goals, tasks, getChannelById, addChannel, updateChannel } = useAppContext();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const [topicPopoverOpen, setTopicPopoverOpen] = useState(false);
  const [goalPopoverOpen, setGoalPopoverOpen] = useState(false);
  const [taskPopoverOpen, setTaskPopoverOpen] = useState(false);
  
  const [topicSearchTerm, setTopicSearchTerm] = useState('');
  const [goalSearchTerm, setGoalSearchTerm] = useState('');
  const [taskSearchTerm, setTaskSearchTerm] = useState('');

  const [facebook, setFacebook] = useState('');
  const [youtube, setYoutube] = useState('');
  const [discord, setDiscord] = useState('');
  const [zalo, setZalo] = useState('');
  
  useEffect(() => {
    if (open) {
        if (mode === 'edit' && channelId) {
            const channel = getChannelById(channelId);
            if (channel) {
                setName(channel.name);
                setDescription(channel.description || '');
                setSelectedTopicIds(channel.topicIds || []);
                setSelectedGoalIds(channel.goalIds || []);
                setSelectedTaskIds(channel.taskIds || []);
                setFacebook(channel.facebook || '');
                setYoutube(channel.youtube || '');
                setDiscord(channel.discord || '');
                setZalo(channel.zalo || '');
            }
        } else {
            setName('');
            setDescription('');
            setSelectedTopicIds([]);
            setSelectedGoalIds([]);
            setSelectedTaskIds([]);
            setFacebook('');
            setYoutube('');
            setDiscord('');
            setZalo('');
        }
    }
  }, [open, mode, channelId, getChannelById]);

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
        goalIds: selectedGoalIds,
        taskIds: selectedTaskIds,
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
    
    onOpenChange(false);
  };
  
  const handleTopicToggle = (topicId: string, event?: React.MouseEvent) => {
    event?.preventDefault();
    const isSelected = selectedTopicIds.includes(topicId);
    if (isSelected) {
      setSelectedTopicIds(prev => {
        const newSelectedTopicIds = prev.filter(id => id !== topicId);
        // Also deselect goals and tasks related to the deselected topic
        const goalsToDeselect = goals.filter(g => g.topicId === topicId).map(g => g.id);
        setSelectedGoalIds(prevGoals => prevGoals.filter(id => !goalsToDeselect.includes(id)));
        const tasksToDeselect = tasks.filter(t => t.topicId === topicId || goalsToDeselect.includes(t.goalId!)).map(t => t.id);
        setSelectedTaskIds(prevTasks => prevTasks.filter(id => !tasksToDeselect.includes(id)));
        return newSelectedTopicIds;
      });
    } else {
      setSelectedTopicIds(prev => [...prev, topicId]);
    }
  };

  const handleGoalToggle = (goalId: string, event?: React.MouseEvent) => {
    event?.preventDefault();
    setSelectedGoalIds(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleTaskToggle = (taskId: string, event?: React.MouseEvent) => {
    event?.preventDefault();
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const filteredTopics = topics.filter(topic => topic.name.toLowerCase().includes(topicSearchTerm.toLowerCase()));

  const availableGoals = useMemo(() => {
    return goals.filter(goal => selectedTopicIds.includes(goal.topicId));
  }, [goals, selectedTopicIds]);
  
  const filteredGoals = availableGoals.filter(goal => goal.title.toLowerCase().includes(goalSearchTerm.toLowerCase()));
  
  const availableTasks = useMemo(() => {
    const selectedGoalIdsSet = new Set(selectedGoalIds);
    return tasks.filter(task => 
      selectedTopicIds.includes(task.topicId!) || 
      (task.goalId && selectedGoalIdsSet.has(task.goalId))
    );
  }, [tasks, selectedTopicIds, selectedGoalIds]);

  const filteredTasks = availableTasks.filter(task => task.text.toLowerCase().includes(taskSearchTerm.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
             {mode === 'add' ? 'Tạo kênh mới' : 'Chỉnh sửa kênh'}
          </DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết cho kênh của bạn.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] -mr-4 pr-4">
          <div className="space-y-4 py-2">
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
                  <Popover open={topicPopoverOpen} onOpenChange={setTopicPopoverOpen} modal={false}>
                      <PopoverTrigger asChild>
                      <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={topicPopoverOpen}
                          className="w-full justify-between h-auto"
                      >
                          <div className="flex gap-1 flex-wrap">
                              {selectedTopicIds.length > 0 ? selectedTopicIds.map(id => {
                                  const topic = topics.find(t => t.id === id);
                                  return (
                                      <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                          {topic?.name || id}
                                          <button
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleTopicToggle(id, e);
                                              }}
                                              className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                                          >
                                              <Icons.close className="h-3 w-3" />
                                          </button>
                                      </Badge>
                                  )
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
                                  value={topicSearchTerm}
                                  onChange={(e) => setTopicSearchTerm(e.target.value)}
                                  className="pl-8"
                                  />
                              </div>
                          </div>

                          <Separator />
                          <div className="p-2 space-y-1">
                          {filteredTopics.length > 0 ? (
                              filteredTopics.map((topic) => (
                              <div
                                  key={topic.id}
                                  onClick={(e) => handleTopicToggle(topic.id, e)}
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
                      </PopoverContent>
                  </Popover>
              </div>

              {selectedTopicIds.length > 0 && availableGoals.length > 0 && (
                <div className="space-y-2">
                  <Label>Mục tiêu liên quan</Label>
                  <Popover open={goalPopoverOpen} onOpenChange={setGoalPopoverOpen} modal={false}>
                      <PopoverTrigger asChild>
                      <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={goalPopoverOpen}
                          className="w-full justify-between h-auto"
                      >
                          <div className="flex gap-1 flex-wrap">
                              {selectedGoalIds.length > 0 ? selectedGoalIds.map(id => {
                                  const goal = goals.find(g => g.id === id);
                                  return (
                                      <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                          {goal?.title || id}
                                           <button
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleGoalToggle(id, e);
                                              }}
                                              className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                                          >
                                              <Icons.close className="h-3 w-3" />
                                          </button>
                                      </Badge>
                                  )
                              }) : "Chọn mục tiêu..."}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                      </PopoverTrigger>
                       <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <div className="p-2">
                              <div className="relative">
                                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                  placeholder="Tìm kiếm mục tiêu..."
                                  value={goalSearchTerm}
                                  onChange={(e) => setGoalSearchTerm(e.target.value)}
                                  className="pl-8"
                                  />
                              </div>
                          </div>

                          <Separator />
                          <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                          {filteredGoals.length > 0 ? (
                              filteredGoals.map((goal) => (
                              <div
                                  key={goal.id}
                                  onClick={(e) => handleGoalToggle(goal.id, e)}
                                  className="flex cursor-pointer items-center rounded-md p-2 text-sm hover:bg-accent"
                              >
                                  <Check
                                      className={cn(
                                          'mr-2 h-4 w-4',
                                          selectedGoalIds.includes(goal.id) ? 'opacity-100' : 'opacity-0'
                                      )}
                                  />
                                  <span>{goal.title}</span>
                              </div>
                              ))
                          ) : (
                              <p className="p-2 text-center text-sm text-muted-foreground">Không có mục tiêu phù hợp.</p>
                          )}
                          </div>
                      </PopoverContent>
                  </Popover>
                </div>
              )}
              
              {selectedTopicIds.length > 0 && availableTasks.length > 0 && (
                <div className="space-y-2">
                  <Label>Nhiệm vụ liên quan</Label>
                  <Popover open={taskPopoverOpen} onOpenChange={setTaskPopoverOpen} modal={false}>
                      <PopoverTrigger asChild>
                      <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={taskPopoverOpen}
                          className="w-full justify-between h-auto"
                      >
                          <div className="flex gap-1 flex-wrap">
                              {selectedTaskIds.length > 0 ? selectedTaskIds.map(id => {
                                  const task = tasks.find(t => t.id === id);
                                  return (
                                      <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                          {task?.text || id}
                                           <button
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleTaskToggle(id, e);
                                              }}
                                              className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                                          >
                                              <Icons.close className="h-3 w-3" />
                                          </button>
                                      </Badge>
                                  )
                              }) : "Chọn nhiệm vụ..."}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                      </PopoverTrigger>
                       <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <div className="p-2">
                              <div className="relative">
                                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                  placeholder="Tìm kiếm nhiệm vụ..."
                                  value={taskSearchTerm}
                                  onChange={(e) => setTaskSearchTerm(e.target.value)}
                                  className="pl-8"
                                  />
                              </div>
                          </div>

                          <Separator />
                          <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                          {filteredTasks.length > 0 ? (
                              filteredTasks.map((task) => (
                              <div
                                  key={task.id}
                                  onClick={(e) => handleTaskToggle(task.id, e)}
                                  className="flex cursor-pointer items-center rounded-md p-2 text-sm hover:bg-accent"
                              >
                                  <Check
                                      className={cn(
                                          'mr-2 h-4 w-4',
                                          selectedTaskIds.includes(task.id) ? 'opacity-100' : 'opacity-0'
                                      )}
                                  />
                                  <span className="truncate">{task.text}</span>
                              </div>
                              ))
                          ) : (
                              <p className="p-2 text-center text-sm text-muted-foreground">Không có nhiệm vụ phù hợp.</p>
                          )}
                          </div>
                      </PopoverContent>
                  </Popover>
                </div>
              )}

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
        </ScrollArea>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button onClick={handleSubmit}>{mode === 'add' ? 'Tạo kênh' : 'Lưu thay đổi'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
