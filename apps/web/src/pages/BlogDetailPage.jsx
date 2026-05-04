import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Share2, Calendar } from 'lucide-react';
/* eslint-disable react-hooks/exhaustive-deps */
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import SEO from '@/components/SEO.jsx';
import CommentsSection from '@/components/CommentsSection.jsx';
import RelatedPosts from '@/components/RelatedPosts.jsx';
import LoadingSpinner from '@/components/admin/LoadingSpinner.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { escapePbFilter } from '@/lib/pbFilter.js';
import { calcReadTime, formatDate, featuredImageUrl, stripHtml } from '@/lib/postFormat.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { canonicalUrl } from '@/lib/seo.js';

function BlogDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const incrementViews = useCallback(async (id) => {
    try {
      const base = (pb.baseUrl || import.meta.env.VITE_POCKETBASE_URL || '').replace(/\/$/, '');
      if (!base) return;
      await fetch(`${base}/api/posts/${encodeURIComponent(id)}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      // ignore — analytics-only
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const safeSlug = escapePbFilter(slug);
        const result = await pb.collection('posts').getList(1, 1, {
          filter: `slug = "${safeSlug}" && status = "published"`,
          expand: 'author_id,category_id',
          $autoCancel: false,
        });
        if (cancelled) return;
        if (!result.items.length) {
          setNotFound(true);
          return;
        }
        const found = result.items[0];
        setPost(found);
        incrementViews(found.id);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, incrementViews]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: post?.title, url });
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // ignored
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEO title={t('common.notFound')} path={`/blog/${slug}`} noindex />
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center text-center py-20 px-4">
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4">{t('common.notFound')}</h1>
          <button
            onClick={() => navigate('/')}
            className="text-primary underline-offset-4 hover:underline"
          >
            {t('common.backHome')}
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const readTime = calcReadTime(post.content);
  const heroImage = featuredImageUrl(post);
  const author = post.expand?.author_id;
  const category = post.expand?.category_id;
  const description = post.excerpt || stripHtml(post.content, 160);
  const path = `/blog/${post.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    image: heroImage,
    datePublished: post.published_at || post.created,
    dateModified: post.updated,
    author: author ? { '@type': 'Person', name: author.name || author.email } : undefined,
    mainEntityOfPage: canonicalUrl(path),
    inLanguage: lang,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      <SEO
        title={post.title}
        description={description}
        path={path}
        image={heroImage}
        type="article"
        publishedAt={post.published_at}
        updatedAt={post.updated}
        author={author?.name || author?.email}
        jsonLd={jsonLd}
      />
      <Header />

      <article className="flex-grow">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('post.back')}
          </Link>

          <header className="mb-10">
            {category && (
              <div className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
                {category.name}
              </div>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold leading-tight text-balance mb-6">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {post.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-y border-border py-4">
              {author && (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {(author.name || author.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-foreground">{author.name || author.email}</span>
                </div>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(post.published_at || post.created, lang === 'ko' ? 'ko-KR' : 'en-US')}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {readTime} {t('post.readTime')}
              </span>
              <button
                onClick={handleShare}
                className="ml-auto flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Share2 className="h-4 w-4" />
                {t('post.share')}
              </button>
            </div>
          </header>

          {heroImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="rounded-xl overflow-hidden border border-border mb-10"
            >
              <img src={heroImage} alt={post.title} className="w-full h-auto" />
            </motion.div>
          )}

          <div
            className="prose prose-neutral dark:prose-invert prose-lg max-w-none prose-headings:font-serif prose-a:text-primary prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </article>

      <RelatedPosts currentId={post.id} categoryId={post.category_id} />
      <CommentsSection postId={post.id} />

      <Footer />
    </div>
  );
}

export default BlogDetailPage;
