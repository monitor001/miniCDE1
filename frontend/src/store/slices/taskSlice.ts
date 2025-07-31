import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../axiosConfig';

// Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  projectId: string;
  assigneeId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  documents?: TaskDocument[];
  comments?: Comment[];
  history?: TaskHistory[];
}

export interface TaskDocument {
  id: string;
  taskId: string;
  documentId: string;
  document?: {
    id: string;
    name: string;
    fileUrl: string;
    fileType: string;
    version: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TaskHistory {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  details: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
}

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: TaskState = {
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/tasks?projectId=${projectId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch tasks');
    }
  }
);

export const fetchTaskById = createAsyncThunk(
  'tasks/fetchTaskById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/tasks/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch task');
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: Partial<Task>, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/tasks', taskData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, data }: { id: string; data: Partial<Task> }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/tasks/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/tasks/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete task');
    }
  }
);

export const addComment = createAsyncThunk(
  'tasks/addComment',
  async ({ taskId, content }: { taskId: string; content: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/tasks/${taskId}/comments`, { content });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add comment');
    }
  }
);

export const addDocumentToTask = createAsyncThunk(
  'tasks/addDocumentToTask',
  async ({ taskId, documentId }: { taskId: string; documentId: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/tasks/${taskId}/documents`, { documentId });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add document to task');
    }
  }
);

export const removeDocumentFromTask = createAsyncThunk(
  'tasks/removeDocumentFromTask',
  async ({ taskId, documentId }: { taskId: string; documentId: string }, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/tasks/${taskId}/documents/${documentId}`);
      return { taskId, documentId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to remove document from task');
    }
  }
);

// Task slice
const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setCurrentTask: (state, action: PayloadAction<Task | null>) => {
      state.currentTask = action.payload;
    },
    clearTaskError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Tasks
    builder.addCase(fetchTasks.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchTasks.fulfilled, (state, action) => {
      state.isLoading = false;
      state.tasks = action.payload;
    });
    builder.addCase(fetchTasks.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Fetch Task By Id
    builder.addCase(fetchTaskById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchTaskById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentTask = action.payload;
    });
    builder.addCase(fetchTaskById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Create Task
    builder.addCase(createTask.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createTask.fulfilled, (state, action) => {
      state.isLoading = false;
      state.tasks.push(action.payload);
    });
    builder.addCase(createTask.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Update Task
    builder.addCase(updateTask.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateTask.fulfilled, (state, action) => {
      state.isLoading = false;
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
      if (state.currentTask?.id === action.payload.id) {
        state.currentTask = action.payload;
      }
    });
    builder.addCase(updateTask.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Delete Task
    builder.addCase(deleteTask.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(deleteTask.fulfilled, (state, action) => {
      state.isLoading = false;
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
      if (state.currentTask?.id === action.payload) {
        state.currentTask = null;
      }
    });
    builder.addCase(deleteTask.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Add Comment
    builder.addCase(addComment.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(addComment.fulfilled, (state, action) => {
      state.isLoading = false;
      if (state.currentTask && state.currentTask.id === action.payload.taskId) {
        if (!state.currentTask.comments) {
          state.currentTask.comments = [];
        }
        state.currentTask.comments.push(action.payload);
      }
    });
    builder.addCase(addComment.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Add Document to Task
    builder.addCase(addDocumentToTask.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(addDocumentToTask.fulfilled, (state, action) => {
      state.isLoading = false;
      if (state.currentTask && state.currentTask.id === action.payload.taskId) {
        if (!state.currentTask.documents) {
          state.currentTask.documents = [];
        }
        state.currentTask.documents.push(action.payload);
      }
    });
    builder.addCase(addDocumentToTask.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Remove Document from Task
    builder.addCase(removeDocumentFromTask.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(removeDocumentFromTask.fulfilled, (state, action) => {
      state.isLoading = false;
      if (state.currentTask && state.currentTask.id === action.payload.taskId && state.currentTask.documents) {
        state.currentTask.documents = state.currentTask.documents.filter(
          doc => doc.documentId !== action.payload.documentId
        );
      }
    });
    builder.addCase(removeDocumentFromTask.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setCurrentTask, clearTaskError } = taskSlice.actions;

export default taskSlice.reducer; 