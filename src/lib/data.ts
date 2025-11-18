
export type GoalStatus = 'chưa bắt đầu' | 'đang làm' | 'hoàn thành' | 'thất bại';
export type TaskStatus = 'chưa bắt đầu' | 'đang làm' | 'hoàn thành' | 'thất bại';

// Note: The 'id' field will be automatically managed by Firestore.
// The types here represent the data structure within the application logic.

export interface Task {
  id: string; // Firestore document ID
  text: string;
  status: TaskStatus;
  goalId?: string | null; // Optional: Link to a goal
  topicId?: string | null; // Optional: Link directly to a topic
  startDate?: any; // Can be string or Firebase Timestamp
  endDate?: any; // Can be string or Firebase Timestamp
  createdAt: any; // Can be string or Firebase Timestamp
  userId: string;
}

export interface Goal {
  id: string; // Firestore document ID
  title: string;
  topicId: string;
  status: GoalStatus;
  startDate?: any; // Can be string or Firebase Timestamp
  endDate?: any; // Can be string or Firebase Timestamp
  createdAt: any; // Can be string or Firebase Timestamp
  userId: string;
}

export interface Topic {
  id: string; // Firestore document ID
  name: string;
  interestId: string;
  imageId: string;
  createdAt: any; // Can be string or Firebase Timestamp
  userId: string;
}

export interface Interest {
  id: string; // Firestore document ID
  name: string;
  createdAt: any; // Can be string or Firebase Timestamp
  userId: string;
}

export type DataType = {
  interests: Interest[];
  topics: Topic[];
  goals: Goal[];
  tasks: Task[];
};

// This initialData is now only for reference and will not be used
// as the application will fetch data from Firestore.
export const initialData: DataType = {
  interests: [],
  topics: [],
  goals: [],
  tasks: [],
};
