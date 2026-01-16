


'use client';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { ScrollArea } from '../ui/scroll-area';
import { useAppContext } from '@/contexts/AppContext';
import { Interest, Topic, Goal, Task, WikiPage } from '@/lib/data';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

type SearchResultItem = (Interest | Topic | Goal | Task | WikiPage) & { itemType: string };

type SearchContextType = {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

export function GlobalSearchDialog({ children }: { children: ReactNode }) {
    const [isOpen, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const router = useRouter();

    const { interests, topics, goals, tasks, wikiPages, setItemToAutoOpen } = useAppContext();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(true);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (query.length > 1) {
            const lowerCaseQuery = query.toLowerCase();
            const allResults: SearchResultItem[] = [];

            // Search interests
            interests.forEach(item => {
                if (item.name.toLowerCase().includes(lowerCaseQuery)) {
                    allResults.push({ ...item, itemType: 'Sở thích' });
                }
            });

            // Search topics
            topics.forEach(item => {
                if (item.name.toLowerCase().includes(lowerCaseQuery) || item.description?.toLowerCase().includes(lowerCaseQuery)) {
                    allResults.push({ ...item, itemType: 'Chủ đề' });
                }
            });

            // Search goals
            goals.forEach(item => {
                if (item.title.toLowerCase().includes(lowerCaseQuery) || item.description?.toLowerCase().includes(lowerCaseQuery)) {
                    allResults.push({ ...item, itemType: 'Mục tiêu' });
                }
            });

            // Search tasks
            tasks.forEach(item => {
                if (item.text.toLowerCase().includes(lowerCaseQuery) || item.notes?.toLowerCase().includes(lowerCaseQuery)) {
                    allResults.push({ ...item, itemType: 'Nhiệm vụ' });
                }
            });

            // Search wiki pages
            wikiPages.forEach(item => {
                if (item.title.toLowerCase().includes(lowerCaseQuery) || item.content.toLowerCase().includes(lowerCaseQuery)) {
                    allResults.push({ ...item, itemType: 'Wiki' });
                }
            });
            
            setResults(allResults);
        } else {
            setResults([]);
        }
    }, [query, interests, topics, goals, tasks, wikiPages]);

    const handleSelect = (item: SearchResultItem) => {
        const itemType = item.itemType;
        let targetInterestId: string | null = null;
        let targetTopicId: string | null | undefined = null;

        if (itemType === 'Sở thích') {
            targetInterestId = item.id;
        } else if (itemType === 'Chủ đề') {
            const topic = item as Topic;
            targetInterestId = topic.interestId;
            targetTopicId = topic.id;
        } else if (itemType === 'Mục tiêu') {
            const goal = item as Goal;
            const parentTopic = topics.find(t => t.id === goal.topicId);
            if (parentTopic) {
                targetInterestId = parentTopic.interestId;
                targetTopicId = parentTopic.id;
                setItemToAutoOpen({ type: 'goal', id: goal.id });
            }
        } else if (itemType === 'Nhiệm vụ') {
            const task = item as Task;
            let parentTopic: Topic | undefined;
            if (task.goalId) {
                const parentGoal = goals.find(g => g.id === task.goalId);
                if (parentGoal) {
                    parentTopic = topics.find(t => t.id === parentGoal.topicId);
                }
            } else if (task.topicId) {
                parentTopic = topics.find(t => t.id === task.topicId);
            }
            if (parentTopic) {
                targetInterestId = parentTopic.interestId;
                targetTopicId = parentTopic.id;
                setItemToAutoOpen({ type: 'task', id: task.id, goalId: task.goalId });
            }
        } else if (itemType === 'Wiki') {
            const wikiPage = item as WikiPage;
            const parentTopic = topics.find(t => t.id === wikiPage.topicId);
            if (parentTopic) {
                targetInterestId = parentTopic.interestId;
                targetTopicId = parentTopic.id;
                // Could open wiki dialog here in the future
            }
        }
        
        if (targetInterestId && targetTopicId) {
            router.push(`/interests/${targetInterestId}/${targetTopicId}`);
        } else if (targetInterestId) {
            router.push(`/interests/${targetInterestId}`);
        }

        setOpen(false);
    }
    
    const getIcon = (itemType: string) => {
        switch (itemType) {
            case 'Sở thích': return <Icons.interest className="h-5 w-5 text-muted-foreground" />;
            case 'Chủ đề': return <Icons.topic className="h-5 w-5 text-muted-foreground" />;
            case 'Mục tiêu': return <Icons.goal className="h-5 w-5 text-muted-foreground" />;
            case 'Nhiệm vụ': return <Icons.task className="h-5 w-5 text-muted-foreground" />;
            case 'Wiki': return <Icons.topic className="h-5 w-5 text-muted-foreground" />;
            default: return null;
        }
    }

    const groupedResults = results.reduce((acc, item) => {
        (acc[item.itemType] = acc[item.itemType] || []).push(item);
        return acc;
    }, {} as Record<string, SearchResultItem[]>);

    return (
        <SearchContext.Provider value={{ isOpen, setOpen }}>
            {children}
            <Dialog open={isOpen} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-2xl gap-0 p-0">
                    <DialogHeader className="p-4 border-b">
                         <DialogTitle className="sr-only">Tìm kiếm toàn cục</DialogTitle>
                        <div className="relative">
                            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Tìm kiếm sở thích, chủ đề, mục tiêu..."
                                className="pl-9"
                            />
                        </div>
                    </DialogHeader>
                    <div className="p-4">
                        {query.length > 1 ? (
                            results.length > 0 ? (
                                <ScrollArea className="h-[50vh]">
                                    <div className="space-y-4">
                                        {Object.entries(groupedResults).map(([type, items]) => (
                                            <div key={type}>
                                                <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-2">{type}</h3>
                                                <div className="space-y-1">
                                                    {items.map(item => (
                                                        <Button
                                                            key={item.id}
                                                            variant="ghost"
                                                            className="w-full justify-start h-auto py-2"
                                                            onClick={() => handleSelect(item)}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                {getIcon(item.itemType)}
                                                                <div className="text-left">
                                                                    <p className="text-sm font-medium leading-tight">{'title' in item ? item.title : ('text' in item ? item.text : item.name)}</p>
                                                                    {'description' in item && item.description && <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>}
                                                                </div>
                                                            </div>
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-muted-foreground">Không tìm thấy kết quả nào cho "{query}"</p>

                                </div>
                            )
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-muted-foreground">Bắt đầu gõ để tìm kiếm trên toàn bộ ứng dụng.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </SearchContext.Provider>
    );
}
