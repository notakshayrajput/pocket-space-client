import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { FolderInfo, FolderPageRequest } from '../../../types';
import SpaceService from '../../../services/space-service';

interface FileExplorerState {
  cache: Record<string, FolderInfo>;
  loading: Record<string, boolean>;
  requests: Record<string, string>;
  errors: Record<string, string>;
}

const initialState: FileExplorerState = {
  cache: {},
  loading: {},
  requests: {},
  errors: {},
};

export const folderQueryKey = (request: Omit<FolderPageRequest, 'offset'>) =>
  JSON.stringify([request.relativePath, request.search, request.sortBy, request.direction]);

export const fetchFolderPage = createAsyncThunk<
  FolderInfo,
  FolderPageRequest,
  { state: { fileExplorer: FileExplorerState } }
>(
  'fileExplorer/fetchFolderPage',
  (request) => SpaceService.getFolderInfo(request),
  {
    condition: (request, { getState }) => {
      const state = getState().fileExplorer;
      const key = folderQueryKey(request);
      if (state.loading[key]) return false;
      const cached = state.cache[key];
      if (request.offset === 0) return !cached;
      return !!cached && cached.hasMore && cached.nextOffset === request.offset;
    },
  }
);

const fileExplorerSlice = createSlice({
  name: 'fileExplorer',
  initialState,
  reducers: { clearFileCache: () => initialState },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFolderPage.pending, (state, action) => {
        const key = folderQueryKey(action.meta.arg);
        state.loading[key] = true;
        delete state.errors[key];
        state.requests[key] = action.meta.requestId;
      })
      .addCase(fetchFolderPage.fulfilled, (state, action) => {
        const key = folderQueryKey(action.meta.arg);
        if (state.requests[key] !== action.meta.requestId) return;
        const page = action.payload;
        state.cache[key] = action.meta.arg.offset === 0 ? page : {
          ...page,
          files: [...state.cache[key].files, ...page.files],
        };
        delete state.loading[key];
        delete state.requests[key];
      })
      .addCase(fetchFolderPage.rejected, (state, action) => {
        const key = folderQueryKey(action.meta.arg);
        if (state.requests[key] !== action.meta.requestId) return;
        state.errors[key] = action.error.message || "Could not load this folder.";
        delete state.loading[key];
        delete state.requests[key];
      });
  },
});

export const { clearFileCache } = fileExplorerSlice.actions;
export default fileExplorerSlice.reducer;
