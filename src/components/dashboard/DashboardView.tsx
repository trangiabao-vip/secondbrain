'use client';

import { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { type Topic, type Goal, type Task } from '@/lib/data';

export function DashboardView() {
  const { interests, topics, goals, tasks } = useAppContext();
  const router = useRouter();

  // 1. Calculate North Star Metrics
  const metrics = useMemo(() => {
    const taskMap = new Map<string, Task[]>();
    tasks.forEach(t => {
      const gid = t.goalId || 'orphaned';
      if (!taskMap.has(gid)) taskMap.set(gid, []);
      taskMap.get(gid)!.push(t);
    });

    const goalProgress = new Map<string, number>();
    goals.forEach(g => {
      const goalTasks = taskMap.get(g.id) || [];
      if (goalTasks.length === 0) {
        goalProgress.set(g.id, g.status === 'hoàn thành' ? 100 : 0);
      } else {
        const completed = goalTasks.filter(t => t.status === 'hoàn thành').length;
        goalProgress.set(g.id, Math.round((completed / goalTasks.length) * 100));
      }
    });

    const topicMetrics = topics.map(topic => {
      const topicGoals = goals.filter(g => g.topicId === topic.id);
      let progress = 0;
      if (topicGoals.length > 0) {
        progress = Math.round(topicGoals.reduce((acc, g) => acc + (goalProgress.get(g.id) || 0), 0) / topicGoals.length);
      } else {
        // Fallback to tasks directly linked to topic if no goals
        const topicTasks = tasks.filter(t => t.topicId === topic.id);
        if (topicTasks.length > 0) {
          progress = Math.round((topicTasks.filter(t => t.status === 'hoàn thành').length / topicTasks.length) * 100);
        }
      }
      return { ...topic, progress, goalCount: topicGoals.length };
    });

    const interestMetrics = interests.map(interest => {
      const iTopics = topicMetrics.filter(t => t.interestId === interest.id);
      const progress = iTopics.length > 0 
        ? Math.round(iTopics.reduce((acc, t) => acc + t.progress, 0) / iTopics.length)
        : 0;
      return { ...interest, progress, topics: iTopics };
    });

    // Orphan Detection (Noise)
    const orphanedTasks = tasks.filter(t => !t.goalId && !t.topicId);

    return { interestMetrics, orphanedTasks };
  }, [interests, topics, goals, tasks]);

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-emerald-500";
    if (progress >= 70) return "bg-blue-500";
    if (progress >= 30) return "bg-amber-500";
    return "bg-slate-400";
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          North Star Engine
        </h1>
        <p className="text-muted-foreground text-lg">
          Hệ thống điều hướng mục tiêu theo tầng lớp giá trị.
        </p>
      </div>

      {/* Noise Detection Alert */}
      {metrics.orphanedTasks.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-900/30">
          <CardHeader className="flex flex-row items-center gap-4 py-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-full text-amber-600">
              <Icons.alert className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-amber-800 dark:text-amber-400">Phát hiện "Nhiễu" (Noise Detected)</CardTitle>
              <CardDescription className="text-amber-700/70 dark:text-amber-500/70">
                Có {metrics.orphanedTasks.length} nhiệm vụ chưa được gán vào mục tiêu hay chủ đề nào. 
                Chúng đang làm loãng sự tập trung của bạn.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="border-amber-200 hover:bg-amber-100 text-amber-800" onClick={() => router.push('/tasks')}>
              Dọn dẹp ngay
            </Button>
          </CardHeader>
        </Card>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.interestMetrics.map((interest) => (
          <Card key={interest.id} className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-card to-secondary/30 group hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                  <Icons.star className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="font-mono text-lg px-3 py-1 bg-background/50 backdrop-blur-sm">
                  {interest.progress}%
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold">{interest.name}</CardTitle>
              <Progress value={interest.progress} className="h-2 mt-4" indicatorClassName={getProgressColor(interest.progress)} />
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Chủ đề trọng tâm</div>
              <div className="space-y-3">
                {interest.topics.length > 0 ? (
                  interest.topics.slice(0, 4).map(topic => (
                    <div 
                      key={topic.id} 
                      className="flex flex-col gap-1 cursor-pointer hover:opacity-80 group/topic"
                      onClick={() => router.push(`/interests/${interest.id}/${topic.id}`)}
                    >
                      <div className="flex justify-between text-sm items-center">
                        <span className="font-medium group-hover/topic:text-primary transition-colors">{topic.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{topic.progress}%</span>
                      </div>
                      <div className="w-full bg-secondary h-1 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-500", getProgressColor(topic.progress))}
                          style={{ width: `${topic.progress}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground italic py-4 text-center border-2 border-dashed rounded-xl">
                    Chưa có chủ đề nào
                  </div>
                )}
                {interest.topics.length > 4 && (
                  <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => router.push(`/interests/${interest.id}`)}>
                    Xem thêm {interest.topics.length - 4} chủ đề...
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Quick Add Pillar */}
        <Card className="border-2 border-dashed bg-transparent hover:bg-secondary/20 transition-colors cursor-pointer flex flex-col items-center justify-center p-10 min-h-[300px]" onClick={() => router.push('/interests')}>
          <div className="p-4 bg-secondary rounded-full mb-4">
            <Icons.plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-xl text-muted-foreground">Thêm Pillar mới</h3>
          <p className="text-sm text-muted-foreground/60 text-center mt-2">
            Định nghĩa một lĩnh vực lớn trong cuộc sống của bạn.
          </p>
        </Card>
      </div>
    </div>
  );
}

export default DashboardView;
