'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { type Interest, type Topic, type Goal, type Task, type WikiPage, type SalesPage, type Channel } from '@/lib/data';
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
import { addMinutes, differenceInMinutes, parseISO } from 'date-fns';
import { usePathname, useRouter, useParams } from 'next/navigation';

interface AppContextType {
  interests: Interest[];
  topics: Topic[];
  goals: Goal[];
  tasks: Task[];
  wikiPages: WikiPage[];
  salesPages: SalesPage[];
  channels: Channel[];
  selectedInterestId: string | null;
  selectedTopicId: string | null;
  topicBreadcrumbs: Topic[];
  isDataLoading: boolean;
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
  addChannel: (channelData: Partial<Omit<Channel, 'id'>>) => Promise<string | undefined>;
  updateChannel: (channelId: string, updatedData: Partial<Omit<Channel, 'id'>>) => void;
  deleteChannel: (channelId: string) => void;
  selectedInterest: Interest | null;
  selectedTopic: Topic | null;
  getInterestById: (id: string) => Interest | undefined;
  getGoalById: (id: string) => Goal | undefined;
  getTaskById: (id: string) => Task | undefined;
  getTasksByGoalId: (goalId: string) => Task[];
  getTopicById: (id: string) => Topic | undefined;
  getWikiPageById: (id: string) => WikiPage | undefined;
  getSalesPageById: (id: string) => SalesPage | undefined;
  getChannelById: (id: string) => Channel | undefined;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getDateFromFirestore = (date: any): Date | null => {
    if (!date) return null;
    if (typeof date === 'string') return parseISO(date);
    if (date && typeof date.toDate === 'function') return date.toDate();
    if (date.seconds) return new Date(date.seconds * 1000);
    if (date instanceof Date) return date;
    return null;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const { firestore, user, isUserLoading, auth } = useFirebase();
  const router = useRouter();
  const params = useParams();
  
  const interestId = (params.interestId as string) || null;
  const topicId = (params.topicId as string) || null;

  const interestsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'interests'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const topicsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'topics'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const goalsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'goals'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const tasksQuery = useMemoFirebase(() => user ? query(collection(firestore, 'tasks'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const wikiPagesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'wikiPages'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const salesPagesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'salesPages'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const channelsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'channels'), where('userId', '==', user.uid)) : null, [firestore, user]);

  const { data: interestsData, isLoading: interestsLoading } = useCollection<Interest>(interestsQuery);
  const { data: topicsData, isLoading: topicsLoading } = useCollection<Topic>(topicsQuery);
  const { data: goalsData, isLoading: goalsLoading } = useCollection<Goal>(goalsQuery);
  const { data: tasksData, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
  const { data: wikiPagesData, isLoading: wikiPagesLoading } = useCollection<WikiPage>(wikiPagesQuery);
  const { data: salesPagesData, isLoading: salesPagesLoading } = useCollection<SalesPage>(salesPagesQuery);
  const { data: channelsData, isLoading: channelsLoading } = useCollection<Channel>(channelsQuery);
  
  const interests = interestsData || [];
  const topics = topicsData || [];
  const goals = goalsData || [];
  const tasks = tasksData || [];
  const wikiPages = wikiPagesData || [];
  const salesPages = salesPagesData || [];
  const channels = channelsData || [];

  const [optimisticallyDeleted, setOptimisticallyDeleted] = useState<string[]>([]);
  const isDataLoading = useMemo(() => {
    return isUserLoading || interestsLoading || topicsLoading || goalsLoading || tasksLoading || wikiPagesLoading || salesPagesLoading || channelsLoading;
  }, [isUserLoading, interestsLoading, topicsLoading, goalsLoading, tasksLoading, wikiPagesLoading, salesPagesLoading, channelsLoading]);


  const filteredInterests = useMemo(() => interests.filter(i => !optimisticallyDeleted.includes(i.id)), [interests, optimisticallyDeleted]);
  const filteredTopics = useMemo(() => topics.filter(t => !optimisticallyDeleted.includes(t.id)), [topics, optimisticallyDeleted]);
  const filteredGoals = useMemo(() => goals.filter(g => !optimisticallyDeleted.includes(g.id)), [goals, optimisticallyDeleted]);
  const filteredTasks = useMemo(() => tasks.filter(t => !optimisticallyDeleted.includes(t.id)), [tasks, optimisticallyDeleted]);
  const filteredWikiPages = useMemo(() => wikiPages.filter(wp => !optimisticallyDeleted.includes(wp.id)), [wikiPages, optimisticallyDeleted]);
  const filteredSalesPages = useMemo(() => salesPages.filter(p => !optimisticallyDeleted.includes(p.id)), [salesPages, optimisticallyDeleted]);
  const filteredChannels = useMemo(() => channels.filter(c => !optimisticallyDeleted.includes(c.id)), [channels, optimisticallyDeleted]);


  const selectInterest = (id: string | null) => {
    if (id === null) {
      router.push('/dashboard');
    } else {
      router.push(`/interests/${id}`);
    }
  };

  const selectTopic = (id: string | null) => {
    if (id === null) {
        const topic = topics.find(t => t.id === topicId);
        if(topic) {
            router.push(`/interests/${topic.interestId}`);
        } else if(interestId) {
            router.push(`/interests/${interestId}`);
        } else {
            router.push('/dashboard');
        }
    } else {
        const topic = topics.find(t => t.id === id);
        if (topic) {
            router.push(`/interests/${topic.interestId}/${id}`);
        }
    }
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

  const addTopic = (name: string, imageId: string, description?: string, interestIdToAdd?: string, parentId?: string | null) => {
    const finalInterestId = interestIdToAdd || interestId;
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
    if (!topicId || !user) return;
    const newGoal: Omit<Goal, 'id'> = {
      title: goalData.title || 'Mục tiêu không tên',
      topicId: topicId,
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
    const isRecurringInstance = taskId.includes('-recur-');
  
    if (isRecurringInstance) {
      const originalTaskId = taskId.split('-recur-')[0];
      const originalTask = getTaskById(originalTaskId);
      if (!originalTask || !user) return;
  
      const fullDataForInstance = {
        ...originalTask,
        ...updatedData, // This now correctly includes the modified startDate
        recurrence: null, // This instance is now a standalone exception
        userId: user.uid,
      };
      
      // Use setDoc to create a new, separate document for this exception.
      setDocumentNonBlocking(doc(firestore, 'tasks', taskId), fullDataForInstance, {});
    } else {
      // It's a regular task, just update it.
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

    setOptimisticallyDeleted(prev => [...prev, itemId]);

    const deleteTimeout = setTimeout(() => {
        deleteFn().catch(error => {
            console.error(`Error permanently deleting ${itemType}:`, error);
            setOptimisticallyDeleted(prev => prev.filter(id => id !== itemId));
            toast({ variant: 'destructive', title: `Lỗi xóa ${itemType}`, description: `Không thể xóa vĩnh viễn "${itemName}".`});
        });
    }, 5000); 

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
         if (interestId === id) {
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
        if (topicId === id) {
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

  const findTaskInstance = useCallback((id: string): Task | null => {
    const directMatch = tasks.find(t => t.id === id);
    if (directMatch) {
      return directMatch;
    }
  
    const isRecurringInstance = id.includes('-recur-');
    if (!isRecurringInstance) {
      return null;
    }
  
    const [originalTaskId, dateStr] = id.split('-recur-');
    if (!originalTaskId || !dateStr) return null;
  
    const originalTask = tasks.find(t => t.id === originalTaskId);
    if (!originalTask || !originalTask.recurrence) {
      return null;
    }
    
    const instanceDate = parseISO(dateStr);
    const originalStartDate = getDateFromFirestore(originalTask.startDate);
  
    if (!originalStartDate) return null;
  
    const instanceStartDate = new Date(
        instanceDate.getFullYear(),
        instanceDate.getMonth(),
        instanceDate.getDate(),
        originalStartDate.getHours(),
        originalStartDate.getMinutes(),
        originalStartDate.getSeconds()
    );
  
    let instanceEndDate: Date | null = null;
    const originalEndDate = getDateFromFirestore(originalTask.endDate);
    if (originalEndDate && originalStartDate) {
      const duration = differenceInMinutes(originalEndDate, originalStartDate);
      instanceEndDate = addMinutes(instanceStartDate, duration);
    } else {
      instanceEndDate = addMinutes(instanceStartDate, 30);
    }
  
    return {
      ...originalTask,
      id: id,
      startDate: instanceStartDate,
      endDate: instanceEndDate,
      status: 'chưa bắt đầu', 
      recurrence: null, 
    };
  }, [tasks]);

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
  
    const sourceTask = findTaskInstance(taskId);
    if (!sourceTask) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể tìm thấy nhiệm vụ gốc để nhân bản.' });
      return;
    }
  
    const { id, createdAt, recurrence, ...taskDataToCopy } = sourceTask;
    
    const sourceStartDate = getDateFromFirestore(sourceTask.startDate);
    const sourceEndDate = getDateFromFirestore(sourceTask.endDate);
  
    const newTaskData = {
      ...taskDataToCopy,
      text: `Bản sao của ${sourceTask.text}`,
      status: 'chưa bắt đầu' as const,
      createdAt: serverTimestamp(),
      recurrence: null,
      userId: user.uid,
      startDate: sourceStartDate,
      endDate: sourceEndDate,
    };
  
    addTask(newTaskData);
    toast({ title: "Đã nhân bản nhiệm vụ", description: `Một bản sao của "${sourceTask.text}" đã được tạo.` });
  };
  
  const addWikiPage = (pageData: Partial<Omit<WikiPage, 'id'>>) => {
    if (!topicId || !user) return;
    const newPage: Omit<WikiPage, 'id'> = {
      title: pageData.title || 'Trang không có tiêu đề',
      content: pageData.content || '',
      topicId: topicId,
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

  const addChannel = async (channelData: Partial<Omit<Channel, 'id'>>) => {
    if (!user) return;
    const newChannel = {
      ...channelData,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };
    try {
        const docRef = await addDoc(collection(firestore, 'channels'), newChannel);
        toast({ title: "Đã tạo kênh", description: `"${channelData.name}" đã được tạo.` });
        return docRef.id;
    } catch(e) {
        console.error("Error adding channel: ", e);
        toast({ variant: 'destructive', title: "Lỗi", description: 'Không thể tạo kênh.' });
    }
  };

  const updateChannel = (channelId: string, updatedData: Partial<Omit<Channel, 'id'>>) => {
    updateDocumentNonBlocking(doc(firestore, 'channels', channelId), updatedData);
    toast({ title: "Kênh đã được cập nhật" });
  };

  const deleteChannel = (channelId: string) => {
    const channel = getChannelById(channelId);
    createUndoableDelete('kênh', channelId, channel?.name, async () => {
        await deleteDoc(doc(firestore, 'channels', channelId));
    });
  };

  const selectedInterest = useMemo(() => filteredInterests.find((i) => i.id === interestId) ?? null, [filteredInterests, interestId]);
  const selectedTopic = useMemo(() => filteredTopics.find((t) => t.id === topicId) ?? null, [filteredTopics, topicId]);

  const getInterestById = (id: string) => interests.find(i => i.id === id);
  const getGoalById = (id: string) => goals.find(g => g.id === id);
  const getTaskById = (id: string) => tasks.find(t => t.id === id);
  const getTasksByGoalId = (goalId: string) => filteredTasks.filter(t => t.goalId === goalId);
  const getTopicById = (id: string) => topics.find(t => t.id === id);
  const getWikiPageById = (id: string) => wikiPages.find(p => p.id === id);
  const getSalesPageById = (id: string) => salesPages.find(p => p.id === id);
  const getChannelById = (id: string) => channels.find(c => c.id === id);
  
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

  const topicBreadcrumbs = useMemo(() => getTopicBreadcrumbs(topicId), [topicId, getTopicBreadcrumbs]);

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
    salesPages: filteredSalesPages,
    channels: filteredChannels,
    isDataLoading,
    selectedInterestId: interestId,
    selectedTopicId: topicId,
    topicBreadcrumbs,
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
    addChannel,
    updateChannel,
    deleteChannel,
    selectedInterest,
    selectedTopic,
    getInterestById,
    getGoalById,
    getTaskById: findTaskInstance,
    getTasksByGoalId,
    getTopicById,
    getWikiPageById,
    getSalesPageById,
    getChannelById,
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
