-- 用户设置表（WebDAV 等）
CREATE TABLE IF NOT EXISTS "user_settings" (
  "user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "webdav_url" text,
  "webdav_user" text,
  "webdav_pass_enc" text,
  "updated_at" timestamp DEFAULT now()
);
