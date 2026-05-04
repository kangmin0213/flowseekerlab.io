import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';

function buildHierarchy(rows) {
  const byId = new Map(rows.map((r) => [r.id, { ...r, children: [] }]));
  const roots = [];
  for (const node of byId.values()) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function CategoriesWidget() {
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await pb.collection('categories').getFullList({
          sort: 'name',
          $autoCancel: false,
        });
        if (!cancelled) setCategories(buildHierarchy(rows));
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  if (!categories.length) return null;

  return (
    <div className="mb-10">
      <h3 className="text-sm font-bold uppercase tracking-widest text-foreground mb-5 pb-2 border-b border-border">
        Categories
      </h3>
      <ul className="flex flex-col gap-1.5">
        {categories.map((category) => (
          <li key={category.id} className="flex flex-col">
            <div className="flex items-center justify-between group py-2">
              <Link
                to={`/category/${category.slug}`}
                className="flex-grow text-left text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                <span className="relative inline-block">
                  {category.name}
                  <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-foreground/30 scale-x-0 transition-transform duration-300 group-hover:scale-x-100 origin-left"></span>
                </span>
              </Link>

              {category.children.length > 0 && (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                  aria-label={expanded[category.id] ? 'Collapse category' : 'Expand category'}
                >
                  {expanded[category.id] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>

            {category.children.length > 0 && expanded[category.id] && (
              <ul className="flex flex-col gap-1.5 pl-4 mt-1 mb-2 border-l-2 border-border/50">
                {category.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      to={`/category/${child.slug}`}
                      className="group flex items-center justify-between w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 pl-2"
                    >
                      <span className="relative">
                        {child.name}
                        <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-foreground/20 scale-x-0 transition-transform duration-300 group-hover:scale-x-100 origin-left"></span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CategoriesWidget;
