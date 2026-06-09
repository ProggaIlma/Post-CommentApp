import { create } from 'zustand';
import { commentsApi } from '../services/api';

export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  author: { id: string; email: string; role: string };
  createdAt: string;
}

interface CommentsByPost {
  [postId: string]: {
    comments: Comment[];
    total: number;
    page: number;
    totalPages: number;
    loading: boolean;
  };
}

interface CommentState {
  byPost: CommentsByPost;
  fetchComments: (postId: string, page?: number) => Promise<void>;
  createComment: (data: { content: string; postId: string }) => Promise<void>;
  deleteComment: (id: string, postId: string) => Promise<void>;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  byPost: {},

  fetchComments: async (postId, page = 1) => {
    set((state) => ({
      byPost: {
        ...state.byPost,
        [postId]: { ...(state.byPost[postId] || {}), loading: true },
      },
    }));
    try {
      const result = await commentsApi.getByPost(postId, page);
      set((state) => ({
        byPost: {
          ...state.byPost,
          [postId]: {
            comments: page === 1 ? result.data : [...(state.byPost[postId]?.comments || []), ...result.data],
            total: result.total,
            page: result.page,
            totalPages: result.totalPages,
            loading: false,
          },
        },
      }));
    } catch {
      set((state) => ({
        byPost: { ...state.byPost, [postId]: { ...(state.byPost[postId] || {}), loading: false } },
      }));
    }
  },

  createComment: async (data) => {
    const comment = await commentsApi.create(data);
    set((state) => {
      const existing = state.byPost[data.postId] || { comments: [], total: 0, page: 1, totalPages: 1, loading: false };
      return {
        byPost: {
          ...state.byPost,
          [data.postId]: {
            ...existing,
            comments: [...existing.comments, comment],
            total: existing.total + 1,
          },
        },
      };
    });
  },

  deleteComment: async (id, postId) => {
    await commentsApi.delete(id);
    set((state) => {
      const existing = state.byPost[postId];
      if (!existing) return state;
      return {
        byPost: {
          ...state.byPost,
          [postId]: {
            ...existing,
            comments: existing.comments.filter((c) => c.id !== id),
            total: existing.total - 1,
          },
        },
      };
    });
  },
}));
