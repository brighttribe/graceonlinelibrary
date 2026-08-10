#!/usr/bin/env python3
"""Enable RLS and add public read policies on all public tables."""
import psycopg2
import os

def get_password():
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    with open(env_path) as f:
        for line in f:
            if line.startswith('SUPABASE_DB_PASSWORD='):
                return line.split('=', 1)[1].strip()
    raise ValueError("SUPABASE_DB_PASSWORD not found in .env.local")

DB = {
    'host': 'db.xhhvbxjllictpxtebeur.supabase.co',
    'dbname': 'postgres',
    'user': 'postgres',
    'password': get_password(),
    'port': 5432,
}

conn = psycopg2.connect(**DB)
conn.autocommit = True
cur = conn.cursor()

# Check current state
cur.execute("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")
tables = cur.fetchall()
print("Current RLS status:")
for t, rls in tables:
    print(f"  {t}: RLS={'ON' if rls else 'OFF'}")

print()

# Enable RLS and add public read policies
for tablename, _ in tables:
    cur.execute(f"ALTER TABLE public.{tablename} ENABLE ROW LEVEL SECURITY")
    print(f"Enabled RLS on {tablename}")

    # Drop existing policy if it exists, then recreate
    cur.execute(f"DROP POLICY IF EXISTS \"Public read access\" ON public.{tablename}")
    cur.execute(f"CREATE POLICY \"Public read access\" ON public.{tablename} FOR SELECT TO public USING (true)")
    print(f"Added read policy on {tablename}")

print()

# Verify
cur.execute("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")
print("Final RLS status:")
for t, rls in cur.fetchall():
    print(f"  {t}: RLS={'ON ✓' if rls else 'OFF ✗'}")

cur.close()
conn.close()
print("\nDone.")
