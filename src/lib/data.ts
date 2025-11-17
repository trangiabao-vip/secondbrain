
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  goalId: string;
  scheduledDate?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  topicId: string;
  dueDate?: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  name: string;
  interestId: string;
  imageId: string;
  createdAt: string;
}

export interface Interest {
  id: string;
  name: string;
  createdAt: string;
}

export type DataType = {
  interests: Interest[];
  topics: Topic[];
  goals: Goal[];
  tasks: Task[];
};

export const initialData: DataType = {
  interests: [
    { id: 'interest-1', name: 'Phát triển web', createdAt: new Date().toISOString() },
    { id: 'interest-2', name: 'Làm vườn', createdAt: new Date().toISOString() },
  ],
  topics: [
    { id: 'topic-1', name: 'Framework React', interestId: 'interest-1', imageId: '1', createdAt: new Date().toISOString() },
    { id: 'topic-2', name: 'Vườn rau', interestId: 'interest-2', imageId: '2', createdAt: new Date().toISOString() },
  ],
  goals: [
    { id: 'goal-1', title: 'Học Next.js', topicId: 'topic-1', dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(), createdAt: new Date().toISOString() },
    { id: 'goal-2', title: 'Chuẩn bị đất', topicId: 'topic-2', dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(), createdAt: new Date().toISOString() },
  ],
  tasks: [
    { id: 'task-1', text: 'Hoàn thành hướng dẫn Next.js', goalId: 'goal-1', completed: true, scheduledDate: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: 'task-2', text: 'Xây dựng một dự án nhỏ', goalId: 'goal-1', completed: false, scheduledDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(), createdAt: new Date().toISOString() },
    { id: 'task-3', text: 'Mua phân compost', goalId: 'goal-2', completed: false, createdAt: new Date().toISOString() },
    { id: 'task-4', text: 'Xới luống vườn', goalId: 'goal-2', completed: false, scheduledDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(), createdAt: new Date().toISOString() },
  ],
};
