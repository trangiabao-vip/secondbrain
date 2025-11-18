'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { type Interest, type Topic, type Goal, type Task, type GoalStatus, type TaskStatus, type GoalPriority } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, writeBatch, query, where } from 'firebase/firestore';
import { 
  addDocumentNonBlocking, 
  deleteDocumentNonBlocking, 
  updateDocumentNonBlocking 
} from '@/firebase/non-blocking-updates';
import { signOut } from 'firebase/auth';

type ViewMode = 'interests' | 'global-schedule';

interface AppContextType {
  interests: Interest[];
  topics: Topic[];
  goals: Goal[];
  tasks: Task[];
  selectedInterestId: string | null;
  selectedTopicId: string | null;
  viewMode: ViewMode;
  isDataLoading: boolean;
  setViewMode: (mode: ViewMode) => void;
  selectInterest: (id: string | null) => void;
  selectTopic: (id: string | null) => void;
  addInterest: (name: string) => void;
  updateInterest: (id: string, name: string) => void;
  addTopic: (name: string, imageId: string, description?: string) => void;
  updateTopic: (topicId: string, name: string, description?: string) => void;
  addGoal: (title: string, description: string | undefined, priority: GoalPriority, startDate?: Date, endDate?: Date) => void;
  updateGoal: (goalId: string, updatedData: Partial<Goal>) => void;
  addTask: (taskData: Partial<Omit<Task, 'id'>>) => void;
  updateTask: (taskId: string, updatedData: Partial<Task>) => void;
  deleteInterest: (id: string) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  deleteTask: (id: string) => void;
  selectedInterest: Interest | null;
  selectedTopic: Topic | null;
  getInterestById: (id: string) => Interest | undefined;
  getGoalById: (id: string) => Goal | undefined;
  getTaskById: (id: string) => Task | undefined;
  getTasksByGoalId: (goalId: string) => Task[];
  getTopicById: (id: string) => Topic | undefined;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { firestore, user, isUserLoading, auth } = useFirebase();

