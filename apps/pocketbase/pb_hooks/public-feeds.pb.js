/// <reference path="../pb_data/types.d.ts" />

// Public RSS feed at /rss.xml
routerAdd("GET", "/rss.xml", (e) => {
  const siteUrl = $os.getenv("SITE_URL") || "https://flowseekerlab.io";
  const siteName = "FlowSeeker Lab";
  const siteDescription = "Read the flow with AI & Crypto, and turn it into action.";

  const records = $app.findRecordsByFilter(
    "posts",
    `status = "published"`,
    "-published_at",
    50
  );

  const escape = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const items = (records || []).map((r) => {
    const slug = r.get("slug");
    const title = escape(r.get("title"));
    const desc = escape(r.get("excerpt") || "");
    const pub = r.get("published_at") || r.get("created");
    const pubDate = new Date(pub).toUTCString();
    const link = `${siteUrl}/blog/${slug}`;
    const content = escape(r.get("content") || "");
    return `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
      <content:encoded><![CDATA[${r.get("content") || ""}]]></content:encoded>
    </item>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escape(siteDescription)}</description>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return e.string(200, xml).header("Content-Type", "application/rss+xml; charset=utf-8");
});

// Public sitemap at /sitemap.xml
routerAdd("GET", "/sitemap.xml", (e) => {
  const siteUrl = $os.getenv("SITE_URL") || "https://flowseekerlab.io";

  const posts = $app.findRecordsByFilter("posts", `status = "published"`, "-updated", 1000) || [];
  const categories = $app.findRecordsByFilter("categories", "", "-updated", 200) || [];

  const escape = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const tags = $app.findRecordsByFilter("tags", "", "-updated", 500) || [];

  const urls = [
    `<url><loc>${siteUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${siteUrl}/blog</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    `<url><loc>${siteUrl}/search</loc><priority>0.3</priority></url>`,
    `<url><loc>${siteUrl}/privacy</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>`,
    `<url><loc>${siteUrl}/terms</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>`,
  ];

  for (const c of categories) {
    urls.push(`<url><loc>${siteUrl}/category/${escape(c.get("slug"))}</loc><lastmod>${new Date(c.get("updated")).toISOString()}</lastmod><priority>0.7</priority></url>`);
  }
  for (const tg of tags) {
    urls.push(`<url><loc>${siteUrl}/tag/${escape(tg.get("slug"))}</loc><lastmod>${new Date(tg.get("updated")).toISOString()}</lastmod><priority>0.65</priority></url>`);
  }
  for (const p of posts) {
    urls.push(`<url><loc>${siteUrl}/blog/${escape(p.get("slug"))}</loc><lastmod>${new Date(p.get("updated")).toISOString()}</lastmod><priority>0.8</priority></url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return e.string(200, xml).header("Content-Type", "application/xml; charset=utf-8");
});

// Public robots.txt
routerAdd("GET", "/robots.txt", (e) => {
  const siteUrl = $os.getenv("SITE_URL") || "https://flowseekerlab.io";
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml
`;
  return e.string(200, body).header("Content-Type", "text/plain; charset=utf-8");
});

// Anonymous view-increment: POST /api/posts/:id/view
routerAdd("POST", "/api/posts/{id}/view", (e) => {
  const id = e.request.pathValue("id");
  if (!id) return e.json(400, { error: "missing id" });

  try {
    const rec = $app.findRecordById("posts", id);
    if (!rec) return e.json(404, { error: "not found" });
    if (rec.get("status") !== "published") return e.json(403, { error: "not published" });
    rec.set("views", (rec.get("views") || 0) + 1);
    $app.save(rec);
    return e.json(200, { views: rec.get("views") });
  } catch (err) {
    $app.logger().error("view increment failed", "id", id, "error", String(err));
    return e.json(500, { error: "failed" });
  }
});
