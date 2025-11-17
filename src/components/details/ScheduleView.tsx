'use client';
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useAppContext } from "@/contexts/AppContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isSameDay } from "date-fns";
import { vi } from 'date-fns/locale';
import { Icons } from "../icons";
import { Badge } from "../ui/badge";

export function ScheduleView() {
  const { goals, tasks, selectedTopic } = useAppContext();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const topicGoals = goals.filter(g => g.topicId === selectedTopic?.id);
  const scheduledItems = [
    ...topicGoals.filter(g => g.dueDate).map(g => ({ ...g, type: 'goal' as const, date: new Date(g.dueDate!) })),
    ...tasks.filter(t => topicGoals.some(g => g.id === t.goalId) && t.scheduledDate).map(t => ({ ...t, type: 'task' as const, date: new Date(t.scheduledDate!) }))
  ];

  const scheduledDates = scheduledItems.map(item => item.date);

  const itemsForSelectedDate = date ? scheduledItems.filter(item => isSameDay(item.date, date)) : [];
  
  return (
    <div className="grid grid-cols-1 @4xl/main:grid-cols-3 gap-6">
      <Card className="h-fit">
        <CardContent className="p-1">
          <Calendar
            locale={vi}
            mode="single"
            selected={date}
            onSelect={setDate}
            className="w-full"
            modifiers={{
              scheduled: scheduledDates,
            }}
            modifiersStyles={{
              scheduled: {
                color: 'hsl(var(--accent-foreground))',
                backgroundColor: 'hsl(var(--accent))',
              },
            }}
          />
        </CardContent>
      </Card>
      <div className="@4xl/main:col-span-2">
        <Card>
            <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">
                    {date ? `Lịch trình cho ${format(date, 'd MMMM, yyyy', { locale: vi })}` : 'Chọn một ngày'}
                </h3>
                {date && itemsForSelectedDate.length > 0 ? (
                    <ul className="space-y-3">
                        {itemsForSelectedDate.map(item => (
                            <li key={`${item.type}-${item.id}`} className="flex items-center gap-4 p-3 rounded-md bg-secondary">
                                {item.type === 'goal' ? <Icons.goal className="h-5 w-5 text-primary"/> : <Icons.task className="h-5 w-5 text-primary"/>}
                                <span className="flex-grow font-medium">{item.type === 'goal' ? item.title : item.text}</span>
                                <Badge variant={item.type === 'goal' ? 'destructive' : 'secondary'}>
                                    {item.type === 'goal' ? 'Hạn chót' : 'Nhiệm vụ'}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <Icons.calendar className="mx-auto h-12 w-12" />
                        <p className="mt-4">Không có mục nào được lên lịch cho ngày này.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
