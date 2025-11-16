import { configureStore } from '@reduxjs/toolkit';
import designReducer from './designSlice';
import uiReducer from './uiSlice';
import commentsReducer from './commentsSlice';

export const store = configureStore({
  reducer: {
    design: designReducer,
    ui: uiReducer,
    comments: commentsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;




