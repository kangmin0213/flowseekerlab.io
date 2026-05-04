import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { escapePbFilter } from '@/lib/pbFilter.js';
import { featuredImageUrl, formatDate } from '@/lib/postFormat.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';

function RelatedPosts({ currentId, categoryId }) {
  const { t, lang } = useLanguage();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const filters = [`status = "published"`, `id != "${escapePbFilter(currentId)}"`];
        if (categoryId) filters.push(`category_id = "${escapePbFilter(categoryId)}"`);
        const list = await pb.collection('posts').getList(1, 3, {
          filter: filters.join(' && '),
          sort: '-published_at',
          $autoCancel: false,
        });
        if (!cancelled) setPosts(list.items);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentId, categoryId]);

  if (!posts.length) return null;

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-serif font-bold mb-6">{t('post.relatedPosts')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow bg-card"
            >
              <div className="aspect-[4/3] bg-muted overflow-hidden">
                {featuredImageUrl(post) && (
                  <img
                    src={featuredImageUrl(post)}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-serif font-semibold text-base leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatDate(post.published_at || post.created, lang === 'ko' ? 'ko-KR' : 'en-US')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default RelatedPosts;
