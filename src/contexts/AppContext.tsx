
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { type Interest, type Topic, type Goal, type Task, type WikiPage, type SalesPage } from '@/lib/data';
import { toast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, writeBatch, query, where, addDoc, setDoc, runTransaction, deleteDoc } from 'firebase/firestore';
import { 
  addDocumentNonBlocking, 
  deleteDocumentNonBlocking, 
  updateDocumentNonBlocking,
  setDocumentNonBlocking
} from '@/firebase/non-blocking-updates';
import { signOut } from 'firebase/auth';
import { ToastAction } from '@/components/ui/toast';

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
  topicBreadcrumbs: Topic[];
  viewMode: ViewMode;
  isDataLoading: boolean;
  setViewMode: (mode: ViewMode) => void;
  selectInterest: (id: string | null) => void;
  selectTopic: (id: string | null) => void;
  addInterest: (name: string) => void;
  updateInterest: (id: string, name: string) => void;
  addTopic: (name: string, imageId: string, description?: string, interestId?: string, parentId?: string | null) => void;
  updateTopic: (topicId: string, name: string, description?: string) => void;
  addGoal: (goalData: Partial<Omit<Goal, 'id'>>) => void;
  updateGoal: (goalId: string, updatedData: Partial<Omit<Goal, 'id'>>) => void;
  addTask: (taskData: Partial<Omit<Task, 'id'>>) => void;
  updateTask: (taskId: string, updatedData: Partial<Task>, instanceDate?: Date) => void;
  deleteInterest: (id: string) => void;
  deleteTopic: (id: string) => void;
  deleteGoal: (id: string) => void;
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

  const [optimisticallyDeleted, setOptimisticallyDeleted] = useState<string[]>([]);
  const isDataLoading = useMemo(() => {
    return isUserLoading || interestsLoading || topicsLoading || goalsLoading || tasksLoading || wikiPagesLoading || salesPagesLoading;
  }, [isUserLoading, interestsLoading, topicsLoading, goalsLoading, tasksLoading, wikiPagesLoading, salesPagesLoading]);

  const filteredInterests = useMemo(() => interests.filter(i => !optimisticallyDeleted.includes(i.id)), [interests, optimisticallyDeleted]);
  const filteredTopics = useMemo(() => topics.filter(t => !optimisticallyDeleted.includes(t.id)), [topics, optimisticallyDeleted]);
  const filteredGoals = useMemo(() => goals.filter(g => !optimisticallyDeleted.includes(g.id)), [goals, optimisticallyDeleted]);
  const filteredTasks = useMemo(() => tasks.filter(t => !optimisticallyDeleted.includes(t.id)), [tasks, optimisticallyDeleted]);
  const filteredWikiPages = useMemo(() => wikiPages.filter(wp => !optimisticallyDeleted.includes(wp.id)), [wikiPages, optimisticallyDeleted]);


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

  const addTopic = (name: string, imageId: string, description?: string, interestId?: string, parentId?: string | null) => {
    const finalInterestId = interestId || selectedInterestId;
    if (!finalInterestId || !user) return;
    const newTopic: Partial<Topic> = { 
        name, 
        imageId, 
        interestId: finalInterestId, 
        userId: user.uid, 
        createdAt: serverTimestamp(),
        parentId: parentId || null,
    };
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

  const updateTask = (taskId: string, updatedData: Partial<Task>, instanceDate?: Date) => {
    const isRecurringInstance = taskId.includes('-recur-');
    if (isRecurringInstance) {
        const originalTaskId = taskId.split('-recur-')[0];
        const originalTask = getTaskById(originalTaskId);
        if (!originalTask || !user) return;

        // Get the specific instance from the calendar view to get its current (potentially modified) start date
        const instanceTaskOnCalendar = getTaskById(taskId);
        
        const { id, createdAt, ...originalTaskData } = originalTask;
        
        // This is the crucial part:
        // We prioritize the data from the dialog (`updatedData`),
        // then fill in any missing pieces from the original recurring task,
        // and finally ensure it's a non-recurring exception.
        const fullDataForInstance = {
            ...originalTaskData,  // Base data from the recurring task
            ...updatedData,       // Overwrite with changes from the dialog
            recurrence: null,     // This is now a standalone exception
            userId: user.uid,
        };
        
        setDocumentNonBlocking(doc(firestore, 'tasks', taskId), fullDataForInstance, { merge: true });
    } else {
        // It's a regular, non-recurring task, so just update it.
        updateDocumentNonBlocking(doc(firestore, 'tasks', taskId), updatedData);
    }
  };

  const createUndoableDelete = (
    itemType: string,
    itemId: string,
    itemName: string | undefined,
    deleteFn: () => Promise<any>
  ) => {
    if (!user) return;

    // Optimistically remove from UI
    setOptimisticallyDeleted(prev => [...prev, itemId]);

    // Create a timer for the actual deletion
    const deleteTimeout = setTimeout(() => {
        deleteFn().catch(error => {
            console.error(`Error permanently deleting ${itemType}:`, error);
            // If permanent deletion fails, add it back to the UI
            setOptimisticallyDeleted(prev => prev.filter(id => id !== itemId));
            toast({ variant: 'destructive', title: `Lỗi xóa ${itemType}`, description: `Không thể xóa vĩnh viễn "${itemName}".`});
        });
    }, 5000); // 5-second delay

    const handleUndo = () => {
        clearTimeout(deleteTimeout);
        setOptimisticallyDeleted(prev => prev.filter(id => id !== itemId));
    };

    toast({
        title: `Đã xóa ${itemType}`,
        description: `"${itemName}" đã bị xóa.`,
        action: <ToastAction altText="Hoàn tác" onClick={handleUndo}>Hoàn tác</ToastAction>,
    });
  };

  const deleteInterest = async (id: string) => {
    const interest = getInterestById(id);
    createUndoableDelete('sở thích', id, interest?.name, async () => {
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
        
        await batch.commit();
         if (selectedInterestId === id) {
            selectInterest(null);
        }
    });
  };

  const deleteTopic = async (id: string) => {
    const topic = getTopicById(id);
    createUndoableDelete('chủ đề', id, topic?.name, async () => {
        const batch = writeBatch(firestore);
        const descendants = new Set<string>();
        const findDescendants = (parentId: string) => {
            const children = topics.filter(t => t.parentId === parentId);
            children.forEach(child => {
                descendants.add(child.id);
                findDescendants(child.id);
            });
        };
        findDescendants(id);
        const allTopicsToDelete = [id, ...Array.from(descendants)];
        
        const goalsToDelete = goals.filter(g => allTopicsToDelete.includes(g.topicId));
        const tasksToDelete = tasks.filter(t => goalsToDelete.some(g => g.id === t.goalId) || allTopicsToDelete.includes(t.topicId!));
        const wikiPagesToDelete = wikiPages.filter(p => allTopicsToDelete.includes(p.topicId));
        
        wikiPagesToDelete.forEach(p => batch.delete(doc(firestore, 'wikiPages', p.id)));
        tasksToDelete.forEach(t => batch.delete(doc(firestore, 'tasks', t.id)));
        goalsToDelete.forEach(g => batch.delete(doc(firestore, 'goals', g.id)));
        allTopicsToDelete.forEach(topicId => batch.delete(doc(firestore, 'topics', topicId)));

        await batch.commit();
        if (selectedTopicId === id) {
            selectTopic(null);
        }
    });
  };

  const deleteGoal = async (id: string) => {
    const goal = getGoalById(id);
    createUndoableDelete('mục tiêu', id, goal?.title, async () => {
        const batch = writeBatch(firestore);
        const tasksToDelete = tasks.filter(t => t.goalId === id);
        tasksToDelete.forEach(t => batch.delete(doc(firestore, 'tasks', t.id)));
        batch.delete(doc(firestore, 'goals', id));
        await batch.commit();
    });
  };

  const deleteTask = (id: string) => {
    const task = getTaskById(id);
    createUndoableDelete('nhiệm vụ', id, task?.text, async () => {
        await deleteDoc(doc(firestore, 'tasks', id));
    });
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
    // Find the specific instance of the task to get its data (including modified dates)
    const taskToDuplicate = getTaskById(taskId);
    if (!taskToDuplicate) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Không tìm thấy nhiệm vụ để nhân bản.' });
        return;
    }

    // Destructure to remove fields that should be new
    const { id, createdAt, recurrence, ...taskData } = taskToDuplicate;

    const newTaskData = {
        ...taskData, // This includes potentially modified startDate, endDate, notes, etc.
        text: `Bản sao của ${taskToDuplicate.text}`,
        status: 'chưa bắt đầu' as const,
        createdAt: serverTimestamp(),
        recurrence: null, // The new task is always a single, non-recurring instance
    };

    addTask(newTaskData);
    toast({ title: "Đã nhân bản nhiệm vụ", description: `Một bản sao của "${taskToDuplicate.text}" đã được tạo.` });
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
    const page = getWikiPageById(pageId);
    createUndoableDelete('trang wiki', pageId, page?.title, async () => {
        await deleteDoc(doc(firestore, 'wikiPages', pageId));
    });
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
    const page = getSalesPageById(pageId);
    createUndoableDelete('trang bán hàng', pageId, page?.title, async () => {
        await deleteDoc(doc(firestore, 'salesPages', pageId));
    });
  };

  const selectedInterest = useMemo(() => filteredInterests.find((i) => i.id === selectedInterestId) ?? null, [filteredInterests, selectedInterestId]);
  const selectedTopic = useMemo(() => filteredTopics.find((t) => t.id === selectedTopicId) ?? null, [filteredTopics, selectedTopicId]);

  const getInterestById = (id: string) => interests.find(i => i.id === id);
  const getGoalById = (id: string) => goals.find(g => g.id === id);
  const getTaskById = (id: string) => tasks.find(t => t.id === id);
  const getTasksByGoalId = (goalId: string) => filteredTasks.filter(t => t.goalId === goalId);
  const getTopicById = (id: string) => topics.find(t => t.id === id);
  const getWikiPageById = (id: string) => wikiPages.find(p => p.id === id);
  const getSalesPageById = (id: string) => salesPages.find(p => p.id === id);
  
  const getTopicBreadcrumbs = useCallback((topicId: string | null): Topic[] => {
    if (!topicId) return [];
    const breadcrumbs: Topic[] = [];
    let currentTopic = filteredTopics.find(t => t.id === topicId);
    while (currentTopic) {
        breadcrumbs.unshift(currentTopic);
        currentTopic = filteredTopics.find(t => t.id === currentTopic!.parentId);
    }
    return breadcrumbs;
  }, [filteredTopics]);

  const topicBreadcrumbs = useMemo(() => getTopicBreadcrumbs(selectedTopicId), [selectedTopicId, getTopicBreadcrumbs]);

  const logout = () => {
    if(auth) {
      signOut(auth);
    }
  }

  const value = {
    interests: filteredInterests,
    topics: filteredTopics,
    goals: filteredGoals,
    tasks: filteredTasks,
    wikiPages: filteredWikiPages,
    salesPages,
    isDataLoading,
    selectedInterestId,
    selectedTopicId,
    topicBreadcrumbs,
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
