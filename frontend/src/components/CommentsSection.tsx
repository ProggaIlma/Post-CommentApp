import React, { useEffect, useState } from 'react';
import { useCommentStore } from '../stores/commentStore';
import { CommentItem } from './CommentItem';
import { Button, FormTextarea } from './ui';
import { useRole, useForm, toast } from '../hooks';
import { CommentSchema } from '../schemas';

interface CommentsSectionProps {
  postId: string;
  postAuthorId: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ postId, postAuthorId }) => {
  const { byPost, fetchComments, createComment } = useCommentStore();
  const { canCreateComment } = useRole();
  const [showForm, setShowForm] = useState(false);

  const state = byPost[postId];

  useEffect(() => {
    if (!state) fetchComments(postId, 1);
  }, [postId]);

  const form = useForm({ content: '' }, CommentSchema);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await createComment({ content: values.content, postId });
      form.reset();
      setShowForm(false);
      toast.success('Comment added!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add comment');
    }
  });

  const loadMore = () => {
    if (state && state.page < state.totalPages) {
      fetchComments(postId, state.page + 1);
    }
  };

  const comments = state?.comments || [];
  const loading = state?.loading;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Comments {state?.total !== undefined ? `(${state.total})` : ''}
        </h4>
        {canCreateComment && (
          <Button variant="ghost" size="sm" onClick={() => setShowForm((v) => !v)}
            className="text-blue-600 text-xs">
            {showForm ? 'Cancel' : '+ Add Comment'}
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-3">
          <FormTextarea
            label=""
            name="content"
            placeholder="Write a comment..."
            value={form.values.content}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.content}
            touched={form.touched.content}
            rows={2}
          />
          <div className="flex justify-end mt-2">
            <Button type="submit" size="sm" loading={form.isSubmitting}>Post</Button>
          </div>
        </form>
      )}

      {loading && comments.length === 0 && (
        <div className="text-center py-3 text-sm text-gray-400">Loading comments…</div>
      )}

      {comments.length === 0 && !loading && (
        <p className="text-sm text-gray-400 py-2">No comments yet. Be the first!</p>
      )}

      <div>
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} postAuthorId={postAuthorId} />
        ))}
      </div>

      {state && state.page < state.totalPages && (
        <Button variant="ghost" size="sm" onClick={loadMore} loading={loading} className="mt-2 w-full text-blue-600">
          Load more comments
        </Button>
      )}
    </div>
  );
};
