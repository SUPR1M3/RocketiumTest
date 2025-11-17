import { api } from './api';

export interface Comment {
  _id: string;
  designId: string;
  content: string;
  author: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentData {
  content: string;
  author: string;
}

export interface GetCommentsResponse {
  success: boolean;
  data: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateCommentResponse {
  success: boolean;
  data: Comment;
}

// Get all comments for a design
export const getComments = async (designId: string, page = 1, limit = 50): Promise<GetCommentsResponse> => {
  const response = await api.get<GetCommentsResponse>(
    `/api/designs/${designId}/comments`,
    { params: { page, limit } }
  );
  return response.data;
};

// Create a new comment
export const createComment = async (designId: string, data: CreateCommentData): Promise<CreateCommentResponse> => {
  const response = await api.post<CreateCommentResponse>(
    `/api/designs/${designId}/comments`,
    data
  );
  return response.data;
};

// Extract @mentions from text
export const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex);
  if (!matches) return [];
  return matches.map(mention => mention.slice(1)); // Remove @ symbol
};

// Highlight @mentions in text with HTML
export const highlightMentions = (text: string): string => {
  return text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
};
