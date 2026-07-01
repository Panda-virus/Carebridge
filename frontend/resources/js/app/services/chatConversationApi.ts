const CHAT_CONVERSATION_STORAGE_KEY = 'carebridge_chat_conversation';
const CHAT_SESSION_TOKEN_KEY = 'carebridge_chat_session_token';

export function saveChatConversation(
  conversation: Record<string, unknown>,
  authToken?: string | null
): void {
  try {
    const payload = {
      ...conversation,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(CHAT_CONVERSATION_STORAGE_KEY, JSON.stringify(payload));

    if (authToken) {
      localStorage.setItem(CHAT_SESSION_TOKEN_KEY, authToken);
    }
  } catch (error) {
    console.warn('Unable to save chat conversation:', error);
  }
}

export function clearChatSessionToken(): void {
  try {
    localStorage.removeItem(CHAT_SESSION_TOKEN_KEY);
  } catch (error) {
    console.warn('Unable to clear chat session token:', error);
  }
}

export function clearSavedChatConversation(): void {
  try {
    localStorage.removeItem(CHAT_CONVERSATION_STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to clear saved chat conversation:', error);
  }
}

export function getSavedChatConversation(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(CHAT_CONVERSATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Unable to read saved chat conversation:', error);
    return null;
  }
}
