import { configureStore } from '@reduxjs/toolkit';
import fileExplorerReducer from './features/fileExplorer/fileExplorerSlice';


export const store = configureStore({
  reducer: {
    fileExplorer: fileExplorerReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
