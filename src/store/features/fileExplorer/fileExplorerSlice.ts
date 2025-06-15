import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { FolderInfo } from '../../../types';
import SpaceService from '../../../services/space-service';

interface FileExplorerState {
  cache: Record<string, FolderInfo>;
  loadingPaths: Record<string, boolean>;
}

const initialState: FileExplorerState = {
  cache: {},
  loadingPaths: {},
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
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFolderInfoIfNeeded.pending, (state, action) => {
        state.loadingPaths[action.meta.arg] = true;
      })
      .addCase(fetchFolderInfoIfNeeded.fulfilled, (state, action) => {
        const folderInfo = action.payload;
        state.cache[folderInfo.relativePath] = folderInfo;
        delete state.loadingPaths[folderInfo.relativePath];
      })
      .addCase(fetchFolderInfoIfNeeded.rejected, (state, action) => {
        delete state.loadingPaths[action.meta.arg];
      });
  },
});

export default fileExplorerSlice.reducer;
