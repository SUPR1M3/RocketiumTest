import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface UiState {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  toasts: ToastMessage[];
  showCommentsPanel: boolean;
  showLayersPanel: boolean;
  showPropertiesPanel: boolean;
}

const initialState: UiState = {
  isLoading: false,
  isSaving: false,
  error: null,
  toasts: [],
  showCommentsPanel: false,
  showLayersPanel: true,
  showPropertiesPanel: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    addToast: (state, action: PayloadAction<Omit<ToastMessage, 'id'>>) => {
      const id = Date.now().toString();
      state.toasts.push({ ...action.payload, id });
    },

    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },

    toggleCommentsPanel: (state) => {
      state.showCommentsPanel = !state.showCommentsPanel;
    },

    toggleLayersPanel: (state) => {
      state.showLayersPanel = !state.showLayersPanel;
    },

    togglePropertiesPanel: (state) => {
      state.showPropertiesPanel = !state.showPropertiesPanel;
    },

    setCommentsPanel: (state, action: PayloadAction<boolean>) => {
      state.showCommentsPanel = action.payload;
    },
  },
});

export const {
  setLoading,
  setSaving,
  setError,
  addToast,
  removeToast,
  toggleCommentsPanel,
  toggleLayersPanel,
  togglePropertiesPanel,
  setCommentsPanel,
} = uiSlice.actions;

export default uiSlice.reducer;

