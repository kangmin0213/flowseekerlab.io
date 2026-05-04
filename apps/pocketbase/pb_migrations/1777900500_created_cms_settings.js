/// <reference path="../pb_data/types.d.ts" />
/// <summary>Singleton-style site config (admin writes; any logged-in user can read for admin UI).</summary>
migrate((app) => {
  const collection = new Collection({
    createRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      {
        autogeneratePattern: '[a-z0-9]{15}',
        hidden: false,
        id: 'textcms001id',
        max: 15,
        min: 15,
        name: 'id',
        pattern: '^[a-z0-9]+$',
        presentable: false,
        primaryKey: true,
        required: true,
        system: true,
        type: 'text',
      },
      {
        hidden: false,
        id: 'textcms002name',
        name: 'site_name',
        presentable: true,
        primaryKey: false,
        required: true,
        system: false,
        type: 'text',
        max: 200,
        min: 0,
        autogeneratePattern: '',
        pattern: '',
      },
      {
        hidden: false,
        id: 'textcms003tag',
        name: 'site_tagline',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'text',
        max: 0,
        min: 0,
        autogeneratePattern: '',
        pattern: '',
      },
      {
        hidden: false,
        id: 'textcms004desc',
        name: 'site_description',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'text',
        max: 0,
        min: 0,
        autogeneratePattern: '',
        pattern: '',
      },
      {
        hidden: false,
        id: 'textcms005url',
        name: 'site_url',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'text',
        max: 0,
        min: 0,
        autogeneratePattern: '',
        pattern: '',
      },
      {
        hidden: false,
        id: 'textcms006tw',
        name: 'twitter_handle',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'text',
        max: 0,
        min: 0,
        autogeneratePattern: '',
        pattern: '',
      },
      {
        hidden: false,
        id: 'numbercms007pp',
        name: 'posts_per_page',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'number',
        onlyInt: true,
        min: 1,
        max: 100,
      },
      {
        hidden: false,
        id: 'boolcms008cc',
        name: 'comments_enabled',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'bool',
      },
      {
        hidden: false,
        id: 'autodatecms009c',
        name: 'created',
        onCreate: true,
        onUpdate: false,
        presentable: false,
        system: false,
        type: 'autodate',
      },
      {
        hidden: false,
        id: 'autodatecms010u',
        name: 'updated',
        onCreate: true,
        onUpdate: true,
        presentable: false,
        system: false,
        type: 'autodate',
      },
    ],
    id: 'pbc_9100000001',
    indexes: [],
    listRule: "@request.auth.id != '' || @request.auth.id = ''",
    name: 'cms_settings',
    system: false,
    type: 'base',
    updateRule: "@request.auth.role = 'admin'",
    viewRule: "@request.auth.id != '' || @request.auth.id = ''",
  });

  try {
    app.save(collection);
  } catch (e) {
    if (!String(e.message || e).includes('Collection name must be unique')) {
      throw e;
    }
    console.log('cms_settings collection already exists');
  }

  const col = app.findCollectionByNameOrId('cms_settings');
  const rec = new Record(col);
  rec.set('site_name', 'FlowSeeker Lab');
  rec.set('site_tagline', 'Read the flow with AI & Crypto, and turn it into action.');
  rec.set(
    'site_description',
    'High-signal analysis at the intersection of AI and crypto. Insights, alpha, and build-in-public project logs.',
  );
  rec.set('site_url', 'https://flowseekerlab.io');
  rec.set('twitter_handle', '@flowseekerlab');
  rec.set('posts_per_page', 20);
  rec.set('comments_enabled', true);
  try {
    return app.save(rec);
  } catch (e) {
    if (String(e.message || e).includes('must be unique') || String(e.message || e).includes('UNIQUE')) {
      console.log('cms_settings seed row exists, skipping');
      return;
    }
    throw e;
  }
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId('cms_settings');
    return app.delete(col);
  } catch (e) {
    if (!String(e.message || e).includes('no rows in result set')) throw e;
  }
});
