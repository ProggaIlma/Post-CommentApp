import React, { useEffect, useState } from 'react';
import { usePostStore } from '@/stores/postStore';
import { PostCard } from '@/components/PostCard';
import { Button, Modal, FormInput, FormTextarea, Pagination } from '@/components/ui';
import { useRole, useForm, toast } from '@/hooks';
import { PostSchema } from '@/schemas';

const Home: React.FC = () => {
  const { posts, loading, error, currentPage, totalPages, total, fetchPosts, createPost } = usePostStore();
  const { canCreatePost, role } = useRole();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchPosts(1);
  }, []);

  const form = useForm({ title: '', content: '' }, PostSchema);

  const handleCreate = form.handleSubmit(async (values) => {
    try {
      await createPost(values);
      form.reset();
      setShowCreate(false);
      toast.success('Post created!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    }
  });

  const handlePageChange = (page: number) => fetchPosts(page);

  const roleInfoMap: Record<string, { color: string; text: string }> = {
    SUPER_ADMIN: { color: 'bg-purple-50 border-purple-200 text-purple-800', text: '👑 Super Admin — You can delete anything in the system.' },
    MODERATOR: { color: 'bg-blue-50 border-blue-200 text-blue-800', text: '🛡 Moderator — You can delete any post or comment.' },
    REGULAR_USER: { color: 'bg-green-50 border-green-200 text-green-800', text: '👤 Regular User — Create posts & comments, manage your own content.' },
    GUEST: { color: 'bg-gray-50 border-gray-200 text-gray-700', text: '👁 Guest — Read-only access. Login to interact.' },
  };
  const roleInfo = roleInfoMap[role] || roleInfoMap.GUEST;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Role info banner */}
      <div className={`border rounded-xl px-4 py-3 mb-5 text-sm font-medium ${roleInfo.color}`}>
        {roleInfo.text}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
          <p className="text-sm text-gray-500">{total} post{total !== 1 ? 's' : ''} total</p>
        </div>
        {canCreatePost && (
          <Button onClick={() => setShowCreate(true)}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </Button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
          <button onClick={() => fetchPosts(currentPage)} className="ml-2 underline">Retry</button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">No posts yet</p>
          {canCreatePost && <p className="text-sm mt-1">Be the first to create one!</p>}
        </div>
      )}

      {/* Posts list */}
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

      {/* Create Post Modal */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); form.reset(); }}
        title="Create New Post"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowCreate(false); form.reset(); }}>Cancel</Button>
            <Button onClick={handleCreate} loading={form.isSubmitting}>Publish Post</Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <FormInput
            label="Title"
            name="title"
            placeholder="An interesting title..."
            value={form.values.title}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.title}
            touched={form.touched.title}
          />
          <FormTextarea
            label="Content"
            name="content"
            placeholder="Write your post content here..."
            value={form.values.content}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.content}
            touched={form.touched.content}
            rows={5}
          />
        </form>
      </Modal>
    </div>
  );
};

export default Home;
