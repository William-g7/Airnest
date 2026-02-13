export type User = {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
  
  export type Conversation = {
    id: string;
    users: User[];
    modified_at?: string;
  };
  
  export type Message = {
    id?: string;  
    clientId?: string;
    body: string;
    created_at?: string;
    created_by: User;
    sent_to: User;
    status?: 'pending' | 'sent' | 'failed';
  };
  
  export type ServerEnvelope =
    | { type: 'message.created'; payload: {
        id: string;
        conversation_id: string;
        body: string;
        created_by_id: string;
        sent_to_id: string;
        created_at: string;
        clientId?: string;
      }}
    | { type: 'error'; payload: { code: string; message: string; clientId?: string } };
  
  export type ClientSendPayload = {
    body: string;
    sent_to_id: string;
    conversation_id: string;
    clientId?: string;
    name?: string;
  };
  