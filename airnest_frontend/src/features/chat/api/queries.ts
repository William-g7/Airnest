'use server';

import { fetchServer } from '@api/server/fetchServer';
import type { Conversation as ChatConversation, Message as ChatMessage, User as ChatUser } from '@chat/types/types';

type ApiUser = { id: string; name: string; avatar_url?: string | null };
type ApiConversation = { id: string; users: ApiUser[]; modified_at?: string };
type ApiMessage = {
  id: string;
  body: string;
  created_at?: string;
  sent_to: ApiUser;
  created_by: ApiUser;
};

type ConversationDetailResponse = {
  conversation: ApiConversation;
  messages: ApiMessage[];
};

/** ---- 映射函数：把 API 转成 features/chat 的领域类型 ---- */
function toChatUser(u: ApiUser): ChatUser {
  return { id: u.id, name: u.name, avatar_url: u.avatar_url ?? null };
}

function toChatConversation(c: ApiConversation): ChatConversation {
  return {
    id: c.id,
    users: c.users.map(toChatUser),
    modified_at: c.modified_at,
  };
}

function toChatMessages(list: ApiMessage[]): ChatMessage[] {
  return list.map((m) => ({
    id: m.id,
    body: m.body,
    created_at: m.created_at,
    created_by: toChatUser(m.created_by),
    sent_to: toChatUser(m.sent_to),
    status: 'sent',
  }));
}

export async function getConversationDetail(conversationId: string): Promise<{
  conversation: ChatConversation;
  messages: ChatMessage[];
}> {
  const data = await fetchServer<ConversationDetailResponse>(`/api/chat/${conversationId}/`);
  return {
    conversation: toChatConversation(data.conversation),
    messages: toChatMessages(data.messages || []),
  };
}

export async function listConversations(): Promise<ChatConversation[]> {
  const data = await fetchServer<ApiConversation[]>(`/api/chat/`);
  return (data || []).map(toChatConversation);
}

export async function ensureConversationWith(userId: string): Promise<{ conversation_id: string }> {
  return await fetchServer<{ success: boolean; conversation_id: string }>(`/api/chat/start/${userId}/`);
}
