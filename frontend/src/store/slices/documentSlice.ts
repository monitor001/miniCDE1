import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../axiosConfig';

// Types
export interface Document {
  id: string;
  name: string;
  description?: string;
  status: string;
  version: number;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  containerId: string;
  projectId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  history?: DocumentHistory[];
}

export interface DocumentHistory {
  id: string;
  version: number;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  documentId: string;
  createdById: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
  };
}

interface DocumentState {
  documents: Document[];
  currentDocument: Document | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
}

// Initial state
const initialState: DocumentState = {
  documents: [],
  currentDocument: null,
  isLoading: false,
  error: null,
  uploadProgress: 0,
};

// Async thunks
export const fetchDocuments = createAsyncThunk(
  'documents/fetchDocuments',
  async (containerId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/documents?containerId=${containerId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch documents');
    }
  }
);

export const fetchDocumentById = createAsyncThunk(
  'documents/fetchDocumentById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/documents/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch document');
    }
  }
);

export const uploadDocument = createAsyncThunk(
  'documents/uploadDocument',
  async ({ formData, containerId, projectId }: { formData: FormData; containerId: string; projectId: string }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/documents/upload?containerId=${containerId}&projectId=${projectId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          dispatch(setUploadProgress(progress));
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to upload document');
    }
  }
);

export const uploadNewVersion = createAsyncThunk(
  'documents/uploadNewVersion',
  async ({ formData, documentId }: { formData: FormData; documentId: string }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/documents/${documentId}/version`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          dispatch(setUploadProgress(progress));
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to upload new version');
    }
  }
);

export const updateDocument = createAsyncThunk(
  'documents/updateDocument',
  async ({ id, data }: { id: string; data: Partial<Document> }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/documents/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update document');
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'documents/deleteDocument',
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/documents/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete document');
    }
  }
);

// Document slice
const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setCurrentDocument: (state, action: PayloadAction<Document | null>) => {
      state.currentDocument = action.payload;
    },
    clearDocumentError: (state) => {
      state.error = null;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    resetUploadProgress: (state) => {
      state.uploadProgress = 0;
    },
  },
  extraReducers: (builder) => {
    // Fetch Documents
    builder.addCase(fetchDocuments.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchDocuments.fulfilled, (state, action) => {
      state.isLoading = false;
      state.documents = action.payload;
    });
    builder.addCase(fetchDocuments.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Fetch Document By Id
    builder.addCase(fetchDocumentById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchDocumentById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentDocument = action.payload;
    });
    builder.addCase(fetchDocumentById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Upload Document
    builder.addCase(uploadDocument.pending, (state) => {
      state.isLoading = true;
      state.error = null;
      state.uploadProgress = 0;
    });
    builder.addCase(uploadDocument.fulfilled, (state, action) => {
      state.isLoading = false;
      state.documents.push(action.payload);
      state.uploadProgress = 100;
    });
    builder.addCase(uploadDocument.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      state.uploadProgress = 0;
    });
    
    // Upload New Version
    builder.addCase(uploadNewVersion.pending, (state) => {
      state.isLoading = true;
      state.error = null;
      state.uploadProgress = 0;
    });
    builder.addCase(uploadNewVersion.fulfilled, (state, action) => {
      state.isLoading = false;
      const index = state.documents.findIndex(doc => doc.id === action.payload.id);
      if (index !== -1) {
        state.documents[index] = action.payload;
      }
      if (state.currentDocument?.id === action.payload.id) {
        state.currentDocument = action.payload;
      }
      state.uploadProgress = 100;
    });
    builder.addCase(uploadNewVersion.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      state.uploadProgress = 0;
    });
    
    // Update Document
    builder.addCase(updateDocument.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateDocument.fulfilled, (state, action) => {
      state.isLoading = false;
      const index = state.documents.findIndex(doc => doc.id === action.payload.id);
      if (index !== -1) {
        state.documents[index] = action.payload;
      }
      if (state.currentDocument?.id === action.payload.id) {
        state.currentDocument = action.payload;
      }
    });
    builder.addCase(updateDocument.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Delete Document
    builder.addCase(deleteDocument.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(deleteDocument.fulfilled, (state, action) => {
      state.isLoading = false;
      state.documents = state.documents.filter(doc => doc.id !== action.payload);
      if (state.currentDocument?.id === action.payload) {
        state.currentDocument = null;
      }
    });
    builder.addCase(deleteDocument.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { 
  setCurrentDocument, 
  clearDocumentError, 
  setUploadProgress, 
  resetUploadProgress 
} = documentSlice.actions;

export default documentSlice.reducer; 