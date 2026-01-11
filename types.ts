export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  thinking?: boolean;
  groundingSources?: Array<{ title?: string; uri: string }>;
  image?: string; // Base64 encoded image
}

export interface ChatSession {
  id: string;
  title: string;
  dateGroup: string; // e.g., "2025", "Last 7 days"
  messages: Message[];
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  provider: string;
}

export interface User {
  name: string;
  initials: string;
  avatarColor: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  systemInstruction?: string;
}