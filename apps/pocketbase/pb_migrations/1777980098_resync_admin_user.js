/// <reference path="../pb_data/types.d.ts" />
/// <summary>Idempotent admin upsert from env vars (PB_ADMIN_USER_EMAIL/PB_ADMIN_USER_PASSWORD). Recovers from missed env on prior deploys. No-ops if either is missing — credentials are NEVER hard-coded here.</summary>
migrate((app) => {
  const email = $os.getenv("PB_ADMIN_USER_EMAIL");
  const password = $os.getenv("PB_ADMIN_USER_PASSWORD");
  if (!email || !password) {
    console.log("PB_ADMIN_USER_EMAIL / PB_ADMIN_USER_PASSWORD not set, skipping admin upsert");
    return;
  }

  let record;
  try {
    record = app.findFirstRecordByData("users", "email", email);
  } catch (e) {
    if (!String(e.message || e).includes("no rows in result set")) {
      throw e;
    }
    const collection = app.findCollectionByNameOrId("users");
    record = new Record(collection);
    record.set("email", email);
  }

  record.setPassword(password);
  record.set("role", "admin");
  record.set("name", "Admin");
  return app.save(record);
}, () => {
  // no-op rollback for auth bootstrap helper
});
