import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import SEO from '@/components/SEO.jsx';
import LoadingSpinner from '@/components/admin/LoadingSpinner.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { escapePbFilter } from '@/lib/pbFilter.js';
import { featuredImageUrl, formatDate, stripHtml } from '@/lib/postFormat.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { getPostsPerPage } from '@/lib/cmsSettings.js';

function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initialQ = params.get('q') || '';
  const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const { t, lang } = useLanguage();

  useEffect(() => {
    getPostsPerPage().then(setPageSize);
  }, []);

  useEffect(() => {
    setQuery(initialQ);
  }, [initialQ]);

  useEffect(() => {
    if (!initialQ.trim()) {
      setResults([]);
      setTotalPages(1);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const escaped = escapePbFilter(initialQ);
        const list = await pb.collection('posts').getList(page, pageSize, {
          filter: `status = "published" && (title ~ "${escaped}" || excerpt ~ "${escaped}" || content ~ "${escaped}")`,
          sort: '-published_at',
          $autoCancel: false,
        });
        if (!cancelled) {
          setResults(list.items);
          setTotalPages(list.totalPages || 1);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialQ, page, pageSize]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setParams({ q: query.trim() });
    } else {
      setParams({});
    }
  };

  const pageHref = useMemo(() => {
    return (p) => {
      const q = new URLSearchParams();
      q.set('q', initialQ);
      if (p > 1) q.set('page', String(p));
      return `/search?${q.toString()}`;
    };
  }, [initialQ]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title={initialQ ? `${t('common.search')}: ${initialQ}` : t('common.search')} path="/search" noindex />
      <Header />
      <main className="flex-grow mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-6">{t('common.search')}</h1>
        <form onSubmit={onSubmit} className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('common.searchPlaceholder')}
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-card focus:border-primary focus:outline-none"
          />
        </form>

        {loading ? (
          <div className="py-10 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : !initialQ ? (
          <p className="text-muted-foreground text-sm">{t('common.searchPlaceholder')}</p>
        ) : results.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('common.noResults')}</p>
        ) : (
          <>
            <ul className="flex flex-col gap-6">
              {results.map((post) => (
                <li key={post.id}>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group flex flex-col sm:flex-row gap-4 rounded-lg border border-border bg-card p-4 hover:shadow-md transition-shadow"
                  >
                    {featuredImageUrl(post) && (
                      <div className="sm:w-40 aspect-[4/3] sm:aspect-square shrink-0 overflow-hidden rounded-md bg-muted">
                        <img
                          src={featuredImageUrl(post)}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="font-serif font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {post.excerpt || stripHtml(post.content, 160)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(post.published_at || post.created, lang === 'ko' ? 'ko-KR' : 'en-US')}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <nav
                className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-border pt-8"
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

export default SearchPage;
