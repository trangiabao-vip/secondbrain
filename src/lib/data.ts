

export type GoalStatus = 'chưa bắt đầu' | 'đang làm' | 'hoàn thành' | 'thất bại' | 'hủy';
export type TaskStatus = 'chưa bắt đầu' | 'đang làm' | 'hoàn thành' | 'thất bại' | 'hủy';
export type GoalPriority = 'Thấp' | 'Vừa' | 'Cao';
export type TaskDifficulty = 'Dễ' | 'Vừa' | 'Khó';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

// Note: The 'id' field will be automatically managed by Firestore.
// The types here represent the data structure within the application logic.
export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: ('MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU')[];
  endDate?: any; // Can be string or Firebase Timestamp
}

export interface Task {
  id: string; // Firestore document ID
  text: string;
  notes?: string;
  status: TaskStatus;
  difficulty?: TaskDifficulty;
  goalId?: string | null; // Optional: Link to a goal
  goalIds?: string[] | null; // Support multiple goals
  topicId?: string | null; 
  topicIds?: string[] | null; // Support multiple topics
  startDate?: any; // Can be string or Firebase Timestamp
  endDate?: any; // Can be string or Firebase Timestamp
  recurrence?: RecurrenceRule | null;
  customProperties?: { [key: string]: string };
  order: number;
  createdAt: any; // Can be string or Firebase Timestamp
  userId: string;
}

export interface Goal {
  id: string; // Firestore document ID
  title: string;
  description?: string;
  topicId: string;
  topicIds?: string[] | null; // Support multiple topics
  parentId?: string | null;
  status: GoalStatus;
  priority?: GoalPriority;
  startDate?: any; // Can be string or Firebase Timestamp
  endDate?: any; // Can be string or Firebase Timestamp
  order: number;
  customProperties?: { [key: string]: string };
  createdAt: any; // Can be string or Firebase Timestamp
  userId: string;
}

export interface Topic {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  interestId: string;
  parentId?: string | null; // ID of the parent topic
  imageId: string;
  order: number;
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

export interface Note {
  id: string; // Firestore document ID
  title: string;
  content: string; // HTML content from TipTap
  tags: string[]; // e.g. ['#work', '#idea']
  isPinned: boolean;
  isDaily: boolean; // true if this is a daily note
  dailyDate?: string; // ISO date string for daily notes e.g. '2026-05-09'
  linkedTaskIds?: string[]; // [[Task links]]
  linkedNoteIds?: string[]; // [[Note wikilinks]]
  userId: string;
  createdAt: any;
  updatedAt: any;
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

export interface SalesPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  topicIds: string[];
  goalIds?: string[];
  taskIds?: string[];
  facebook?: string;
  youtube?: string;
  discord?: string;
  zalo?: string;
  userId: string;
  createdAt: any;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  sendAt: any;
  isSent: boolean;
  userId: string;
  link?: {
    type: 'goal' | 'task' | 'topic';
    id: string;
  };
  createdAt: any;
}

export interface DeviceProfile {
  id: string;
  userId: string;
  deviceId: string;
  createdAt: any;
  updatedAt?: any;
  deviceName: string;
  deviceInfo: Partial<{
    userAgent: string;
    screen: string;
    language: string;
    isOnline: boolean;
    cookiesEnabled: boolean;
  }>;
  hardwareInfo: {
    cpuCores?: number;
    memory?: number;
    platform?: string;
    connectionType?: string;
    battery?: {
      level: number;
      charging: boolean;
    };
  };
  permissions: Record<string, string | null>;
}

export interface FCMToken {
  id: string;
  userId: string;
  createdAt: any;
}


export type DataType = {
  interests: Interest[];
  topics: Topic[];
  goals: Goal[];
  tasks: Task[];
  wikiPages: WikiPage[];
  notes: Note[];
  salesPages: SalesPage[];
  channels: Channel[];
  notifications: Notification[];
};

// This initialData is now only for reference and will not be used
// as the application will fetch data from Firestore.
export const initialData: DataType = {
  interests: [],
  topics: [],
  goals: [],
  tasks: [],
  wikiPages: [],
  notes: [],
  salesPages: [],
  channels: [],
  notifications: [],
};
