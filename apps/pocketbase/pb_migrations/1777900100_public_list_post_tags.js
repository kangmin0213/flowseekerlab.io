/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const col = app.findCollectionByNameOrId('post_tags');
  const publicList = "@request.auth.id != '' || @request.auth.id = ''";
  col.listRule = publicList;
  col.viewRule = publicList;
  return app.save(col);
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId('post_tags');
    col.listRule = '';
    col.viewRule = '';
    return app.save(col);
  } catch (e) {
    if (!String(e.message || e).includes('no rows in result set')) throw e;
  }
});
