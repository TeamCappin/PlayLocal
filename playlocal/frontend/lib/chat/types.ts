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
  createdAt: string; // ISO string
};

export type ChatInbound = Partial<{
  id: string;
  gameId: string;

  // possible backend fields
  senderId: string;
  senderName: string;

  // fallbacks some payloads might use
  userId: string;
  fullName: string;
  username: string;
  sender: string;

  content: string;
  messageText: string;
  text: string;

  createdAt: string;
  timestamp: string | number;
}>;
