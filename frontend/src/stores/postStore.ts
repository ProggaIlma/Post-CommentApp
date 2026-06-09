import { create } from 'zustand';
import { postsApi } from '../services/api';

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: { id: string; email: string; role: string };
  _count?: { comments: number };
  createdAt: string;
  updatedAt: string;
}

interface PostState {
  posts: Post[];
  total: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  fetchPosts: (page?: number) => Promise<void>;
  createPost: (data: { title: string; content: string }) => Promise<void>;
  updatePost: (id: string, data: { title?: string; content?: string }) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  total: 0,
  currentPage: 1,
  totalPages: 1,
  loading: false,
  error: null,

  fetchPosts: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const result = await postsApi.getAll(page);
      set({
        posts: result.data,
        total: result.total,
        currentPage: result.page,
        totalPages: result.totalPages,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to fetch posts', loading: false });
    }
  },

  createPost: async (data) => {
    const post = await postsApi.create(data);
    // Refresh current page after creation
    await get().fetchPosts(get().currentPage);
    return post;
  },

  updatePost: async (id, data) => {
    const updated = await postsApi.update(id, data);
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    }));
  },

  deletePost: async (id) => {
    await postsApi.delete(id);
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== id),
      total: state.total - 1,
    }));
  },
}));
