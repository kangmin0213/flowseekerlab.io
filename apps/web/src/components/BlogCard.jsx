import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileImage, Terminal } from 'lucide-react';
import { featuredImageUrl, formatDate, calcReadTime, stripHtml } from '@/lib/postFormat.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';

function BlogCard({ post, index = 0 }) {
  const { t, lang } = useLanguage();
  const category = post.expand?.category_id;
  const author = post.expand?.author_id;
  const isProjectLog = category?.name === 'Agents Harness Lab';
  const thumbnail = featuredImageUrl(post);
  const excerpt = post.excerpt || stripHtml(post.content, 180);
  const dateStr = formatDate(post.published_at || post.created, lang === 'ko' ? 'ko-KR' : 'en-US');
  const readTime = calcReadTime(post.content);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`group grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start mb-10 last:mb-0 bg-card rounded-xl p-4 md:p-6 transition-all duration-300 ${
        isProjectLog
          ? 'border-2 border-primary/20 bg-primary/5 hover:border-primary/40 hover:shadow-md'
          : 'border border-border shadow-sm hover:shadow-md'
      }`}
    >
      <Link
        to={`/blog/${post.slug}`}
        className="md:col-span-5 overflow-hidden rounded-lg bg-muted aspect-[4/3] md:aspect-auto md:h-full relative block"
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/60 text-muted-foreground">
            <FileImage className="h-10 w-10 opacity-40" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wider opacity-70">{t('home.noCover')}</span>
          </div>
        )}
        {isProjectLog && (
          <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm border border-border text-foreground text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1.5 shadow-sm">
            <Terminal className="h-3 w-3 text-primary" />
            Build-in-Public
          </div>
        )}
      </Link>

      <div className="md:col-span-7 flex flex-col py-2 h-full">
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs font-semibold tracking-wide uppercase">
          {category && (
            <span className={isProjectLog ? 'text-primary font-bold' : 'text-primary'}>
              {category.name}
            </span>
          )}
          {category && <span className="text-muted-foreground/30">•</span>}
          <span className="text-muted-foreground">{dateStr}</span>
          <span className="text-muted-foreground/30">•</span>
          <span className="text-muted-foreground normal-case">
            {readTime} {t('post.readTime')}
          </span>
        </div>

        <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-3 leading-snug text-balance">
          <Link to={`/blog/${post.slug}`} className="relative inline-block">
            {post.title}
            <span
              className={`absolute left-0 bottom-0 w-full h-[1px] origin-right scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 group-hover:origin-left ${
                isProjectLog ? 'bg-primary/50' : 'bg-foreground/30'
              }`}
            ></span>
          </Link>
        </h2>

        <p className="text-muted-foreground leading-relaxed mb-6 max-w-2xl text-sm md:text-base line-clamp-3">
          {excerpt}
        </p>

        <div className="mt-auto flex items-center gap-3 pt-4 border-t border-border/50">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
              isProjectLog ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
            }`}
          >
            {(author?.name || author?.email || '?').charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground">
            {author?.name || author?.email || 'Unknown'}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

export default BlogCard;
