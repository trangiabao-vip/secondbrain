'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo } from 'react';
import { initialData, type DataType, type Interest, type Topic, type Goal, type Task } from '@/lib/data';
import { generateId } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AppContextType extends DataType {
  selectedInterestId: string | null;
  selectedTopicId: string | null;
  selectInterest: (id: string | null) => void;
  selectTopic: (id: string | null) => void;
  addInterest: (name: string) => void;
  addTopic: (name: string, imageId: string) => void;
  addGoal: (title: string, dueDate?: Date) => void;
  addTask: (text: string, goalId: string, scheduledDate?: Date) => void;
  updateTask: (taskId: string, completed: boolean) => void;
  deleteInterest: (id: string) => void;
  deleteTopic: (id: string) => void;
  deleteGoal: (id: string) => void;
  deleteTask: (id: string) => void;
  selectedInterest: Interest | null;
  selectedTopic: Topic | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataType>(initialData);
  const [selectedInterestId, setSelectedInterestId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const { toast } = useToast();

  const selectInterest = (id: string | null) => {
    setSelectedInterestId(id);
    setSelectedTopicId(null);
  };

  const selectTopic = (id: string | null) => {
    setSelectedTopicId(id);
  };

  const addInterest = (name: string) => {
    const newInterest: Interest = { id: generateId(), name };
    setData((prev) => ({ ...prev, interests: [...prev.interests, newInterest] }));
    toast({ title: "Đã thêm sở thích", description: `"${name}" đã được thêm.` });
  };
  
  const addTopic = (name: string, imageId: string) => {
    if (!selectedInterestId) return;
    const newTopic: Topic = { id: generateId(), name, interestId: selectedInterestId, imageId };
    setData((prev) => ({ ...prev, topics: [...prev.topics, newTopic] }));
    toast({ title: "Đã thêm chủ đề", description: `"${name}" đã được thêm.` });
  };
  
  const addGoal = (title: string, dueDate?: Date) => {
    if (!selectedTopicId) return;
    const newGoal: Goal = { id: generateId(), title, topicId: selectedTopicId, dueDate: dueDate?.toISOString() };
    setData((prev) => ({ ...prev, goals: [...prev.goals, newGoal] }));
    toast({ title: "Đã thêm mục tiêu", description: `"${title}" đã được thêm.` });
  };

  const addTask = (text: string, goalId: string, scheduledDate?: Date) => {
    const newTask: Task = { id: generateId(), text, goalId, completed: false, scheduledDate: scheduledDate?.toISOString() };
    setData((prev) => ({ ...prev, tasks: [...prev.tasks, newTask] }));
  };

  const updateTask = (taskId: string, completed: boolean) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => (task.id === taskId ? { ...task, completed } : task)),
    }));
  };
  
  const deleteItem = (itemType: keyof DataType, id: string) => {
    setData(prev => {
        const items = prev[itemType] as any[];
        const itemToDelete = items.find(item => item.id === id);
        const newData = { ...prev, [itemType]: items.filter(item => item.id !== id) };
        
        if (itemToDelete) {
          toast({ title: `${itemType.slice(0, -1)} đã xóa`, description: `"${itemToDelete.name || itemToDelete.title || itemToDelete.text}" đã bị xóa.`});
        }
        
        return newData;
    });
  };

  const deleteInterest = (id: string) => {
    setData(prev => {
      const topicsToDelete = prev.topics.filter(t => t.interestId === id);
      const goalsToDelete = prev.goals.filter(g => topicsToDelete.some(t => t.id === g.topicId));
      const tasksToDelete = prev.tasks.filter(t => goalsToDelete.some(g => g.id === t.goalId));
      
      const interestName = prev.interests.find(i => i.id === id)?.name;

      if(selectedInterestId === id) {
        selectInterest(null);
      }

      toast({ title: `Sở thích đã bị xóa`, description: `"${interestName}" và tất cả nội dung của nó đã bị xóa.`});

      return {
        interests: prev.interests.filter(i => i.id !== id),
        topics: prev.topics.filter(t => t.interestId !== id),
        goals: prev.goals.filter(g => !goalsToDelete.map(goal => goal.id).includes(g.id)),
        tasks: prev.tasks.filter(t => !tasksToDelete.map(task => task.id).includes(t.id)),
      }
    });
  }

  const deleteTopic = (id: string) => {
    setData(prev => {
      const goalsToDelete = prev.goals.filter(g => g.topicId === id);
      const tasksToDelete = prev.tasks.filter(t => goalsToDelete.some(g => g.id === t.goalId));

      const topicName = prev.topics.find(t => t.id === id)?.name;
      
      if(selectedTopicId === id) {
        selectTopic(null);
      }

      toast({ title: `Chủ đề đã bị xóa`, description: `"${topicName}" và tất cả nội dung của nó đã bị xóa.`});

      return {
        ...prev,
        topics: prev.topics.filter(t => t.id !== id),
        goals: prev.goals.filter(g => g.topicId !== id),
        tasks: prev.tasks.filter(t => !tasksToDelete.map(task => task.id).includes(t.id)),
      }
    });
  }

  const deleteGoal = (id: string) => {
    setData(prev => {
      const goalName = prev.goals.find(g => g.id === id)?.title;
      toast({ title: `Mục tiêu đã bị xóa`, description: `"${goalName}" và tất cả các nhiệm vụ của nó đã bị xóa.`});
      return {
        ...prev,
        goals: prev.goals.filter(g => g.id !== id),
        tasks: prev.tasks.filter(t => t.goalId !== id),
      }
    });
  }

  const deleteTask = (id: string) => deleteItem('tasks', id);

  const selectedInterest = useMemo(() => data.interests.find((i) => i.id === selectedInterestId) ?? null, [data.interests, selectedInterestId]);
  const selectedTopic = useMemo(() => data.topics.find((t) => t.id === selectedTopicId) ?? null, [data.topics, selectedTopicId]);


  const value = {
    ...data,
    selectedInterestId,
    selectedTopicId,
    selectInterest,
    selectTopic,
    addInterest,
    addTopic,
    addGoal,
    addTask,
    updateTask,
    deleteInterest,
    deleteTopic,
    deleteGoal,
    deleteTask,
    selectedInterest,
    selectedTopic,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
