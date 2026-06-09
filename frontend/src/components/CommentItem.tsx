import React, { useState } from 'react';
import { Comment } from '../stores/commentStore';
import { Button, RoleBadge } from './ui';
import { useRole } from '../hooks';
import { toast } from '../hooks';
import { useCommentStore } from '../stores/commentStore';

interface CommentItemProps {
  comment: Comment;
  postAuthorId: string;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, postAuthorId }) => {
  const { canDeleteComment } = useRole();
  const deleteComment = useCommentStore((s) => s.deleteComment);
  const [deleting, setDeleting] = useState(false);

  const showDelete = canDeleteComment(comment.authorId, postAuthorId);

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return;
    setDeleting(true);
    try {
      await deleteComment(comment.id, comment.postId);
      toast.success('Comment deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete comment');
    } finally {
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
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {comment.author.email[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs font-semibold text-gray-800 truncate">{comment.author.email}</span>
          <RoleBadge role={comment.author.role} />
          <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-gray-700 break-words">{comment.content}</p>
      </div>
      {showDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          loading={deleting}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 self-start"
          aria-label="Delete comment"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </Button>
      )}
    </div>
  );
};