  const [selectedInterestId, setSelectedInterestId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('interests');
  
  const interestsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'interests'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const topicsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'topics'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const goalsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'goals'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const tasksQuery = useMemoFirebase(() => user ? query(collection(firestore, 'tasks'), where('userId', '==', user.uid)) : null, [firestore, user]);

  const { data: interestsData, isLoading: interestsLoading } = useCollection<Interest>(interestsQuery);
  const { data: topicsData, isLoading: topicsLoading } = useCollection<Topic>(topicsQuery);
  const { data: goalsData, isLoading: goalsLoading } = useCollection<Goal>(goalsQuery);
  const { data: tasksData, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
  
  const interests = interestsData || [];
  const topics = topicsData || [];
  const goals = goalsData || [];
  const tasks = tasksData || [];

  const isDataLoading = useMemo(() => {
    return isUserLoading || interestsLoading || topicsLoading || goalsLoading || tasksLoading;
  }, [isUserLoading, interestsLoading, topicsLoading, goalsLoading, tasksLoading]);


  const selectInterest = (id: string | null) => {
    setSelectedInterestId(id);
    setSelectedTopicId(null);
    if (id !== null) {
      setViewMode('interests');
    }
  };

  const selectTopic = (id: string | null) => {
    setSelectedTopicId(id);
  };

  const addInterest = (name: string) => {
    if (!user) return;
    const newInterest = { name, userId: user.uid, createdAt: serverTimestamp() };
    addDocumentNonBlocking(collection(firestore, 'interests'), newInterest);
    toast({ title: "Đã thêm sở thích", description: `"${name}" đã được thêm.` });
  };
  
  const updateInterest = (id: string, name: string) => {
    updateDocumentNonBlocking(doc(firestore, 'interests', id), { name });
    toast({ title: "Sở thích đã được cập nhật", description: `Sở thích đã được đổi tên thành "${name}".` });
  }

  const addTopic = (name: string, imageId: string, description?: string) => {
    if (!selectedInterestId || !user) return;
    const newTopic: Partial<Topic> = { name, imageId, interestId: selectedInterestId, userId: user.uid, createdAt: serverTimestamp() };
    if (description) newTopic.description = description;
    addDocumentNonBlocking(collection(firestore, 'topics'), newTopic);
    toast({ title: "Đã thêm chủ đề", description: `"${name}" đã được thêm.` });
  };

  const updateTopic = (topicId: string, name: string, description?: string) => {
    const data: Partial<Topic> = { name };
    if (description !== undefined) {
      data.description = description;
    }
    updateDocumentNonBlocking(doc(firestore, 'topics', topicId), data);
    toast({ title: "Chủ đề đã được cập nhật", description: `"${name}" đã được cập nhật.` });
  };
  
  const addGoal = (title: string, description: string | undefined, priority: GoalPriority, startDate?: Date, endDate?: Date) => {
    if (!selectedTopicId || !user) return;
    const newGoal: Omit<Goal, 'id'> = { 
      title, 
      description,
      priority,
      topicId: selectedTopicId, 
      status: 'chưa bắt đầu', 
      startDate: startDate || null, 
      endDate: endDate || null, 
      userId: user.uid, 
      createdAt: serverTimestamp() 
    };
    addDocumentNonBlocking(collection(firestore, 'goals'), newGoal);
    toast({ title: "Đã thêm mục tiêu", description: `"${title}" đã được thêm.` });
  };

  const updateGoal = (goalId: string, updatedData: Partial<Goal>) => {
    updateDocumentNonBlocking(doc(firestore, 'goals', goalId), updatedData);
    toast({ title: "Mục tiêu đã được cập nhật", description: `"${updatedData.title || 'Mục tiêu'}" đã được cập nhật.` });
  };

  const addTask = (taskData: Partial<Omit<Task, 'id'>>) => {
    if (!user) return;
    if (!taskData.goalId && !selectedTopicId) return;

    const newTask: Partial<Task> = {
      ...taskData,
      status: taskData.status || 'chưa bắt đầu',
      userId: user.uid,
      createdAt: serverTimestamp()
    };
    
    if (!newTask.goalId) {
      newTask.topicId = selectedTopicId;
    }

    addDocumentNonBlocking(collection(firestore, 'tasks'), newTask);
  };

  const updateTask = (taskId: string, updatedData: Partial<Task>) => {
    updateDocumentNonBlocking(doc(firestore, 'tasks', taskId), updatedData);
  };

  const deleteInterest = async (id: string) => {
    if (!user) return;
    const interestName = interests.find(i => i.id === id)?.name;
    const batch = writeBatch(firestore);

    const topicsToDelete = topics.filter(t => t.interestId === id);
    const goalsToDelete = goals.filter(g => topicsToDelete.some(t => t.id === g.topicId));
    const tasksToDelete = tasks.filter(t => goalsToDelete.some(g => g.id === t.goalId) || topicsToDelete.some(topic => topic.id === t.topicId));
    
    tasksToDelete.forEach(t => batch.delete(doc(firestore, 'tasks', t.id)));
    goalsToDelete.forEach(g => batch.delete(doc(firestore, 'goals', g.id)));
    topicsToDelete.forEach(t => batch.delete(doc(firestore, 'topics', t.id)));
    batch.delete(doc(firestore, 'interests', id));
    
    try {
      await batch.commit();
      if (selectedInterestId === id) {
        selectInterest(null);
      }
      toast({ title: `Sở thích đã bị xóa`, description: `"${interestName}" và tất cả nội dung của nó đã bị xóa.`});
    } catch (error) {
      console.error("Error deleting interest and its subcollections: ", error);
      toast({ variant: 'destructive', title: 'Lỗi xóa sở thích', description: 'Không thể xóa sở thích và dữ liệu liên quan.'});
    }
  }

  const deleteTopic = async (id: string) => {
    if (!user) return;
    const topicName = topics.find(t => t.id === id)?.name;
    const batch = writeBatch(firestore);
    
    const goalsToDelete = goals.filter(g => g.topicId === id);
    const tasksToDelete = tasks.filter(t => goalsToDelete.some(g => g.id === t.goalId) || t.topicId === id);
    
    tasksToDelete.forEach(t => batch.delete(doc(firestore, 'tasks', t.id)));
    goalsToDelete.forEach(g => batch.delete(doc(firestore, 'goals', g.id)));
    batch.delete(doc(firestore, 'topics', id));
    
    try {
      await batch.commit();
      if (selectedTopicId === id) {
        selectTopic(null);
      }
      toast({ title: `Chủ đề đã bị xóa`, description: `"${topicName}" và tất cả nội dung của nó đã bị xóa.`});
    } catch (error) {
      console.error("Error deleting topic and its subcollections: ", error);
      toast({ variant: 'destructive', title: 'Lỗi xóa chủ đề', description: 'Không thể xóa chủ đề và dữ liệu liên quan.'});
    }
  }

  const deleteGoal = async (id: string) => {
    if (!user) return;
    const goalName = goals.find(g => g.id === id)?.title;
    const batch = writeBatch(firestore);

    const tasksToDelete = tasks.filter(t => t.goalId === id);
    tasksToDelete.forEach(t => batch.delete(doc(firestore, 'tasks', t.id)));
    batch.delete(doc(firestore, 'goals', id));

    try {
      await batch.commit();
      toast({ title: `Mục tiêu đã bị xóa`, description: `"${goalName}" và tất cả các nhiệm vụ của nó đã bị xóa.`});
    } catch (error) {
      console.error("Error deleting goal and its tasks: ", error);
      toast({ variant: 'destructive', title: 'Lỗi xóa mục tiêu', description: 'Không thể xóa mục tiêu và các nhiệm vụ của nó.'});
    }
  }

  const deleteTask = (id: string) => {
    if (!user) return;
    const taskText = tasks.find(t => t.id === id)?.text;
    deleteDocumentNonBlocking(doc(firestore, 'tasks', id));
    toast({ title: "Đã xóa nhiệm vụ", description: `"${taskText}" đã bị xóa.`});
  };

  const selectedInterest = useMemo(() => interests.find((i) => i.id === selectedInterestId) ?? null, [interests, selectedInterestId]);
  const selectedTopic = useMemo(() => topics.find((t) => t.id === selectedTopicId) ?? null, [topics, selectedTopicId]);

  const getInterestById = (id: string) => interests.find(i => i.id === id);
  const getGoalById = (id: string) => goals.find(g => g.id === id);
  const getTaskById = (id: string) => tasks.find(t => t.id === id);
  const getTasksByGoalId = (goalId: string) => tasks.filter(t => t.goalId === goalId);
  const getTopicById = (id: string) => topics.find(t => t.id === id);

  const logout = () => {
    if(auth) {
      signOut(auth);
    }
  }

  const value = {
    interests,
    topics,
    goals,
    tasks,
    isDataLoading,
    selectedInterestId,
    selectedTopicId,
    viewMode,
    setViewMode,
    selectInterest,
    selectTopic,
    addInterest,
    updateInterest,
    addTopic,
    updateTopic,
    addGoal,
    updateGoal,
    addTask,
    updateTask,
    deleteInterest,
    deleteTopic,
    deleteGoal,
    deleteTask,
    selectedInterest,
    selectedTopic,
    getInterestById,
    getGoalById,
    getTaskById,
    getTasksByGoalId,
    getTopicById,
    logout,
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
