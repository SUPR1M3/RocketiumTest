import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Comment } from '../types';

interface CommentsState {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}

const initialState: CommentsState = {
  comments: [],
  isLoading: false,
  error: null,
  pagination: null,
};

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    setComments: (state, action: PayloadAction<Comment[]>) => {
      state.comments = action.payload;
    },

    addComment: (state, action: PayloadAction<Comment>) => {
      // Add new comment at the beginning (newest first)
      state.comments.unshift(action.payload);
      if (state.pagination) {
        state.pagination.total++;
      }
    },

    setPagination: (
      state,
      action: PayloadAction<{
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }>
    ) => {
      state.pagination = action.payload;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearComments: (state) => {
      state.comments = [];
      state.pagination = null;
    },
  },
});

export const { setComments, addComment, setPagination, setLoading, setError, clearComments } =
  commentsSlice.actions;

export default commentsSlice.reducer;

