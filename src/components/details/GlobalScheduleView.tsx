'use client';
import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useAppContext } from "@/contexts/AppContext";
import { format, isSameDay, startOfWeek, addDays, eachDayOfInterval, getHours, setHours, setMinutes, isSameHour, parseISO } from "date-fns";
import { vi } from 'date-fns/locale';
import { Icons } from "../icons";
import { Button } from "../ui/button";
import { EditGoalDialog } from "../goals/EditGoalDialog";
import { EditTaskDialog } from "../tasks/EditTaskDialog";
import { Goal, Task } from "@/lib/data";

const hours = Array.from({ length: 24 }, (_, i) => i);

const getDateFromFirestore = (date: any): Date | null => {
    if (!date) return null;
    if (typeof date === 'string') return parseISO(date);
    if (date.seconds) return new Date(date.seconds * 1000);
    if (date instanceof Date) return date;
    return null;
};

type ScheduledItem = (Goal | Task) & { type: 'goal' | 'task', startDate: Date, endDate?: Date };

export function GlobalScheduleView() {
  const { goals, tasks } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());

  const week = useMemo(() => {
    const start = startOfWeek(currentDate, { locale: vi });
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [currentDate]);

  const scheduledItems = useMemo((): ScheduledItem[] => {
    const goalItems: ScheduledItem[] = goals
        .filter(g => g.endDate)
        .map(g => ({ ...g, type: 'goal' as const, startDate: getDateFromFirestore(g.startDate)!, endDate: getDateFromFirestore(g.endDate)! }))
        .filter(item => item.startDate);

    const taskItems: ScheduledItem[] = tasks
        .filter(t => t.startDate)
        .map(t => ({ ...t, type: 'task' as const, startDate: getDateFromFirestore(t.startDate)!, endDate: getDateFromFirestore(t.endDate) }))
        .filter(item => item.startDate);
        
    return [...goalItems, ...taskItems];
  }, [goals, tasks]);

  const getItemsForHour = (day: Date, hour: number) => {
    return scheduledItems.filter(item => {
      if (!isSameDay(item.startDate, day)) return false;
      if (item.type === 'goal') return false;
      return getHours(item.startDate) === hour;
    });
  };
  
  const getItemsForAllday = (day: Date) => {
    return scheduledItems.filter(item => 
        item.startDate && isSameDay(item.startDate, day) && item.type === 'goal'
    );
  }

  const goToPreviousWeek = () => setCurrentDate(prev => addDays(prev, -7));
  const goToNextWeek = () => setCurrentDate(prev => addDays(prev, 7));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="flex gap-6 h-full">
      <div className="w-64 hidden @5xl/main:block">
        <div className="p-1">
          <Calendar
            locale={vi}
            mode="single"
            selected={currentDate}
            onSelect={(date) => date && setCurrentDate(date)}
            className="w-full"
          />
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between pb-4">
          <h2 className="text-xl font-bold">
            Tháng {format(startOfWeek(currentDate, { locale: vi }), 'M, yyyy', { locale: vi })}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek} className="h-8 w-8">
              <Icons.left className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>Hôm nay</Button>
            <Button variant="outline" size="icon" onClick={goToNextWeek} className="h-8 w-8">
              <Icons.right className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-[auto,1fr] min-w-[1000px]">
            {/* Time column */}
            <div className="w-16 text-xs text-center text-muted-foreground sticky left-0 bg-background z-20">
              <div className="h-10 border-b"></div>
              <div className="h-10 flex items-center justify-center border-b">Cả ngày</div>
              {hours.map(hour => (
                <div key={hour} className="h-16 text-right pr-2 relative">
                  <span className="relative -top-2">
                    {format(setHours(new Date(), hour), 'HH:mm')}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className="grid grid-cols-7">
              {week.map(day => (
                <div key={day.toISOString()} className="border-l">
                  <div className={`h-10 border-b text-center py-1 sticky top-0 bg-background z-10 ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>
                    <p className="text-xs">{format(day, 'eee', { locale: vi })}</p>
                    <p className="font-semibold text-lg">{format(day, 'd')}</p>
                  </div>
                  {/* All day section */}
                  <div className="h-10 border-b p-0.5 space-y-0.5 overflow-hidden">
                    {getItemsForAllday(day).map(item => (
                      <EditGoalDialog goalId={item.id} key={`${item.type}-${item.id}`}>
                        <div className="bg-primary/20 text-primary-foreground text-xs rounded-sm px-1 py-0.5 truncate border border-primary/50 cursor-pointer hover:bg-primary/30">
                          <Icons.goal className="h-3 w-3 inline mr-1 align-middle"/>
                          {(item as Goal).title}
                        </div>
                      </EditGoalDialog>
                    ))}
                  </div>

                  {/* Hourly section */}
                  <div className="relative">
                    {hours.map(hour => (
                      <div key={hour} className="h-16 border-b relative">
                         {getItemsForHour(day, hour).map(item => {
                            const task = item as Task;
                            const startDate = getDateFromFirestore(task.startDate);
                            const endDate = getDateFromFirestore(task.endDate);

                            return (
                                <EditTaskDialog taskId={item.id} key={`${item.type}-${item.id}`}>
                                  <div className="absolute inset-x-0.5 bg-secondary/80 rounded p-1 shadow z-10 border border-border cursor-pointer hover:bg-secondary">
                                      <p className="text-xs font-bold truncate flex items-center gap-1">
                                        <Icons.task className="h-3 w-3"/>
                                        {task.text}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {startDate && format(startDate, 'HH:mm')}
                                        {endDate && ` - ${format(endDate, 'HH:mm')}`}
                                      </p>
                                  </div>
                                </EditTaskDialog>
                            );
                         })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
