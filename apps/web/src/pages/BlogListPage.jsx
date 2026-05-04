import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useLocation, Link } from 'react-router-dom';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import SEO from '@/components/SEO.jsx';
import BlogCard from '@/components/BlogCard.jsx';
import LoadingSpinner from '@/components/admin/LoadingSpinner.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { escapePbFilter } from '@/lib/pbFilter.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { getPostsPerPage } from '@/lib/cmsSettings.js';

function BlogListPage() {
  const { categorySlug, tagSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const { t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [tag, setTag] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    getPostsPerPage().then(setPageSize);
  }, []);

  const listKeyRef = useRef(null);
  useEffect(() => {
    const key = `${categorySlug || ''}|${tagSlug || ''}`;
    if (listKeyRef.current !== null && listKeyRef.current !== key) {
      setSearchParams({}, { replace: true });
    }
    listKeyRef.current = key;
  }, [categorySlug, tagSlug, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setCategory(null);
      setTag(null);
      try {
        if (tagSlug) {
          const safeTag = escapePbFilter(tagSlug);
          const tagsRes = await pb.collection('tags').getList(1, 1, {
            filter: `slug = "${safeTag}"`,
            $autoCancel: false,
          });
          const tagRec = tagsRes.items[0];
          if (!tagRec) {
            if (!cancelled) {
              setTag(null);
              setPosts([]);
              setTotalPages(1);
            }
            return;
          }
          if (!cancelled) setTag(tagRec);

          const pts = await pb.collection('post_tags').getFullList({
            filter: `tag_id = "${tagRec.id}"`,
            batch: 500,
            $autoCancel: false,
          });
          const ids = [...new Set(pts.map((p) => p.post_id))];
          if (ids.length === 0) {
            if (!cancelled) {
              setPosts([]);
              setTotalPages(1);
            }
            return;
          }
          const CHUNK = 35;
          const merged = [];
          for (let i = 0; i < ids.length; i += CHUNK) {
            const chunk = ids.slice(i, i + CHUNK);
            const orf = chunk.map((id) => `id = "${escapePbFilter(id)}"`).join(' || ');
            const batch = await pb.collection('posts').getFullList({
              filter: `status = "published" && (${orf})`,
              sort: '-published_at',
              expand: 'author_id,category_id',
              $autoCancel: false,
            });
            merged.push(...batch);
          }
          const byId = new Map(merged.map((p) => [p.id, p]));
          const sorted = [...byId.values()].sort(
            (a, b) =>
              new Date(b.published_at || b.created) - new Date(a.published_at || a.created),
          );
          const tp = Math.max(1, Math.ceil(sorted.length / pageSize));
          if (!cancelled) setTotalPages(tp);
          if (!cancelled) {
            setPosts(sorted.slice((page - 1) * pageSize, page * pageSize));
          }
          return;
        }

        let cat = null;
        if (categorySlug) {
          const safeCat = escapePbFilter(categorySlug);
          const cats = await pb.collection('categories').getList(1, 1, {
            filter: `slug = "${safeCat}"`,
            $autoCancel: false,
          });
          cat = cats.items[0] || null;
          if (!cancelled) setCategory(cat);
        }
        const filters = [`status = "published"`];
        if (cat) filters.push(`category_id = "${cat.id}"`);
        const list = await pb.collection('posts').getList(page, pageSize, {
          filter: filters.join(' && '),
          sort: '-published_at',
          expand: 'author_id,category_id',
          $autoCancel: false,
        });
        if (!cancelled) {
          setPosts(list.items);
          setTotalPages(list.totalPages || 1);
        }
      } catch {
        if (!cancelled) {
          setPosts([]);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categorySlug, tagSlug, page, pageSize]);

  const heading = tag ? tag.name : category ? category.name : t('home.latest');
  const path = tagSlug ? `/tag/${tagSlug}` : categorySlug ? `/category/${categorySlug}` : '/blog';

  const pageHref = (p) => {
    const q = new URLSearchParams();
    if (p > 1) q.set('page', String(p));
    const s = q.toString();
    return `${location.pathname}${s ? `?${s}` : ''}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={heading}
        description={
          category?.description ||
          (tag ? `${tag.name} — ${t('home.latest')}` : undefined)
        }
        path={path}
      />
      <Header />
      <main className="flex-grow mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10">
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-3">{heading}</h1>
          {category?.description && (
            <p className="text-muted-foreground text-lg">{category.description}</p>
          )}
        </header>

        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground">{t('common.noResults')}</p>
        ) : (
          <>
            <div className="flex flex-col">
              {posts.map((post, i) => (
                <BlogCard key={post.id} post={post} index={i} />
              ))}
            </div>
            {totalPages > 1 && (
              <nav
                className="mt-12 flex flex-wrap items-center justify-center gap-2 border-t border-border pt-8"
                aria-label="Pagination"
              >
                {page > 1 ? (
                  <Link
                    to={pageHref(page - 1)}
                    className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
                  >
                    {t('pagination.prev')}
                  </Link>
                ) : (
                  <span className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground opacity-50">
                    {t('pagination.prev')}
                  </span>
                )}
                <span className="text-sm text-muted-foreground px-2">
                  {t('pagination.pageOf').replace('{{page}}', String(page)).replace('{{total}}', String(totalPages))}
                </span>
                {page < totalPages ? (
                  <Link
                    to={pageHref(page + 1)}
                    className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
                  >
                    {t('pagination.next')}
                  </Link>
                ) : (
                  <span className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground opacity-50">
                    {t('pagination.next')}
                  </span>
                )}
              </nav>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default BlogListPage;
