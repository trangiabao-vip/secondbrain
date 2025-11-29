
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { type Interest, type Topic, type Goal, type Task, type WikiPage, type SalesPage } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, writeBatch, query, where, addDoc } from 'firebase/firestore';
import { 
  addDocumentNonBlocking, 
  deleteDocumentNonBlocking, 
  updateDocumentNonBlocking 
} from '@/firebase/non-blocking-updates';
import { signOut } from 'firebase/auth';

type ViewMode = 'interests' | 'global-schedule' | 'games' | 'dashboard' | 'sales-pages';

interface AppContextType {
  interests: Interest[];
  topics: Topic[];
  goals: Goal[];
  tasks: Task[];
  wikiPages: WikiPage[];
  salesPages: SalesPage[];
  selectedInterestId: string | null;
  selectedTopicId: string | null;
  viewMode: ViewMode;
  isDataLoading: boolean;
  setViewMode: (mode: ViewMode) => void;
  selectInterest: (id: string | null) => void;
  selectTopic: (id: string | null) => void;
  addInterest: (name: string) => void;
  updateInterest: (id: string, name: string) => void;
  addTopic: (name: string, imageId: string, description?: string, interestId?: string) => void;
  updateTopic: (topicId: string, name: string, description?: string) => void;
  addGoal: (goalData: Partial<Omit<Goal, 'id'>>) => void;
  updateGoal: (goalId: string, updatedData: Partial<Omit<Goal, 'id'>>) => void;
  addTask: (taskData: Partial<Omit<Task, 'id'>>) => void;
  updateTask: (taskId: string, updatedData: Partial<Task>) => void;
  deleteInterest: (id: string) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  deleteTask: (id: string) => void;
  duplicateGoal: (goalId: string) => Promise<void>;
  duplicateTask: (taskId: string) => void;
  addWikiPage: (pageData: Partial<Omit<WikiPage, 'id'>>) => void;
  updateWikiPage: (pageId: string, updatedData: Partial<Omit<WikiPage, 'id'>>) => void;
  deleteWikiPage: (pageId: string) => void;
  addSalesPage: (pageData: Partial<Omit<SalesPage, 'id'>>) => Promise<string | undefined>;
  updateSalesPage: (pageId: string, updatedData: Partial<Omit<SalesPage, 'id'>>) => void;
  deleteSalesPage: (pageId: string) => void;
  selectedInterest: Interest | null;
  selectedTopic: Topic | null;
  getInterestById: (id: string) => Interest | undefined;
  getGoalById: (id: string) => Goal | undefined;
  getTaskById: (id: string) => Task | undefined;
  getTasksByGoalId: (goalId: string) => Task[];
  getTopicById: (id: string) => Topic | undefined;
  getWikiPageById: (id: string) => WikiPage | undefined;
  getSalesPageById: (id: string) => SalesPage | undefined;
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
  const wikiPagesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'wikiPages'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const salesPagesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'salesPages'), where('userId', '==', user.uid)) : null, [firestore, user]);

  const { data: interestsData, isLoading: interestsLoading } = useCollection<Interest>(interestsQuery);
  const { data: topicsData, isLoading: topicsLoading } = useCollection<Topic>(topicsQuery);
  const { data: goalsData, isLoading: goalsLoading } = useCollection<Goal>(goalsQuery);
  const { data: tasksData, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
  const { data: wikiPagesData, isLoading: wikiPagesLoading } = useCollection<WikiPage>(wikiPagesQuery);
  const { data: salesPagesData, isLoading: salesPagesLoading } = useCollection<SalesPage>(salesPagesQuery);
  
  const interests = interestsData || [];
  const topics = topicsData || [];
  const goals = goalsData || [];
  const tasks = tasksData || [];
  const wikiPages = wikiPagesData || [];
  const salesPages = salesPagesData || [];

  const isDataLoading = useMemo(() => {
    return isUserLoading || interestsLoading || topicsLoading || goalsLoading || tasksLoading || wikiPagesLoading || salesPagesLoading;
  }, [isUserLoading, interestsLoading, topicsLoading, goalsLoading, tasksLoading, wikiPagesLoading, salesPagesLoading]);


  const selectInterest = (id: string | null) => {
    setViewMode('interests');
    setSelectedInterestId(id);
    setSelectedTopicId(null);
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

  const addTopic = (name: string, imageId: string, description?: string, interestId?: string) => {
    const finalInterestId = interestId || selectedInterestId;
    if (!finalInterestId || !user) return;
    const newTopic: Partial<Topic> = { name, imageId, interestId: finalInterestId, userId: user.uid, createdAt: serverTimestamp() };
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
  
  const addGoal = (goalData: Partial<Omit<Goal, 'id'>>) => {
    if (!selectedTopicId || !user) return;
    const newGoal: Omit<Goal, 'id'> = {
      title: goalData.title || 'Mục tiêu không tên',
      topicId: selectedTopicId,
      status: 'chưa bắt đầu',
      userId: user.uid,
      createdAt: serverTimestamp(),
      startDate: goalData.startDate || null,
      endDate: goalData.endDate || null,
      ...goalData
    };
    addDocumentNonBlocking(collection(firestore, 'goals'), newGoal);
    toast({ title: "Đã thêm mục tiêu", description: `"${newGoal.title}" đã được thêm.` });
  };

  const updateGoal = (goalId: string, updatedData: Partial<Omit<Goal, 'id'>>) => {
    updateDocumentNonBlocking(doc(firestore, 'goals', goalId), updatedData);
    toast({ title: "Mục tiêu đã được cập nhật", description: `Mục tiêu đã được cập nhật.` });
  };

  const addTask = (taskData: Partial<Omit<Task, 'id'>>) => {
    if (!user) return;
    
    const newTask: Partial<Task> = {
      ...taskData,
      status: taskData.status || 'chưa bắt đầu',
      userId: user.uid,
      createdAt: serverTimestamp()
    };
    
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
    const wikiPagesToDelete = wikiPages.filter(p => topicsToDelete.some(t => t.id === p.topicId));
    
    wikiPagesToDelete.forEach(p => batch.delete(doc(firestore, 'wikiPages', p.id)));
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
    const wikiPagesToDelete = wikiPages.filter(p => p.topicId === id);
    
    wikiPagesToDelete.forEach(p => batch.delete(doc(firestore, 'wikiPages', p.id)));
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

  const duplicateGoal = async (goalId: string) => {
    if (!user) return;
    const originalGoal = getGoalById(goalId);
    if (!originalGoal) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không tìm thấy mục tiêu gốc.' });
      return;
    }

    const { id, createdAt, ...goalData } = originalGoal;
    const newGoalData = {
      ...goalData,
      title: `Bản sao của ${originalGoal.title}`,
      status: 'chưa bắt đầu' as const,
      createdAt: serverTimestamp(),
    };

    try {
      const newGoalRef = await addDoc(collection(firestore, 'goals'), newGoalData);
      
      const originalTasks = getTasksByGoalId(goalId);
      if (originalTasks.length > 0) {
        const batch = writeBatch(firestore);
        originalTasks.forEach(task => {
          const { id, createdAt, goalId: _goalId, ...taskData } = task;
          const newTaskData = {
            ...taskData,
            text: task.text,
            goalId: newGoalRef.id,
            status: 'chưa bắt đầu' as const,
            createdAt: serverTimestamp(),
            userId: user.uid,
          };
          const newTaskRef = doc(collection(firestore, 'tasks'));
          batch.set(newTaskRef, newTaskData);
        });
        await batch.commit();
      }
      
      toast({ title: "Đã nhân bản mục tiêu", description: `"${originalGoal.title}" đã được nhân bản.` });
    } catch (error) {
      console.error("Error duplicating goal: ", error);
      toast({ variant: 'destructive', title: 'Lỗi nhân bản', description: 'Không thể nhân bản mục tiêu.' });
    }
  };

  const duplicateTask = (taskId: string) => {
    if (!user) return;
    const originalTask = getTaskById(taskId);
    if (!originalTask) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không tìm thấy nhiệm vụ gốc.' });
      return;
    }

    const { id, createdAt, ...taskData } = originalTask;
    const newTaskData = {
      ...taskData,
      text: `Bản sao của ${originalTask.text}`,
      status: 'chưa bắt đầu' as const,
      createdAt: serverTimestamp(),
    };

    addTask(newTaskData);
    toast({ title: "Đã nhân bản nhiệm vụ", description: `"${originalTask.text}" đã được nhân bản.` });
  };
  
  const addWikiPage = (pageData: Partial<Omit<WikiPage, 'id'>>) => {
    if (!selectedTopicId || !user) return;
    const newPage: Omit<WikiPage, 'id'> = {
      title: pageData.title || 'Trang không có tiêu đề',
      content: pageData.content || '',
      topicId: selectedTopicId,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    addDocumentNonBlocking(collection(firestore, 'wikiPages'), newPage);
    toast({ title: "Đã thêm trang Wiki", description: `"${newPage.title}" đã được thêm.` });
  };
  
  const updateWikiPage = (pageId: string, updatedData: Partial<Omit<WikiPage, 'id'>>) => {
    const dataWithTimestamp = {
      ...updatedData,
      updatedAt: serverTimestamp(),
    };
    updateDocumentNonBlocking(doc(firestore, 'wikiPages', pageId), dataWithTimestamp);
    toast({ title: "Trang Wiki đã được cập nhật" });
  };

  const deleteWikiPage = (pageId: string) => {
    if (!user) return;
    const pageTitle = wikiPages.find(p => p.id === pageId)?.title;
    deleteDocumentNonBlocking(doc(firestore, 'wikiPages', pageId));
    toast({ title: "Đã xóa trang Wiki", description: `"${pageTitle}" đã bị xóa.` });
  };
  
  const addSalesPage = async (pageData: Partial<Omit<SalesPage, 'id'>>) => {
    if (!user) return;
    const newPage: Omit<SalesPage, 'id'> = {
      title: pageData.title || 'Trang không có tiêu đề',
      slug: pageData.slug || `page-${Date.now()}`,
      content: pageData.content || '',
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
        const docRef = await addDoc(collection(firestore, 'salesPages'), newPage);
        toast({ title: "Đã tạo trang bán hàng", description: `"${newPage.title}" đã được tạo.` });
        return docRef.id;
    } catch(e) {
        console.error("Error adding sales page: ", e);
        toast({ variant: 'destructive', title: "Lỗi", description: 'Không thể tạo trang bán hàng.' });
    }
  };
  
  const updateSalesPage = (pageId: string, updatedData: Partial<Omit<SalesPage, 'id'>>) => {
    const dataWithTimestamp = {
      ...updatedData,
      updatedAt: serverTimestamp(),
    };
    updateDocumentNonBlocking(doc(firestore, 'salesPages', pageId), dataWithTimestamp);
    toast({ title: "Trang bán hàng đã được cập nhật" });
  };

  const deleteSalesPage = (pageId: string) => {
    if (!user) return;
    const pageTitle = salesPages.find(p => p.id === pageId)?.title;
    deleteDocumentNonBlocking(doc(firestore, 'salesPages', pageId));
    toast({ title: "Đã xóa trang bán hàng", description: `"${pageTitle}" đã bị xóa.` });
  };

  const selectedInterest = useMemo(() => interests.find((i) => i.id === selectedInterestId) ?? null, [interests, selectedInterestId]);
  const selectedTopic = useMemo(() => topics.find((t) => t.id === selectedTopicId) ?? null, [topics, selectedTopicId]);

  const getInterestById = (id: string) => interests.find(i => i.id === id);
  const getGoalById = (id: string) => goals.find(g => g.id === id);
  const getTaskById = (id: string) => tasks.find(t => t.id === id);
  const getTasksByGoalId = (goalId: string) => tasks.filter(t => t.goalId === goalId);
  const getTopicById = (id: string) => topics.find(t => t.id === id);
  const getWikiPageById = (id: string) => wikiPages.find(p => p.id === id);
  const getSalesPageById = (id: string) => salesPages.find(p => p.id === id);

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
    wikiPages,
    salesPages,
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
    duplicateGoal,
    duplicateTask,
    addWikiPage,
    updateWikiPage,
    deleteWikiPage,
    addSalesPage,
    updateSalesPage,
    deleteSalesPage,
    selectedInterest,
    selectedTopic,
    getInterestById,
    getGoalById,
    getTaskById,
    getTasksByGoalId,
    getTopicById,
    getWikiPageById,
    getSalesPageById,
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
