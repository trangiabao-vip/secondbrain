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
    { id: 'interest-1', name: 'Phát triển web' },
    { id: 'interest-2', name: 'Làm vườn' },
  ],
  topics: [
    { id: 'topic-1', name: 'Framework React', interestId: 'interest-1', imageId: '1' },
    { id: 'topic-2', name: 'Vườn rau', interestId: 'interest-2', imageId: '2' },
  ],
  goals: [
    { id: 'goal-1', title: 'Học Next.js', topicId: 'topic-1', dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString() },
    { id: 'goal-2', title: 'Chuẩn bị đất', topicId: 'topic-2', dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString() },
  ],
  tasks: [
    { id: 'task-1', text: 'Hoàn thành hướng dẫn Next.js', goalId: 'goal-1', completed: true, scheduledDate: new Date().toISOString() },
    { id: 'task-2', text: 'Xây dựng một dự án nhỏ', goalId: 'goal-1', completed: false, scheduledDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString() },
    { id: 'task-3', text: 'Mua phân compost', goalId: 'goal-2', completed: false },
    { id: 'task-4', text: 'Xới luống vườn', goalId: 'goal-2', completed: false, scheduledDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString() },
  ],
};
