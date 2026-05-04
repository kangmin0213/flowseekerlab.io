import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Tag } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';

function WeeklyAlphaWidget() {
  const { t } = useLanguage();
  const [fngData, setFngData] = useState({ value: 50, label: 'Neutral', timestamp: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tags, setTags] = useState([]);

  const fetchFng = async () => {
    try {
      setLoading(true);
      setError(false);
      // FNG API updates daily, but we'll fetch real-time just in case
      const response = await fetch('https://api.alternative.me/fng/');
      
      if (!response.ok) throw new Error('Failed to fetch FNG data');
      
      const json = await response.json();
      if (json && json.data && json.data.length > 0) {
        const item = json.data[0];
        setFngData({
          value: parseInt(item.value, 10),
          label: item.value_classification,
          timestamp: parseInt(item.timestamp, 10) * 1000
        });
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid FNG format');
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFng();
    // Refresh every 5 minutes (300,000 ms)
    const interval = setInterval(fetchFng, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await pb.collection('tags').getList(1, 12, {
          sort: 'name',
          $autoCancel: false,
        });
        if (!cancelled) setTags(res.items || []);
      } catch {
        if (!cancelled) setTags([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Determine FNG Color token
  const getFngColorClass = (label) => {
    const l = label.toLowerCase();
    if (l.includes('extreme fear')) return 'text-[hsl(var(--fng-extreme-fear))]';
    if (l.includes('fear')) return 'text-[hsl(var(--fng-fear))]';
    if (l.includes('extreme greed')) return 'text-[hsl(var(--fng-extreme-greed))]';
    if (l.includes('greed')) return 'text-[hsl(var(--fng-greed))]';
    return 'text-[hsl(var(--fng-neutral))]';
  };

  const getFngStrokeVar = (label) => {
    const l = label.toLowerCase();
    if (l.includes('extreme fear')) return 'hsl(var(--fng-extreme-fear))';
    if (l.includes('fear')) return 'hsl(var(--fng-fear))';
    if (l.includes('extreme greed')) return 'hsl(var(--fng-extreme-greed))';
    if (l.includes('greed')) return 'hsl(var(--fng-greed))';
    return 'hsl(var(--fng-neutral))';
  };

  // Gauge calculations
  const radius = 40;
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = circumference - (fngData.value / 100) * circumference;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground font-serif">
          Weekly Alpha
        </h3>
        {loading && <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin" />}
      </div>

      {/* Fear & Greed Section */}
      <div className="bg-card border border-border shadow-sm rounded-xl p-5 mb-5 flex flex-col items-center">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 w-full text-center">
          Bitcoin Fear & Greed
        </h4>

        {error ? (
          <div className="py-6 text-sm text-muted-foreground text-center">
            Unable to load F&G Index.
            <button onClick={fetchFng} className="block mx-auto mt-2 text-primary hover:underline text-xs">
              Retry
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-[160px] aspect-[2/1] overflow-hidden flex flex-col items-center justify-end mb-2 transition-opacity duration-300" style={{ opacity: loading && !fngData.value ? 0.5 : 1 }}>
            
            {/* SVG Gauge */}
            <svg viewBox="0 0 100 50" className="w-full drop-shadow-sm overflow-visible">
              {/* Background Arc */}
              <path 
                d="M 10 50 A 40 40 0 0 1 90 50" 
                fill="none" 
                stroke="currentColor" 
                className="text-muted/50" 
                strokeWidth="10" 
                strokeLinecap="round" 
              />
              {/* Value Arc */}
              <path 
                d="M 10 50 A 40 40 0 0 1 90 50" 
                fill="none" 
                stroke={getFngStrokeVar(fngData.label)}
                strokeWidth="10" 
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            {/* Value Overlay */}
            <div className="absolute bottom-0 left-0 w-full flex flex-col items-center translate-y-2">
              <span className={`text-3xl font-sans font-bold leading-none ${getFngColorClass(fngData.label)}`}>
                {fngData.value}
              </span>
            </div>
          </div>
        )}

        {!error && (
          <div className="text-center mt-2">
            <div className={`text-sm font-bold font-sans ${getFngColorClass(fngData.label)}`}>
              {fngData.label}
            </div>
            {lastUpdated && (
              <div className="text-[10px] text-muted-foreground mt-1">
                Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        )}
      </div>

      {tags.length > 0 && (
        <div className="bg-card border border-border shadow-sm rounded-xl p-5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            {t('home.sidebarTags')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/tag/${encodeURIComponent(tag.slug)}`}
                className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-sans font-medium border border-border/50 hover:bg-secondary/80 transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default WeeklyAlphaWidget;
