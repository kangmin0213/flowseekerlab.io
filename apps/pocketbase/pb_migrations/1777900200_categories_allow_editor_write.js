/// <reference path="../pb_data/types.d.ts" />
/// <summary>Let editors manage categories (create/update); delete stays admin-only.</summary>
migrate((app) => {
  const col = app.findCollectionByNameOrId('categories');
  col.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'editor'";
  col.updateRule = "@request.auth.role = 'admin' || @request.auth.role = 'editor'";
  col.deleteRule = "@request.auth.role = 'admin'";
  return app.save(col);
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId('categories');
    col.createRule = "@request.auth.role = 'admin'";
    col.updateRule = "@request.auth.role = 'admin'";
    col.deleteRule = "@request.auth.role = 'admin'";
    return app.save(col);
  } catch (e) {
    if (!String(e.message || e).includes('no rows in result set')) throw e;
  }
});
