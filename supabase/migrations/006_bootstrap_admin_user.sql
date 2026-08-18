-- ============================================================
--  STEEL SHAFT ERP — AUTH USER CHECK (SQL EDITOR SAFE)
--
--  IMPORTANT:
--  Supabase Auth users cannot be created directly in the SQL editor.
--  The auth schema is a separate database layer, and calls like
--  auth.admin.create_user() fail with a cross-database reference error.
--
--  This script only checks whether the admin user already exists.
--  If it does not exist, create it from:
--    Supabase Dashboard → Authentication → Add user
--  or from a server-side Supabase Admin API call.
-- ============================================================

select
  id,
  email,
  raw_user_meta_data,
  created_at
from auth.users
where email = 'admin@steelshaft.local';

-- If the query returns no rows, create the user in the Supabase Dashboard
-- or via the server-side admin client.
-- Recommended values:
--   email: admin@steelshaft.local
--   password: Admin@123
--   user_metadata.full_name: System Administrator
--   user_metadata.role: admin
