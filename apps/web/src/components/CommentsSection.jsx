import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { formatDate } from '@/lib/postFormat.js';
import { getCommentsEnabled } from '@/lib/cmsSettings.js';

function CommentsSection({ postId }) {
  const { t, lang } = useLanguage();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [form, setForm] = useState({ author_name: '', author_email: '', content: '' });

  useEffect(() => {
    getCommentsEnabled().then(setCommentsOpen);
  }, []);

  const load = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const list = await pb.collection('comments').getList(1, 50, {
        filter: `post_id = "${postId}" && approved = true`,
        sort: '-created',
        $autoCancel: false,
      });
      setComments(list.items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!commentsOpen) return;
    if (!form.author_name || !form.author_email || !form.content) return;
    try {
      setSubmitting(true);
      await pb.collection('comments').create(
        { ...form, post_id: postId, approved: false },
        { $autoCancel: false }
      );
      toast.success(t('post.pending'));
      setForm({ author_name: '', author_email: '', content: '' });
    } catch (err) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-t border-border bg-muted/20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-serif font-bold mb-6">{t('post.comments')}</h2>

        <div className="mb-10">
          {loading ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('post.empty')}</p>
          ) : (
            <ul className="flex flex-col gap-6">
              {comments.map((c) => (
                <li key={c.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {(c.author_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.author_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(c.created, lang === 'ko' ? 'ko-KR' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {commentsOpen ? (
          <form onSubmit={submit} className="rounded-lg border border-border bg-background p-6">
            <h3 className="font-serif font-semibold mb-4">{t('post.leaveComment')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                required
                placeholder={t('post.name')}
                value={form.author_name}
                onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                className="w-full bg-transparent border border-border rounded-md focus:border-primary focus:outline-none px-3 py-2 text-sm"
              />
              <input
                type="email"
                required
                placeholder={t('post.email')}
                value={form.author_email}
                onChange={(e) => setForm({ ...form, author_email: e.target.value })}
                className="w-full bg-transparent border border-border rounded-md focus:border-primary focus:outline-none px-3 py-2 text-sm"
              />
            </div>
            <textarea
              required
              placeholder={t('post.message')}
              rows={4}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full bg-transparent border border-border rounded-md focus:border-primary focus:outline-none px-3 py-2 text-sm resize-y mb-4"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? t('common.loading') : t('post.submit')}
            </button>
          </form>
        ) : (
          <div className="rounded-lg border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            {t('post.commentsClosed')}
          </div>
        )}
      </div>
    </section>
  );
}

export default CommentsSection;
