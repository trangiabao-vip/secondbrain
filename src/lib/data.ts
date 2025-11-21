
export type GoalStatus = 'chưa bắt đầu' | 'đang làm' | 'hoàn thành' | 'thất bại';
export type TaskStatus = 'chưa bắt đầu' | 'đang làm' | 'hoàn thành' | 'thất bại';
export type GoalPriority = 'Thấp' | 'Vừa' | 'Cao';
export type TaskDifficulty = 'Dễ' | 'Vừa' | 'Khó';

// Note: The 'id' field will be automatically managed by Firestore.
// The types here represent the data structure within the application logic.

export interface Task {
  id: string; // Firestore document ID
  text: string;
  notes?: string;
  status: TaskStatus;
  difficulty?: TaskDifficulty;
  goalId?: string | null; // Optional: Link to a goal
  topicId?: string | null; // Optional: Link directly to a topic
  startDate?: any; // Can be string or Firebase Timestamp
  endDate?: any; // Can be string or Firebase Timestamp
  customProperties?: { [key: string]: string };
  createdAt: any; // Can be string or Firebase Timestamp
  userId: string;
}

export interface Goal {
  id: string; // Firestore document ID
  title: string;
  description?: string;
  topicId: string;
  status: GoalStatus;
  priority?: GoalPriority;
  startDate?: any; // Can be string or Firebase Timestamp
  endDate?: any; // Can be string or Firebase Timestamp
  customProperties?: { [key: string]: string };
  createdAt: any; // Can be string or Firebase Timestamp
  userId: string;
}

export interface Topic {
  id: string; // Firestore document ID
  name: string;
  description?: string;
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

export interface WikiPage {
  id: string; // Firestore document ID
  title: string;
  content: string;
  topicId: string;
  createdAt: any;
  updatedAt: any;
  userId: string;
}

export interface Participant {
  uid: string;
  displayName: string;
}

export interface WatchRoom {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  videoUrl?: string;
  isPlaying: boolean;
  currentTime: number;
  isPublic?: boolean;
  showtime?: any;
  lastUpdatedBy?: string;
  participants: Participant[];
  createdAt: any;
}

export interface ChatMessage {
    id: string;
    text: string;
    userId: string;
    displayName: string;
    createdAt: any;
}

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  x?: string;
}

export interface BusinessCard {
    id: string;
    name: string;
    title: string;
    company?: string;
    phone?: string;
    email?: string;
    website?: string;
    accentColor?: string;
    socials?: SocialLinks;
    userId: string;
    createdAt: any;
    updatedAt?: any;
}


export type DataType = {
  interests: Interest[];
  topics: Topic[];
  goals: Goal[];
  tasks: Task[];
  wikiPages: WikiPage[];
};

// This initialData is now only for reference and will not be used
// as the application will fetch data from Firestore.
export const initialData: DataType = {
  interests: [],
  topics: [],
  goals: [],
  tasks: [],
  wikiPages: [],
};

    