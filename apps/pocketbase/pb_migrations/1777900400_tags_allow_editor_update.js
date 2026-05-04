/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const col = app.findCollectionByNameOrId('tags');
  col.updateRule = "@request.auth.role = 'admin' || @request.auth.role = 'editor'";
  return app.save(col);
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId('tags');
    col.updateRule = "@request.auth.role = 'admin'";
    return app.save(col);
  } catch (e) {
    if (!String(e.message || e).includes('no rows in result set')) throw e;
  }
});
