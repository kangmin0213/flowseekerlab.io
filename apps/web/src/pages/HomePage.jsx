import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import BlogCard from '@/components/BlogCard.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import SEO from '@/components/SEO.jsx';
import LoadingSpinner from '@/components/admin/LoadingSpinner.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { getPostsPerPage } from '@/lib/cmsSettings.js';

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPublished, setTotalPublished] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const { t } = useLanguage();

  useEffect(() => {
    getPostsPerPage().then(setPerPage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await pb.collection('posts').getList(1, perPage, {
          filter: 'status = "published"',
          sort: '-published_at',
          expand: 'author_id,category_id',
          $autoCancel: false,
        });
        if (!cancelled) {
          setPosts(list.items);
          setTotalPublished(list.totalItems ?? list.items.length);
        }
      } catch {
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [perPage]);

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      <SEO path="/" />
      <Header />

      <section className="spacing-hero border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-tight text-balance">
              Read the flow with{' '}
              <span className="relative whitespace-nowrap inline-block">
                AI & Crypto
                <svg
                  className="absolute w-full h-3 -bottom-1 left-0 text-primary opacity-90"
                  viewBox="0 0 200 9"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 7C49.5 2 135.5 -2.5 198 6.5"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              ,<br />
              and turn it into action.
            </h1>
          </div>
        </div>
      </section>

      <main className="flex-grow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 spacing-tight">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-2/3 lg:pr-4">
              <div className="mb-8">
                <h2 className="text-sm font-bold uppercase tracking-widest text-foreground pb-2 border-b border-border">
                  {t('home.latest')}
                </h2>
              </div>

              {loading ? (
                <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
              ) : posts.length === 0 ? (
                <div className="py-16 text-center max-w-md mx-auto rounded-xl border border-border bg-card/50 px-6 py-10">
                  <p className="font-serif text-lg font-semibold text-foreground mb-2">{t('home.noPostsTitle')}</p>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{t('home.noPostsBody')}</p>
                  <Link
                    to="/admin"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    {t('home.openAdmin')}
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col">
                  {posts.map((post, index) => (
                    <BlogCard key={post.id} post={post} index={index} />
                  ))}
                  {totalPublished > perPage && (
                    <div className="mt-8 text-center">
                      <Link
                        to="/blog"
                        className="inline-flex text-sm font-medium text-primary hover:underline"
                      >
                        {t('home.viewAllPosts')}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Sidebar />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
