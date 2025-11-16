import { z } from 'zod';

// Helper function to extract @mentions from text
export const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
};

export const CreateCommentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid design ID format'),
  }),
  body: z.object({
    content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long').trim(),
    author: z.string().min(1, 'Author name is required').max(50, 'Author name too long').trim(),
  }),
});

export const GetCommentsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid design ID format'),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default(() => 1),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default(() => 20),
  }),
});

