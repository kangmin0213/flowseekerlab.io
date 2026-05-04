import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import SEO from '@/components/SEO.jsx';
import { legal } from '@/content/legal.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';

function TermsPage() {
  const { lang, t } = useLanguage();
  const doc = legal[lang]?.terms || legal.en.terms;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title={doc.title} description={doc.sections[0]?.p} path="/terms" />
      <Header />
      <main className="flex-grow mx-auto max-w-3xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">
          ← Home
        </Link>
        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">{doc.title}</h1>
        <p className="text-sm text-muted-foreground mb-10">
          {t('legal.lastUpdatedLabel')} {doc.updated}
        </p>
        <article className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          {doc.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-serif font-semibold">{s.h}</h2>
              <p className="text-muted-foreground leading-relaxed">{s.p}</p>
            </section>
          ))}
        </article>
      </main>
      <Footer />
    </div>
  );
}

export default TermsPage;
