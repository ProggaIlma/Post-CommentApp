import React, { useState } from 'react';
import { Post, usePostStore } from '@/stores/postStore';
import { Button, Modal, FormInput, FormTextarea, RoleBadge } from './ui';
import { CommentsSection } from './CommentsSection';
import { useRole, useForm, toast } from '@/hooks';
import { PostSchema } from '@/schemas';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { canDeletePost, canEditPost } = useRole();
  const { updatePost, deletePost } = usePostStore();
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm(
    { title: post.title, content: post.content },
    PostSchema
  );

  const handleEdit = () => {
    form.reset();
    setEditing(true);
  };

  const handleUpdate = form.handleSubmit(async (values) => {
    try {
      await updatePost(post.id, values);
      setEditing(false);
      toast.success('Post updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update post');
    }
  });

  const handleDelete = async () => {
    if (!confirm('Delete this post? All comments will also be deleted.')) return;
    setDeleting(true);
    try {
      await deletePost(post.id);
      toast.success('Post deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete post');
      setDeleting(false);
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
            {post.author.email[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700">{post.author.email}</span>
              <RoleBadge role={post.author.role} />
            </div>
            <span className="text-xs text-gray-400">{timeAgo(post.createdAt)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {canEditPost(post.authorId) && (
            <Button variant="ghost" size="sm" onClick={handleEdit} aria-label="Edit post">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
          )}
          {canDeletePost(post.authorId) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              loading={deleting}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              aria-label="Delete post"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <h2 className="text-base font-semibold text-gray-900 mb-1">{post.title}</h2>
      <p className="text-sm text-gray-600 leading-relaxed">{post.content}</p>

      {/* Footer */}
      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
          aria-expanded={showComments}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {post._count?.comments ?? 0} comments
          <span className="text-gray-400">{showComments ? '▲' : '▼'}</span>
        </button>
      </div>

      {showComments && (
        <CommentsSection postId={post.id} postAuthorId={post.authorId} />
      )}

      {/* Edit Modal */}
      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit Post"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleUpdate} loading={form.isSubmitting}>Save Changes</Button>
          </>
        }
      >
        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <FormInput
            label="Title"
            name="title"
            value={form.values.title}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.title}
            touched={form.touched.title}
          />
          <FormTextarea
            label="Content"
            name="content"
            value={form.values.content}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.content}
            touched={form.touched.content}
          />
        </form>
      </Modal>
    </article>
  );
};
