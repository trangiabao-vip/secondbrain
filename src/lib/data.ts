export interface Task {
  id: string;
  text: string;
  completed: boolean;
  goalId: string;
  scheduledDate?: string;
}

export interface Goal {
  id: string;
  title: string;
  topicId: string;
  dueDate?: string;
}

export interface Topic {
  id: string;
  name: string;
  interestId: string;
  imageId: string;
}

export interface Interest {
  id: string;
  name: string;
}

export type DataType = {
  interests: Interest[];
  topics: Topic[];
  goals: Goal[];
  tasks: Task[];
};

export const initialData: DataType = {
  interests: [
    { id: 'interest-1', name: 'Web Development' },
    { id: 'interest-2', name: 'Gardening' },
  ],
  topics: [
    { id: 'topic-1', name: 'React Frameworks', interestId: 'interest-1', imageId: '1' },
    { id: 'topic-2', name: 'Vegetable Patch', interestId: 'interest-2', imageId: '2' },
  ],
  goals: [
    { id: 'goal-1', title: 'Learn Next.js', topicId: 'topic-1', dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString() },
    { id: 'goal-2', title: 'Prepare soil', topicId: 'topic-2', dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString() },
  ],
  tasks: [
    { id: 'task-1', text: 'Complete Next.js tutorial', goalId: 'goal-1', completed: true, scheduledDate: new Date().toISOString() },
    { id: 'task-2', text: 'Build a small project', goalId: 'goal-1', completed: false, scheduledDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString() },
    { id: 'task-3', text: 'Buy compost', goalId: 'goal-2', completed: false },
    { id: 'task-4', text: 'Till the garden bed', goalId: 'goal-2', completed: false, scheduledDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString() },
  ],
};
