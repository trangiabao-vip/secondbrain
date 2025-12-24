'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { useAppContext } from '@/contexts/AppContext';
import { type Topic, type Goal, type Task, type WikiPage } from '@/lib/data';
import { EditGoalDialog } from '@/components/goals/EditGoalDialog';
import { AddOrEditTaskDialog } from '@/components/tasks/AddOrEditTaskDialog';
import { WikiPageDialog } from '@/components/wiki/WikiPageDialog';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface NodeProps {
  id: string;
  type: 'channel' | 'topic' | 'goal' | 'task' | 'wiki';
  title: string;
  children?: NodeProps[];
  x: number;
  y: number;
}

const NodeCard = ({ node, onClick }: { node: NodeProps; onClick: (node: NodeProps) => void }) => {
    const iconMap = {
        channel: <Icons.channel className="h-5 w-5" />,
        topic: <Icons.topic className="h-5 w-5" />,
        goal: <Icons.goal className="h-5 w-5" />,
        task: <Icons.task className="h-5 w-5" />,
        wiki: <Icons.topic className="h-5 w-5" />,
    };

    const colorMap = {
        channel: 'bg-primary/10 border-primary',
        topic: 'bg-secondary',
        goal: 'bg-blue-500/10',
        task: 'bg-green-500/10',
        wiki: 'bg-purple-500/10',
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'absolute', left: node.x, top: node.y }}
            className="w-48"
        >
            <Card className={`cursor-pointer hover:shadow-xl transition-shadow ${colorMap[node.type]}`} onClick={() => onClick(node)}>
                <CardHeader className="flex-row items-center gap-2 p-3">
                    {iconMap[node.type]}
                    <CardTitle className="text-sm font-semibold line-clamp-2">{node.title}</CardTitle>
                </CardHeader>
            </Card>
        </motion.div>
    );
};

const Line = ({ from, to }: { from: {x: number, y: number}, to: {x: number, y: number}}) => {
    return (
        <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', zIndex: -1 }}
        >
            <path
                d={`M ${from.x + 96} ${from.y + 35} L ${to.x + 96} ${to.y + 35}`}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1.5"
            />
        </motion.svg>
    )
}

export function ChannelVisualizer({ channelId }: { channelId: string }) {
  const { getChannelById, topics, goals, tasks, wikiPages } = useAppContext();

  const dataTree = useMemo(() => {
    const channel = getChannelById(channelId);
    if (!channel) return null;

    const channelNode: NodeProps = { id: channel.id, type: 'channel', title: channel.name, children: [], x: 0, y: 0 };

    const channelTopics = topics.filter(t => channel.topicIds?.includes(t.id));

    channelNode.children = channelTopics.map(topic => {
      const topicNode: NodeProps = { id: topic.id, type: 'topic', title: topic.name, children: [], x: 0, y: 0 };
      
      const topicGoals = goals.filter(g => g.topicId === topic.id && channel.goalIds?.includes(g.id));
      const topicTasks = tasks.filter(t => (t.topicId === topic.id || topicGoals.some(g => g.id === t.goalId)) && channel.taskIds?.includes(t.id));
      const topicWikiPages = wikiPages.filter(w => w.topicId === topic.id);

      topicNode.children = [
        ...topicGoals.map(g => ({ id: g.id, type: 'goal' as const, title: g.title, x: 0, y: 0 })),
        ...topicTasks.map(t => ({ id: t.id, type: 'task' as const, title: t.text, x: 0, y: 0 })),
        ...topicWikiPages.map(w => ({ id: w.id, type: 'wiki' as const, title: w.title, x: 0, y: 0 })),
      ];
      
      return topicNode;
    });

    // Calculate positions
    const allNodes: NodeProps[] = [];
    const allLines: {from: NodeProps, to: NodeProps}[] = [];
    const COL_WIDTH = 250;
    const ROW_HEIGHT = 90;

    channelNode.x = 0;
    channelNode.y = 0; // Will be centered later
    allNodes.push(channelNode);

    let totalHeight = 0;
    let topicY = 0;

    channelNode.children?.forEach((topicNode, topicIndex) => {
        topicNode.x = COL_WIDTH;
        topicNode.y = topicY;
        allNodes.push(topicNode);
        allLines.push({ from: channelNode, to: topicNode });

        let leafY = topicY;
        
        topicNode.children?.forEach((leafNode, leafIndex) => {
            leafNode.x = COL_WIDTH * 2;
            leafNode.y = leafY;
            allNodes.push(leafNode);
            allLines.push({ from: topicNode, to: leafNode });
            leafY += ROW_HEIGHT;
        });
        
        const topicHeight = Math.max(ROW_HEIGHT, (topicNode.children?.length || 0) * ROW_HEIGHT);
        topicY += topicHeight;
    });
    
    totalHeight = topicY;
    channelNode.y = (totalHeight - ROW_HEIGHT) / 2;
    
    return { nodes: allNodes, lines: allLines, width: COL_WIDTH * 3, height: totalHeight };

  }, [channelId, getChannelById, topics, goals, tasks, wikiPages]);
  
  const [dialogState, setDialogState] = useState<{type: 'goal' | 'task' | 'wiki', id: string} | null>(null);

  const handleNodeClick = (node: NodeProps) => {
    if (['goal', 'task', 'wiki'].includes(node.type)) {
      setDialogState({ type: node.type as 'goal' | 'task' | 'wiki', id: node.id });
    }
  };

  if (!dataTree) {
    return <p>Đang tải sơ đồ kênh...</p>;
  }

  const { nodes, lines, width, height } = dataTree;

  return (
    <div className="flex-1 h-full w-full bg-background rounded-lg border overflow-hidden">
        <ScrollArea className="w-full h-full">
            <div className="relative p-8" style={{ width: width, height: height }}>
                <AnimatePresence>
                    {lines.map((line, index) => (
                        <Line key={index} from={line.from} to={line.to} />
                    ))}
                    {nodes.map(node => (
                        <NodeCard key={`${node.type}-${node.id}`} node={node} onClick={handleNodeClick} />
                    ))}
                </AnimatePresence>
            </div>
        </ScrollArea>
        {dialogState?.type === 'goal' && (
            <EditGoalDialog goalId={dialogState.id}>
                <button className="hidden" onClick={() => setDialogState(null)}></button>
            </EditGoalDialog>
        )}
        {dialogState?.type === 'task' && (
             <AddOrEditTaskDialog mode="edit" taskId={dialogState.id}>
                <button className="hidden" onClick={() => setDialogState(null)}></button>
            </AddOrEditTaskDialog>
        )}
        {dialogState?.type === 'wiki' && (
             <WikiPageDialog mode="view" pageId={dialogState.id}>
                <button className="hidden" onClick={() => setDialogState(null)}></button>
            </WikiPageDialog>
        )}
    </div>
  );
}
