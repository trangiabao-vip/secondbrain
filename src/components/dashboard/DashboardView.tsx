'use client';

import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { Topic } from '@/lib/data';
import { Button } from '../ui/button';

export function DashboardView() {
  const { interests, topics, goals, selectInterest, selectTopic } = useAppContext();

  const handleTopicClick = (topic: Topic) => {
    selectInterest(topic.interestId);
    // Use a timeout to ensure the state update for interest selection has propagated
    setTimeout(() => {
      selectTopic(topic.id);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Tổng hợp</h2>
      </div>

      {interests.map((interest) => {
        const interestTopics = topics.filter((t) => t.interestId === interest.id);
        if (interestTopics.length === 0) return null;

        return (
          <Card key={interest.id}>
            <CardHeader>
              <CardTitle className="text-xl">{interest.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full space-y-2">
                {interestTopics.map((topic) => {
                  const topicGoals = goals.filter((g) => g.topicId === topic.id);
                  return (
                    <AccordionItem value={topic.id} key={topic.id} className="border rounded-lg px-4">
                      <AccordionTrigger>
                        <div className="flex justify-between items-center w-full">
                           <span className="font-semibold">{topic.name}</span>
                           <Badge variant="outline">{topicGoals.length} mục tiêu</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {topicGoals.length > 0 ? (
                          <ul className="space-y-2 pt-2">
                            {topicGoals.map((goal) => (
                              <li key={goal.id} className="text-sm text-muted-foreground flex items-center gap-2">
                                <Icons.goal className="h-4 w-4" />
                                {goal.title}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground pt-2">Không có mục tiêu nào cho chủ đề này.</p>
                        )}
                        <Button variant="link" size="sm" className="p-0 h-auto mt-2" onClick={() => handleTopicClick(topic)}>
                           Đi đến chủ đề
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
