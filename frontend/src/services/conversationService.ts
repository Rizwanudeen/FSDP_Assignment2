import api from './api';

export async function recordFeedback(messageId: string, feedback: 'like' | 'dislike'): Promise<{ feedback: number }> {
    const response = await api.post('/conversations/feedback', { messageId, feedback });
    return response.data.data;
}

export const conversationService = {
    recordFeedback,
};
