'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { type Interest, type Topic, type Goal, type Task, type GoalStatus, type TaskStatus } from '@/lib/data';
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
  addTopic: (name: string, imageId: string) => void;
  updateTopic: (topicId: string, name: string) => void;
  addGoal: (title: string, dueDate?: Date) => void;
  updateGoal: (goalId: string, title: string, dueDate?: Date, status?: GoalStatus) => void;
  addTask: (text: string, goalId: string, scheduledDate?: Date) => void;
  updateTask: (taskId: string, status: TaskStatus, text?: string, scheduledDate?: Date | null) => void;
  deleteInterest: (id: string) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  deleteTask: (id: string) => void;
  selectedInterest: Interest | null;
  selectedTopic: Topic | null;
  getInterestById: (id: string) => Interest | undefined;
  getGoalById: (id: string) => Goal | undefined;
  getTaskById: (id: string) => Task | undefined;
  getTopicById: (id: string) => Topic | undefined;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { firestore, user, isUserLoading } = useFirebase();

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

  const addTopic = (name: string, imageId: string) => {
    if (!selectedInterestId || !user) return;
    const newTopic = { name, imageId, interestId: selectedInterestId, userId: user.uid, createdAt: serverTimestamp() };
    addDocumentNonBlocking(collection(firestore, 'topics'), newTopic);
    toast({ title: "Đã thêm chủ đề", description: `"${name}" đã được thêm.` });
  };

  const updateTopic = (topicId: string, name: string) => {
    updateDocumentNonBlocking(doc(firestore, 'topics', topicId), { name });
    toast({ title: "Chủ đề đã được cập nhật", description: `"${name}" đã được cập nhật.` });
  };
  
  const addGoal = (title: string, dueDate?: Date) => {
    if (!selectedTopicId || !user) return;
    const newGoal = { title, topicId: selectedTopicId, status: 'chưa bắt đầu', dueDate: dueDate || null, userId: user.uid, createdAt: serverTimestamp() };
    addDocumentNonBlocking(collection(firestore, 'goals'), newGoal);
    toast({ title: "Đã thêm mục tiêu", description: `"${title}" đã được thêm.` });
  };

  const updateGoal = (goalId: string, title: string, dueDate?: Date, status?: GoalStatus) => {
    const updatedData: any = { title };
    if (dueDate !== undefined) updatedData.dueDate = dueDate;
    if (status) updatedData.status = status;
    updateDocumentNonBlocking(doc(firestore, 'goals', goalId), updatedData);
    toast({ title: "Mục tiêu đã được cập nhật", description: `"${title}" đã được cập nhật.` });
  };

  const addTask = (text: string, goalId: string, scheduledDate?: Date) => {
    if (!user) return;
    const newTask = { text, goalId, status: 'chưa bắt đầu', scheduledDate: scheduledDate || null, userId: user.uid, createdAt: serverTimestamp() };
    addDocumentNonBlocking(collection(firestore, 'tasks'), newTask);
  };

  const updateTask = (taskId: string, status: TaskStatus, text?: string, scheduledDate?: Date | null) => {
    const updatedData: any = { status };
    if (text !== undefined) updatedData.text = text;
    if (scheduledDate !== undefined) {
       updatedData.scheduledDate = scheduledDate;
    }
    updateDocumentNonBlocking(doc(firestore, 'tasks', taskId), updatedData);
  };

  const deleteInterest = async (id: string) => {
    const interestName = interests.find(i => i.id === id)?.name;
    const batch = writeBatch(firestore);

    const topicsToDelete = topics.filter(t => t.interestId === id);
    const goalsToDelete = goals.filter(g => topicsToDelete.some(t => t.id === g.topicId));
    const tasksToDelete = tasks.filter(t => goalsToDelete.some(g => g.id === t.goalId));
    
    tasksToDelete.forEach(t => batch.delete(doc(firestore, 'tasks', t.id)));
    goalsToDelete.forEach(g => batch.delete(doc(firestore, 'goals', g.id)));
    topicsToDelete.forEach(t => batch.delete(doc(firestore, 'topics', t.id)));
    batch.delete(doc(firestore, 'interests', id));
    
    await batch.commit();

    if (selectedInterestId === id) {
      selectInterest(null);
    }
    toast({ title: `Sở thích đã bị xóa`, description: `"${interestName}" và tất cả nội dung của nó đã bị xóa.`});
  }

  const deleteTopic = async (id: string) => {
    const topicName = topics.find(t => t.id === id)?.name;
    const batch = writeBatch(firestore);
    
    const goalsToDelete = goals.filter(g => g.topicId === id);
    const tasksToDelete = tasks.filter(t => goalsToDelete.some(g => g.id === t.goalId));
    
    tasksToDelete.forEach(t => batch.delete(doc(firestore, 'tasks', t.id)));
    goalsToDelete.forEach(g => batch.delete(doc(firestore, 'goals', g.id)));
    batch.delete(doc(firestore, 'topics', id));
    
    await batch.commit();

    if (selectedTopicId === id) {
      selectTopic(null);
    }
    toast({ title: `Chủ đề đã bị xóa`, description: `"${topicName}" và tất cả nội dung của nó đã bị xóa.`});
  }

  const deleteGoal = async (id: string) => {
    const goalName = goals.find(g => g.id === id)?.title;
    const batch = writeBatch(firestore);

    const tasksToDelete = tasks.filter(t => t.goalId === id);
    tasksToDelete.forEach(t => batch.delete(doc(firestore, 'tasks', t.id)));
    batch.delete(doc(firestore, 'goals', id));

    await batch.commit();
    toast({ title: `Mục tiêu đã bị xóa`, description: `"${goalName}" và tất cả các nhiệm vụ của nó đã bị xóa.`});
  }

  const deleteTask = (id: string) => {
    const taskText = tasks.find(t => t.id === id)?.text;
    deleteDocumentNonBlocking(doc(firestore, 'tasks', id));
    toast({ title: "Đã xóa nhiệm vụ", description: `"${taskText}" đã bị xóa.`});
  };

  const selectedInterest = useMemo(() => interests.find((i) => i.id === selectedInterestId) ?? null, [interests, selectedInterestId]);
  const selectedTopic = useMemo(() => topics.find((t) => t.id === selectedTopicId) ?? null, [topics, selectedTopicId]);

  const getInterestById = (id: string) => interests.find(i => i.id === id);
  const getGoalById = (id: string) => goals.find(g => g.id === id);
  const getTaskById = (id: string) => tasks.find(t => t.id === id);
  const getTopicById = (id: string) => topics.find(t => t.id === id);

  const logout = () => {
    const { auth } = useFirebase();
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
