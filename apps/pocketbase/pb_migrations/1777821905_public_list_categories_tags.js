/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const publicList = "@request.auth.id != '' || @request.auth.id = ''";
  let last;
  for (const name of ['categories', 'tags']) {
    const col = app.findCollectionByNameOrId(name);
    col.listRule = publicList;
    col.viewRule = publicList;
    last = app.save(col);
  }
  return last;
}, (app) => {
  let last;
  for (const name of ['categories', 'tags']) {
    try {
      const col = app.findCollectionByNameOrId(name);
      col.listRule = '';
      col.viewRule = '';
      last = app.save(col);
    } catch (e) {
      if (!String(e.message || e).includes('no rows in result set')) throw e;
    }
  }
  return last;
});
