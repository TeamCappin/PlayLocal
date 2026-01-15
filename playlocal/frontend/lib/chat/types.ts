export type ChatUser = {
  id: string;
  name: string;
};

export type ChatMessage = {
  id: string;
  gameId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string; // ISO
};

// What you might receive from backend (kept flexible on purpose)
export type ChatInbound = {
  id?: string;
  gameId?: string;

  senderId?: string;
  userId?: string;
  sender?: string;

  senderName?: string;
  fullName?: string;
  username?: string;

  content?: string;
  messageText?: string;
  text?: string;

  createdAt?: string;
  timestamp?: number | string;
};
