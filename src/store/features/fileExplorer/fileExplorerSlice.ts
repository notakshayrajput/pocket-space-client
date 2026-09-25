import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { FolderInfo } from '../../../types';
import SpaceService from '../../../services/space-service';

interface FileExplorerState {
  cache: Record<string, FolderInfo>;
  loadingPaths: Record<string, boolean>;
  requests: Record<string, string>;
  errors: Record<string, string>;
}

const initialState: FileExplorerState = {
  cache: {},
  loadingPaths: {},
  requests: {},
  errors: {},
};

// Async thunk to fetch folder info
export const fetchFolderInfoIfNeeded = createAsyncThunk<
  FolderInfo,
  string,
  { state: { fileExplorer: FileExplorerState } }
>(
  'fileExplorer/fetchFolderInfoIfNeeded',
  async (relativePath) => {
    const data = await SpaceService.getFolderInfo(relativePath);
    return data;
  },
  {
    condition: (relativePath, { getState }) => {
      const state = getState();
      return !state.fileExplorer.cache[relativePath]; // only fetch if not already in cache
    },
  }
);

const fileExplorerSlice = createSlice({
  name: 'fileExplorer',
  initialState,
  reducers: { clearFileCache: () => initialState },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFolderInfoIfNeeded.pending, (state, action) => {
        state.loadingPaths[action.meta.arg] = true;
        delete state.errors[action.meta.arg];
        state.requests[action.meta.arg] = action.meta.requestId;
      })
      .addCase(fetchFolderInfoIfNeeded.fulfilled, (state, action) => {
        if (state.requests[action.meta.arg] !== action.meta.requestId) return;
        const folderInfo = action.payload;
        state.cache[action.meta.arg] = folderInfo;
        delete state.loadingPaths[action.meta.arg];
        delete state.requests[action.meta.arg];
      })
      .addCase(fetchFolderInfoIfNeeded.rejected, (state, action) => {
        if (state.requests[action.meta.arg] !== action.meta.requestId) return;
        state.errors[action.meta.arg] = action.error.message || "Could not load this folder.";
        delete state.loadingPaths[action.meta.arg];
        delete state.requests[action.meta.arg];
      });
  },
});

export const { clearFileCache } = fileExplorerSlice.actions;
export default fileExplorerSlice.reducer;
