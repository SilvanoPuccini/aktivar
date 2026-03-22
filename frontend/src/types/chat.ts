export interface ChatMessage {
  id: number;
  author: {
    id: number;
    full_name: string;
    avatar: string;
  };
  content: string;
  message_type: 'text' | 'image' | 'location' | 'system';
  created_at: string;
  reactions: Reaction[];
}

export interface Reaction {
  id: number;
  user_id: number;
  emoji: string;
}
