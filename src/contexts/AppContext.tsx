'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useCallback } from 'react';
import { type Interest, type Topic, type Goal, type Task, type WikiPage, type Note, type SalesPage, type Channel, type Notification } from '@/lib/data';
import { toast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, writeBatch, addDoc, deleteDoc, Timestamp, getDoc, updateDoc } from 'firebase/firestore';
import { 
  addDocumentNonBlocking, 
  deleteDocumentNonBlocking, 
  updateDocumentNonBlocking,
  setDocumentNonBlocking
} from '@/firebase/non-blocking-updates';
import { signOut } from 'firebase/auth';
import { ToastAction } from '@/components/ui/toast';
import { addMinutes, differenceInMinutes, parseISO } from 'date-fns';
import { useDataContext, type DataContextType } from './DataContext';
import { useUIContext, type UIContextType } from './UIContext';
import { type DropResult } from 'react-beautiful-dnd';

// Combine the types from all contexts plus the new derived values and actions
interface AppContextType extends DataContextType, UIContextType {
  topicBreadcrumbs: Topic[];
  selectedInterest: Interest | null;
  selectedTopic: Topic | null;
  addInterest: (name: string) => void;
  updateInterest: (id: string, name: string) => void;
  addTopic: (name: string, imageId: string, description?: string, interestId?: string, parentId?: string | null) => void;
  updateTopic: (topicId: string, name: string, description?: string) => void;
  addGoal: (goalData: Partial<Omit<Goal, 'id'>>) => void;
  updateGoal: (goalId: string, updatedData: Partial<Omit<Goal, 'id'>>) => void;
  addTask: (taskData: Partial<Omit<Task, 'id'>>) => Promise<string | undefined>;
  updateTask: (taskId: string, updatedData: Partial<Task>, instanceDate?: Date) => Promise<void>;
  deleteInterest: (id: string) => void;
  deleteTopic: (id: string) => void;
  deleteGoal: (id: string) => void;
  deleteTask: (id: string) => void;
  duplicateGoal: (goalId: string) => Promise<void>;
  duplicateTask: (taskId: string) => void;
  addWikiPage: (pageData: Partial<Omit<WikiPage, 'id'>>) => void;
  updateWikiPage: (pageId: string, updatedData: Partial<Omit<WikiPage, 'id'>>) => void;
  deleteWikiPage: (pageId: string) => void;
  addNote: (noteData: Partial<Omit<Note, 'id'>>) => Promise<string | undefined>;
  updateNote: (noteId: string, updatedData: Partial<Omit<Note, 'id'>>) => void;
  deleteNote: (noteId: string) => void;
  addSalesPage: (pageData: Partial<Omit<SalesPage, 'id'>>) => Promise<string | undefined>;
  updateSalesPage: (pageId: string, updatedData: Partial<Omit<SalesPage, 'id'>>) => void;
  deleteSalesPage: (pageId: string) => void;
  addChannel: (channelData: Partial<Omit<Channel, 'id'>>) => Promise<string | undefined>;
  updateChannel: (channelId: string, updatedData: Partial<Omit<Channel, 'id'>>) => void;
  deleteChannel: (channelId: string) => void;
  addNotification: (notificationData: Partial<Omit<Notification, 'id'>>) => Promise<string | undefined>;
  updateNotification: (notificationId: string, updatedData: Partial<Omit<Notification, 'id'>>) => Promise<void>;
  deleteNotification: (notificationId: string) => void;
  getInterestById: (id: string) => Interest | undefined;
  getGoalById: (id: string) => Goal | undefined;
  getTaskById: (id: string) => Task | undefined;
  getTasksByGoalId: (goalId: string) => Task[];
  getTopicById: (id: string) => Topic | undefined;
  getWikiPageById: (id: string) => WikiPage | undefined;
  getSalesPageById: (id: string) => SalesPage | undefined;
  getChannelById: (id: string) => Channel | undefined;
  getNotificationById: (id: string) => Notification | undefined;
  getTopicBreadcrumbs: (topicId: string | null) => Topic[];
  handleDragEnd: (result: DropResult) => void;
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
  const dataContext = useDataContext();
  const uiContext = useUIContext();
  const { firestore, user, auth } = useFirebase();

  const { topics, goals, tasks, wikiPages, salesPages, channels, notifications } = dataContext;

  const createUndoableDelete = (
    itemType: string,
    itemId: string,
    itemName: string | undefined,
    deleteFn: () => Promise<any>
  ) => {
    if (!user) return;

    dataContext.setOptimisticallyDeleted(prev => [...prev, itemId]);

    const deleteTimeout = setTimeout(() => {
        deleteFn().catch(error => {
            console.error(`Error permanently deleting ${'itemType'}:`, error);
            dataContext.setOptimisticallyDeleted(prev => prev.filter(id => id !== itemId));
            toast({ variant: 'destructive', title: `Lỗi xóa ${'itemType'}`, description: `Không thể xóa vĩnh viễn "${itemName}".`});
        });
    }, 5000); 

    const handleUndo = () => {
        clearTimeout(deleteTimeout);
        dataContext.setOptimisticallyDeleted(prev => prev.filter(id => id !== itemId));
    };

    toast({
        title: `Đã xóa ${itemType}`,
        description: `"${itemName}" đã được xóa.`,
        action: <ToastAction altText="Hoàn tác" onClick={handleUndo}>Hoàn tác</ToastAction>,
    });
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
    const finalInterestId = interestId || uiContext.interestId;
    if (!finalInterestId || !user) return;
    
    const siblingTopics = dataContext.topics.filter(t => t.interestId === finalInterestId && t.parentId === (parentId || null));
    const maxOrder = siblingTopics.reduce((max, t) => Math.max(max, t.order || 0), 0);

    const newTopic: Partial<Omit<Topic, 'id'>> = { 
        name, 
        imageId, 
        interestId: finalInterestId, 
        userId: user.uid, 
        createdAt: serverTimestamp(),
        parentId: parentId || null,
        order: maxOrder + 1,
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
    if (!uiContext.topicId || !user) return;

    const siblingGoals = goals.filter(g => 
        g.topicId === uiContext.topicId && 
        g.parentId === (goalData.parentId || null)
    );
    const maxOrder = siblingGoals.reduce((max, g) => Math.max(max, g.order || 0), -1);

    const newGoal: Partial<Omit<Goal, 'id'>> = {
      title: goalData.title || 'Mục tiêu không tên',
      topicId: uiContext.topicId,
      status: 'chưa bắt đầu',
      userId: user.uid,
      createdAt: serverTimestamp(),
      order: maxOrder + 1,
      ...goalData,
      startDate: goalData.startDate || null,
      endDate: goalData.endDate || null,
    };
    addDocumentNonBlocking(collection(firestore, 'goals'), newGoal);
    toast({ title: "Đã thêm mục tiêu", description: `"${newGoal.title}" đã được thêm.` });
  };

  const updateGoal = async (goalId: string, updatedData: Partial<Omit<Goal, 'id'>>) => {
    const originalGoal = getGoalById(goalId);
    if (!originalGoal) return;

    // If topicId is being changed, we need to update all child tasks and sub-goals as well.
    if (updatedData.topicId && updatedData.topicId !== originalGoal.topicId) {
        const newTopicId = updatedData.topicId;
        const batch = writeBatch(firestore);
        
        // 1. Update the goal itself
        const goalRef = doc(firestore, 'goals', goalId);
        batch.update(goalRef, updatedData);

        // 2. Find and update all descendant goals
        const descendants = new Set<string>();
        const findDescendants = (parentId: string) => {
            goals.forEach(g => {
                if (g.parentId === parentId) {
                    descendants.add(g.id);
                    findDescendants(g.id);
                }
            });
        };
        findDescendants(goalId);
        
        descendants.forEach(descendantId => {
            const descendantRef = doc(firestore, 'goals', descendantId);
            batch.update(descendantRef, { topicId: newTopicId });
        });

        // 3. Find and update all tasks associated with the entire goal tree
        const allGoalIdsToUpdate = [goalId, ...Array.from(descendants)];
        const childTasks = tasks.filter(t => t.goalId && allGoalIdsToUpdate.includes(t.goalId));
        childTasks.forEach(task => {
            const taskRef = doc(firestore, 'tasks', task.id);
            batch.update(taskRef, { topicId: newTopicId });
        });
        
        // Commit the batch
        batch.commit()
            .then(() => {
                toast({ title: "Mục tiêu đã được cập nhật", description: `Mục tiêu và các mục con đã được chuyển sang chủ đề mới.` });
            })
            .catch(error => {
                console.error("Error updating goal and its children: ", error);
                toast({ variant: "destructive", title: "Lỗi", description: "Không thể cập nhật mục tiêu." });
            });

    } else {
        // Normal update without topic change
        try {
            await updateDoc(doc(firestore, 'goals', goalId), updatedData);
            toast({ title: "Mục tiêu đã được cập nhật", description: `Mục tiêu đã được cập nhật.` });
        } catch (error) {
            console.error("Error updating goal: ", error);
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể cập nhật mục tiêu.' });
        }
    }
  };

  const addTask = async (taskData: Partial<Omit<Task, 'id'>>): Promise<string | undefined> => {
    if (!user) return;
    
    let finalTopicId = taskData.topicId;

    if (!finalTopicId) {
        if (taskData.goalId) {
            const goalRef = doc(firestore, 'goals', taskData.goalId);
            try {
                const goalSnap = await getDoc(goalRef);
                if (goalSnap.exists()) {
                    finalTopicId = goalSnap.data().topicId;
                }
            } catch (error) {
                console.error("Error fetching parent goal: ", error);
            }
        }
    }
    
    const dataWithTimestamps = { ...taskData };
    if (dataWithTimestamps.startDate instanceof Date) {
      dataWithTimestamps.startDate = Timestamp.fromDate(dataWithTimestamps.startDate);
    }
    if (dataWithTimestamps.endDate instanceof Date) {
      dataWithTimestamps.endDate = Timestamp.fromDate(dataWithTimestamps.endDate);
    }

    const siblingTasks = (dataContext.tasks || []).filter(t => t.goalId === taskData.goalId);
    const maxOrder = siblingTasks.reduce((max, t) => Math.max(max, t.order || 0), -1);

    const newTask: Omit<Task, 'id' | 'topicId'> & { topicId: string | null } = {
      text: taskData.text || 'Nhiệm vụ không tên',
      status: taskData.status || 'chưa bắt đầu',
      order: maxOrder + 1,
      userId: user.uid,
      createdAt: serverTimestamp(),
      topicId: finalTopicId || null,
      notes: taskData.notes || '',
      difficulty: taskData.difficulty || 'Vừa',
      goalId: taskData.goalId || null,
      startDate: dataWithTimestamps.startDate || null,
      endDate: dataWithTimestamps.endDate || null,
      recurrence: taskData.recurrence || null,
      customProperties: taskData.customProperties || {},
    };
    
    const docRef = await addDoc(collection(firestore, 'tasks'), newTask);
    const taskId = docRef?.id;
    
    if (taskId) {
      await syncTaskNotifications(taskId, newTask.text, newTask.startDate, newTask.endDate);
    }

    toast({ title: "Đã thêm nhiệm vụ", description: `"${newTask.text}" đã được thêm.` });
    return taskId;
  };

  const updateTask = async (taskId: string, updatedData: Partial<Task>) => {
    if (!user) return;
    const isRecurringInstance = taskId.includes('-recur-');
    let dataToUpdate: Partial<Task> = { ...updatedData };
  
    // If a goalId is being set or changed, derive topicId from it.
    if (updatedData.goalId && updatedData.goalId !== null) {
        const goalRef = doc(firestore, 'goals', updatedData.goalId);
        try {
            const goalSnap = await getDoc(goalRef);
            if (goalSnap.exists()) {
                dataToUpdate.topicId = goalSnap.data().topicId;
            } else {
                 toast({ variant: 'destructive', title: 'Lỗi', description: 'Mục tiêu cha không tồn tại.' });
                 return;
            }
        } catch (error) {
            console.error("Error fetching parent goal: ", error);
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể cập nhật mục tiêu cha.' });
            return;
        }
    }

    if (isRecurringInstance) {
      const originalTaskId = taskId.split('-recur-')[0];
      const originalTask = getTaskById(originalTaskId);
      if (!originalTask) return;
      
      const fullDataForInstance = {
        ...originalTask,
        ...dataToUpdate,
        recurrence: null, // This is an instance, not the rule itself
        userId: user.uid,
      };
      await setDocumentNonBlocking(doc(firestore, 'tasks', taskId), fullDataForInstance, {});
    } else {
      await updateDoc(doc(firestore, 'tasks', taskId), dataToUpdate);
    }

    // Schedule notifications if dates changed
    if (dataToUpdate.startDate || dataToUpdate.endDate || dataToUpdate.text) {
      const currentTask = getTaskById(taskId);
      if (currentTask) {
        await syncTaskNotifications(
          taskId, 
          dataToUpdate.text || currentTask.text, 
          dataToUpdate.startDate || currentTask.startDate, 
          dataToUpdate.endDate || currentTask.endDate
        );
      }
    }

    toast({ title: "Nhiệm vụ đã được cập nhật" });
  };

  const getInterestById = useCallback((id: string) => dataContext.interests.find(i => i.id === id), [dataContext.interests]);

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
         if (uiContext.interestId === id) {
            uiContext.selectInterest(null);
        }
    });
  };

  const getTopicById = useCallback((id: string) => dataContext.topics.find(t => t.id === id), [dataContext.topics]);

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
        if (uiContext.topicId === id) {
            uiContext.selectTopic(null);
        }
    });
  };

  const getGoalById = useCallback((id: string) => dataContext.goals.find(g => g.id === id), [dataContext.goals]);

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

  const deleteTask = (id: string) => {
    const isRecurringInstance = id.includes('-recur-');
    const originalTaskId = isRecurringInstance ? id.split('-recur-')[0] : id;
    
    const task = findTaskInstance(id); 

    createUndoableDelete('nhiệm vụ', originalTaskId, task?.text, async () => {
        await deleteDoc(doc(firestore, 'tasks', originalTaskId));
    });
  };

  const getTasksByGoalId = useCallback((goalId: string) => dataContext.tasks.filter(t => t.goalId === goalId), [dataContext.tasks]);

  const duplicateGoal = async (goalId: string) => {
    if (!user) return;
    const originalGoal = getGoalById(goalId);
    if (!originalGoal) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không tìm thấy mục tiêu gốc.' });
      return;
    }

    const { id, createdAt, order, ...goalData } = originalGoal;
    
    const siblingGoals = goals.filter(g => 
        g.topicId === originalGoal.topicId && 
        g.parentId === originalGoal.parentId
    );
    const maxOrder = siblingGoals.reduce((max, g) => Math.max(max, g.order || 0), -1);

    const newGoalData = {
      ...goalData,
      title: originalGoal.title,
      status: 'chưa bắt đầu' as const,
      order: maxOrder + 1,
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
  
    const { id, createdAt, recurrence, order, ...taskDataToCopy } = sourceTask;
    
    const sourceStartDate = getDateFromFirestore(sourceTask.startDate);
    const sourceEndDate = getDateFromFirestore(sourceTask.endDate);
  
    const newTaskData = {
      ...taskDataToCopy,
      text: sourceTask.text,
      status: 'chưa bắt đầu' as const,
      createdAt: serverTimestamp(),
      recurrence: null, 
      userId: user.uid,
      startDate: sourceStartDate ? Timestamp.fromDate(sourceStartDate) : null,
      endDate: sourceEndDate ? Timestamp.fromDate(sourceEndDate) : null,
      order: (tasks.filter(t => t.goalId === sourceTask.goalId).reduce((max, t) => Math.max(max, t.order || 0), -1)) + 1,
    };
  
    addTask(newTaskData);
  };
  
  const addWikiPage = (pageData: Partial<Omit<WikiPage, 'id'>>) => {
    if (!uiContext.topicId || !user) return;
    const newPage: Omit<WikiPage, 'id'> = {
      title: pageData.title || 'Trang không có tiêu đề',
      content: pageData.content || '',
      topicId: uiContext.topicId,
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

  const getWikiPageById = useCallback((id: string) => dataContext.wikiPages.find(p => p.id === id), [dataContext.wikiPages]);

  const deleteWikiPage = (pageId: string) => {
    const page = getWikiPageById(pageId);
    createUndoableDelete('trang wiki', pageId, page?.title, async () => {
        await deleteDoc(doc(firestore, 'wikiPages', pageId));
    });
  };

  // --- Notes CRUD ---
  const addNote = async (noteData: Partial<Omit<Note, 'id'>>): Promise<string | undefined> => {
    if (!user) return;
    const newNote: Omit<Note, 'id'> = {
      title: noteData.title || 'Ghi chú chưa có tên',
      content: noteData.content || '',
      tags: noteData.tags || [],
      isPinned: noteData.isPinned || false,
      isDaily: noteData.isDaily || false,
      dailyDate: noteData.dailyDate,
      linkedTaskIds: noteData.linkedTaskIds || [],
      linkedNoteIds: noteData.linkedNoteIds || [],
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      const docRef = await addDoc(collection(firestore, 'notes'), newNote);
      toast({ title: 'Đã tạo ghi chú', description: `"${newNote.title}" đã được tạo.` });
      return docRef.id;
    } catch (e) {
      console.error('Error adding note:', e);
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể tạo ghi chú.' });
    }
  };

  const updateNote = (noteId: string, updatedData: Partial<Omit<Note, 'id'>>) => {
    const dataWithTimestamp = { ...updatedData, updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(doc(firestore, 'notes', noteId), dataWithTimestamp);
  };

  const deleteNote = (noteId: string) => {
    const note = (dataContext.notes || []).find((n: Note) => n.id === noteId);
    createUndoableDelete('ghi chú', noteId, note?.title, async () => {
      await deleteDoc(doc(firestore, 'notes', noteId));
    });
  };
  
  const getSalesPageById = useCallback((id: string) => dataContext.salesPages.find(p => p.id === id), [dataContext.salesPages]);

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

  const getChannelById = useCallback((id: string) => dataContext.channels.find(c => c.id === id), [dataContext.channels]);

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

  const addNotification = useCallback(async (notificationData: Partial<Omit<Notification, 'id'>>) => {
    if (!user) return;
    const newNotification = {
      ...notificationData,
      userId: user.uid,
      createdAt: serverTimestamp(),
      isSent: false,
    };
    try {
        const docRef = await addDoc(collection(firestore, 'notifications'), newNotification);
        toast({ title: "Đã lên lịch thông báo", description: `"${notificationData.title}" đã được lên lịch.` });
        return docRef.id;
    } catch(e) {
        console.error("Error adding notification: ", e);
        toast({ variant: 'destructive', title: "Lỗi", description: 'Không thể lên lịch thông báo.' });
    }
  }, [user, firestore, toast]);

  const syncTaskNotifications = useCallback(async (taskId: string, taskText: string, startDate?: any, endDate?: any) => {
    if (!user) return;

    const start = getDateFromFirestore(startDate);
    const end = getDateFromFirestore(endDate);
    const now = new Date();

    if (start && start > now) {
      await addNotification({
        title: 'Bắt đầu nhiệm vụ',
        body: `Nhiệm vụ "${taskText}" bắt đầu ngay bây giờ!`,
        sendAt: Timestamp.fromDate(start),
        link: { type: 'task', id: taskId }
      });
      
      // Schedule local push notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        const timeToStart = start.getTime() - now.getTime();
        if (timeToStart > 0 && timeToStart <= 24 * 60 * 60 * 1000) { // Only schedule if within next 24h
          setTimeout(() => {
            new Notification('Bắt đầu nhiệm vụ', {
              body: `Nhiệm vụ "${taskText}" bắt đầu ngay bây giờ!`,
              icon: '/todo/icon-192x192.png'
            });
          }, timeToStart);
        }
      }
    }

    if (end && end > now) {
      await addNotification({
        title: 'Kết thúc nhiệm vụ',
        body: `Nhiệm vụ "${taskText}" đã đến hạn kết thúc!`,
        sendAt: Timestamp.fromDate(end),
        link: { type: 'task', id: taskId }
      });
      
      // Schedule local push notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const timeToEnd = end.getTime() - now.getTime();
        if (timeToEnd > 0 && timeToEnd <= 24 * 60 * 60 * 1000) {
          setTimeout(() => {
            new Notification('Kết thúc nhiệm vụ', {
              body: `Nhiệm vụ "${taskText}" đã đến hạn kết thúc!`,
              icon: '/todo/icon-192x192.png'
            });
          }, timeToEnd);
        }
      }
    }
  }, [user, addNotification]);

  const updateNotification = useCallback(async (notificationId: string, updatedData: Partial<Omit<Notification, 'id'>>) => {
    await updateDocumentNonBlocking(doc(firestore, 'notifications', notificationId), updatedData);
    toast({ title: "Thông báo đã được cập nhật" });
  }, [firestore, toast]);
  
  const getNotificationById = useCallback((id: string) => dataContext.notifications.find(n => n.id === id), [dataContext.notifications]);

  const deleteNotification = useCallback((notificationId: string) => {
    const notification = getNotificationById(notificationId);
    createUndoableDelete('thông báo', notificationId, notification?.title, async () => {
        await deleteDoc(doc(firestore, 'notifications', notificationId));
    });
  }, [getNotificationById, createUndoableDelete, firestore]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    const reorderItems = (items: (Topic | Goal | Task)[]) => {
      const reordered = Array.from(items);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);

      const batch = writeBatch(firestore);
      reordered.forEach((item, index) => {
        let collectionName = '';
        if ('interestId' in item) collectionName = 'topics';
        else if ('topicId' in item && !('text' in item)) collectionName = 'goals';
        else if ('text' in item) collectionName = 'tasks';
        
        if (collectionName) {
            const docRef = doc(firestore, collectionName, item.id);
            batch.update(docRef, { order: index });
        }
      });
      return batch.commit();
    }

    if (source.droppableId.startsWith('topicsDroppable')) {
      const relevantTopics = topics.filter(topic => {
        if (uiContext.topicId) {
          return topic.parentId === uiContext.topicId;
        }
        if (uiContext.interestId) {
          return topic.interestId === uiContext.interestId && !topic.parentId;
        }
        return false;
      }).sort((a, b) => a.order - b.order);
      reorderItems(relevantTopics).catch(e => console.error("Failed to reorder topics", e));
      return;
    }
    
    if (source.droppableId.startsWith('goalsDroppable')) {
      const topicId = source.droppableId.replace('goalsDroppable-', '');
      const items = goals.filter(g => g.topicId === topicId && !g.parentId).sort((a, b) => a.order - b.order);
      reorderItems(items).catch(e => console.error("Failed to reorder goals", e));
      return;
    }
  };

  const getTaskById = useCallback((id: string) => dataContext.tasks.find(t => t.id === id), [dataContext.tasks]);
  
  const selectedInterest = useMemo(() => dataContext.interests.find((i) => i.id === uiContext.interestId) ?? null, [dataContext.interests, uiContext.interestId]);
  const selectedTopic = useMemo(() => dataContext.topics.find((t) => t.id === uiContext.topicId) ?? null, [dataContext.topics, uiContext.topicId]);

  const getTopicBreadcrumbs = useCallback((topicId: string | null): Topic[] => {
    if (!topicId) return [];
    const breadcrumbs: Topic[] = [];
    let currentTopic = dataContext.topics.find(t => t.id === topicId);
    while (currentTopic) {
        breadcrumbs.unshift(currentTopic);
        currentTopic = dataContext.topics.find(t => t.id === currentTopic!.parentId);
    }
    return breadcrumbs;
  }, [dataContext.topics]);

  const topicBreadcrumbs = useMemo(() => getTopicBreadcrumbs(uiContext.topicId), [uiContext.topicId, getTopicBreadcrumbs]);

  const logout = () => {
    if(auth) {
      signOut(auth);
    }
  }

  const value: AppContextType = useMemo(() => ({
    ...dataContext,
    ...uiContext,
    topicBreadcrumbs,
    selectedInterest,
    selectedTopic,
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
    addNote,
    updateNote,
    deleteNote,
    addSalesPage,
    updateSalesPage,
    deleteSalesPage,
    addChannel,
    updateChannel,
    deleteChannel,
    addNotification,
    updateNotification,
    deleteNotification,
    getInterestById,
    getGoalById,
    getTaskById: findTaskInstance,
    getTasksByGoalId,
    getTopicById,
    getWikiPageById,
    getSalesPageById,
    getChannelById,
    getNotificationById,
    getTopicBreadcrumbs,
    handleDragEnd,
    logout,
  }), [
    dataContext, uiContext, topicBreadcrumbs, selectedInterest, selectedTopic, 
    getTopicBreadcrumbs, findTaskInstance, addNotification, updateNotification, 
    deleteNotification, getGoalById, getInterestById, getTopicById, getWikiPageById, 
    getChannelById, getSalesPageById, getTasksByGoalId, deleteChannel, deleteInterest, deleteGoal, 
    deleteNotification, deleteSalesPage, deleteTask, deleteTopic, deleteWikiPage, duplicateGoal, duplicateTask,
    addChannel, addGoal, addInterest, addSalesPage, addTask, addTopic, addWikiPage, addNote, handleDragEnd, logout,
    updateChannel, updateGoal, updateInterest, updateNotification, updateSalesPage, updateTask, updateTopic, updateWikiPage, updateNote,
    deleteNote
  ]);


  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
